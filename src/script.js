import Experience from "./Experience/Experience.js";
import Analyzer from '/sounds/Analyzer.js'
import Loading from './Loading.js'

const canvas = document.querySelector('canvas.webgl')

const audio = new Analyzer({ autoStart: false })   // the loading screen owns the start
const loading = new Loading()
let experience = null

audio.onLoad(async () => {
    // Both loads run at once: the constructor kicks off the assets, prepare() the
    // music. The button shows at the max of the two, not their sum.
    experience = new Experience(canvas, audio)
    await Promise.all([ experience.ready(), audio.prepare() ])
    loading.ready()
})

// The click unlocks the AudioContext, plays the music and fires 'play'
loading.onEnter(() => audio.start())

audio.onWarmup(() => { if (experience) experience.warmup() })
audio.onPlay(()   => { if (experience) experience.play() })
audio.onStop(()   => { if (experience) experience.stop() })
