// --- Loading -------------------------------------------------------------------
// The black screen that hides the scene while the assets load. A CSS animation
// loops until ready() swaps it for the Enter button; clicking Enter fires the
// onEnter callbacks (that click is the user gesture that unlocks the audio) and
// fades the screen out.
// --------------------------------------------------------------------------------

export default class Loading
{
    constructor()
    {
        this.element = document.querySelector('.loading')
        this.button = this.element.querySelector('.loading__enter')
        this.callbacks = []

        this.button.addEventListener('click', () => this.enter())
    }

    onEnter(callback)
    {
        this.callbacks.push(callback)
    }

    // Everything is loaded- stop the loop, reveal the button
    ready()
    {
        this.element.classList.add('is-ready')
    }

    enter()
    {
        if(this.entered) return
        this.entered = true

        // Called straight from the click handler so the AudioContext can resume
        for(const callback of this.callbacks) callback()

        this.hide()
    }

    hide()
    {
        this.element.classList.add('is-hidden')
        this.element.addEventListener('transitionend', (event) =>
        {
            if(event.target === this.element) this.element.remove()
        })
    }
}
