// --- sounds/SoundPlayer -------------------------------------------------------
// "Choose & play the music" for a scene opened on its OWN (not embedded in the
// host). It owns the playlist + the <audio> element + the keyboard shortcuts and
// feeds whatever is playing into the Analyzer to be analysed. The Analyzer itself
// stays pure: it just receives a source and produces signals.
//
// You never new this directly- Analyzer lazy-loads it in standalone (live) mode,
// the same way it lazy-loads AnalyzerDebug. So a scene is still just:
//   const audio = new Analyzer()
//
// Keyboard (standalone only):  m = mic/tracks · . / , = next / prev track
//                              d = hide/show this widget (with the analyzer overlay)
// --------------------------------------------------------------------------------

import { trackIdFromUrl } from './TrackTuningConfig.js'
import PlayerControl from './PlayerControl.js'

export default class SoundPlayer {

	// autoplay: false → only buffer the first track, the scene calls play() later
	// (loading screen- see Analyzer.prepare()/start())
	constructor( analyzer, { autoplay = true } = {} ) {
		this.analyzer = analyzer
		this.autoplay = autoplay
		this.playing = false
		this.tracks = []
		this.trackNames = []
		this.trackIndex = 0
		this.source = 'mp3'        // 'mic' | 'mp3'
		this.trackName = ''
		this.micStream = null

		this.audioEl = new Audio()
		this.audioEl.crossOrigin = 'anonymous'
		this.audioEl.preload = 'auto'      // buffer the whole track, so canplaythrough fires
		this.audioEl.addEventListener( 'ended', () => this.nextTrack() )

		window.addEventListener( 'keydown', this.onKey )
		this.ready = this.start()          // await this to know the music is loaded
	}

	start = async () => {
		try {
			const response = await fetch( '/tracks/tracks.json' )
			this.tracks = await response.json()
			this.trackNames = this.tracks.map( ( t ) => decodeURIComponent( t.split( '/' ).pop().replace( /\.mp3$/i, '' ) ) )
			this.trackIndex = Math.max( 0, this.trackNames.findIndex( ( n ) => /New Person Same Old Mistakes/i.test( n ) ) )   // Tame Impala plays first
			if ( this.tracks.length ) await this.useTrack( this.tracks[ this.trackIndex ] )
			else await this.useMic()
		} catch ( e ) {
			console.warn( '[player] failed to fetch tracks.json, using mic', e )
			await this.useMic()
		}
		this.control = new PlayerControl( {
			getAudioEl: () => this.audioEl,
			getSource: () => this.source,
			getTrackName: () => this.trackName,
			onSkip: () => this.nextTrack(),
			onSeek: ( seconds ) => {
				this.audioEl.currentTime = seconds
				localStorage.setItem( 'vj-last-track-time', this.audioEl.currentTime )
			},
		} )
	}

	useTrack = ( url, startTime = 0 ) => {
		this.analyzer.connectMediaElement( this.audioEl )   // route this element into the analyser
		this.source = 'mp3'
		if ( url ) {
			this.audioEl.src = url
			if ( startTime > 0 ) {
				const onLoadedMetadata = () => {
					this.audioEl.currentTime = startTime
					this.audioEl.removeEventListener( 'loadedmetadata', onLoadedMetadata )
				}
				this.audioEl.addEventListener( 'loadedmetadata', onLoadedMetadata )
			}
			this.trackName = decodeURIComponent( url.split( '/' ).pop().replace( /\.mp3$/i, '' ) )
			this.analyzer.setTrackId( trackIdFromUrl( url ) )   // pick the per-track tuning
		}
		// before the first play: just buffer- the loading screen awaits this
		if ( ! this.autoplay && ! this.playing ) return this.buffer()
		return this.audioEl.play()?.catch( () => {} )
	}

	play = () => {
		this.playing = true
		if ( this.source === 'mic' ) return
		return this.audioEl.play()?.catch( () => {} )
	}

	// Resolve once the current track is buffered- but never hang: a missing file or
	// a slow network must not keep a loading screen up forever.
	buffer = () => new Promise( ( resolve ) => {
		if ( this.audioEl.readyState >= 4 ) return resolve()
		const done = () => {
			clearTimeout( timer )
			this.audioEl.removeEventListener( 'canplaythrough', done )
			this.audioEl.removeEventListener( 'error', done )
			resolve()
		}
		const timer = setTimeout( done, 8000 )
		this.audioEl.addEventListener( 'canplaythrough', done )
		this.audioEl.addEventListener( 'error', done )
	} )

	useMic = async () => {
		if ( ! this.micStream ) {
			this.micStream = await navigator.mediaDevices.getUserMedia( { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } } )
		}
		this.audioEl.pause()
		this.analyzer.connectMic( this.micStream )
		this.source = 'mic'
		this.analyzer.setTrackId( '' )
	}

	nextTrack = () => {
		if ( ! this.tracks.length ) return
		this.trackIndex = ( this.trackIndex + 1 ) % this.tracks.length
		this.useTrack( this.tracks[ this.trackIndex ] )
	}

	prevTrack = () => {
		if ( ! this.tracks.length ) return
		this.trackIndex = ( this.trackIndex - 1 + this.tracks.length ) % this.tracks.length
		this.useTrack( this.tracks[ this.trackIndex ] )
	}

	onKey = ( e ) => {
		if ( document.activeElement && ( document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' ) ) return
		switch ( e.key ) {
			case 'm':
				if ( this.source === 'mic' ) { if ( this.tracks.length ) this.useTrack( this.tracks[ this.trackIndex ] ) }
				else this.useMic()
				break
			case '.':
			case '>':
				this.nextTrack()
				break
			case ',':
			case '<':
				this.prevTrack()
				break
			case 'd':
				this.control?.toggle()   // same key as the analyzer overlay- they hide together
				break
		}
	}

	dispose = () => {
		if ( this.onKey ) window.removeEventListener( 'keydown', this.onKey )
		this.audioEl.pause()
		this.audioEl.src = ''
		this.control?.dispose()
	}

}
