import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

export default class Credits
{
    constructor()
    {
        this.credits = document.querySelector('.credits')
        this.childrens = Array.from(this.credits.children)

        gsap.registerPlugin(SplitText) 
    }

    hide()
    {
        this.credits.style.opacity = 0
    }

    show()
    {   
        this.childrens.forEach((child) => { child.classList.add("split") })

        const split = SplitText.create(".split", { type: "words", wordsClass: "word" })

        gsap.from(split.words, {
            duration: 1,
            y: 100,       // animate from 100px below
            autoAlpha: 0, // fade in from opacity: 0 and visibility: hidden
            stagger: 0.05, // 0.05 seconds between each
            // The word wrappers are inline-block, which text-decoration can't reach,
            // so put the original markup back to get the native link underline
            onComplete: () =>
            {
                split.revert()
                this.childrens.forEach((child) => { child.classList.remove("split") })
            }
        })
    }
}