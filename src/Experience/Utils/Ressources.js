import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import EventEmitter from "./EventEmitter.js";

export default class Ressources extends EventEmitter
{
    constructor(sources)
    {
        super()

        // Options
        this.sources = sources

        // Setup
        this.items = {}
        this.toLoad = this.sources.length
        this.loaded = 0

        this.setLoaders()
        this.startLoading()
    }

    setLoaders()
    {
        this.loaders = {}
        this.loaders.dracoLoader = new DRACOLoader()
        this.loaders.dracoLoader.setDecoderPath("draco/")
        
        this.loaders.gltfLoader = new GLTFLoader()
        this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader)

        this.loaders.textureLoader = new THREE.TextureLoader()
        this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader()
    }

    startLoading()
    {
        // Load each source
        for(const source of this.sources)
        {
            if(source.type === 'gltfModel')
            {
                this.loaders.gltfLoader.load(
                    source.path,
                    (file) =>
                    {
                        this.sourceLoaded(source, file)
                    },
                    undefined,
                    (error) =>
                    {
                        this.sourceFailed(source, error)
                    }
                )
            } else if(source.type === 'texture')
            {
                this.loaders.textureLoader.load(
                    source.path,
                    (file) =>
                    {
                        this.sourceLoaded(source, file)
                    },
                    undefined,
                    (error) =>
                    {
                        this.sourceFailed(source, error)
                    }
                )
            } else if(source.type === 'cubeTexture')
            {
                this.loaders.cubeTextureLoader.load(
                    source.path,
                    (file) =>
                    {
                        this.sourceLoaded(source, file)
                    },
                    undefined,
                    (error) =>
                    {
                        this.sourceFailed(source, error)
                    }
                )
            }

        }
    }

    sourceLoaded(source, file)
    {
        this.items[source.name] = file

        this.loaded++

        if(this.loaded === this.toLoad)
        {
            this.trigger('loaded')
        }
    }

    // Keep counting on failure, otherwise 'loaded' never fires and anything waiting
    // on it (the loading screen) stays up forever. The item is null- loud crash at
    // use, instead of a silent hang here.
    sourceFailed(source, error)
    {
        console.error(`[ressources] failed to load "${source.name}" (${source.path})`, error)

        this.sourceLoaded(source, null)
    }
}