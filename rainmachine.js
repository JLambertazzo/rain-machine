"use strict";
(function(global, document) {
    function RainMachine(query, options = {}) {
        // setup thingies here
        this.options = {
            // default options go here
            precipitation: 'rain', // 'rain', 'snow', 'hail'
            wind: 0, // 0, 1, 2 for now
            ...options
        }
        this.element = document.querySelector(query)
        this.content = this.element.querySelector('.rain-content')
        this.css = document.styleSheets[0];
        setStyles(this.css, this.options) // work on this lol
        makeItRain(this.element, this.content, this.options)
    }

    /**
     * Resets the custom rules that are set by RainMachine
     * @param {CSSStyleSheet} css 
     */
    function removeRules(css) {
        const rules = [...css.cssRules]
        if (rules.length < 6) {
            // stops early if not enough styles are set
            return;
        }
        const indicies = []
        indicies.push(rules.findIndex(rule => rule.name === "drop")); // drop keyframe
        indicies.push(rules.findIndex(rule => rule.name === "stem")); // drop keyframe
        indicies.push(rules.findIndex(rule => rule.name === "splat")); // drop keyframe
        indicies.push(rules.findIndex(rule => rule.selectorText === ".drop")); // drop rules
        indicies.push(rules.findIndex(rule => rule.selectorText === ".stem")); // drop rules
        indicies.push(rules.findIndex(rule => rule.selectorText === ".splat")); // drop rules
        indicies.sort((a,b) => b-a).forEach(index => {
            if (index >= 0) {
                css.deleteRule(index)
            }
        });
    }

    function setStyles(css, options) {
        // reset styles in case previous ones exist
        removeRules(css)
        // destructure relevant options
        const { precipitation, wind } = options
        css.insertRule(`
            @keyframes drop {
                0% {
                    /* variable */
                    transform: translateY(0vh) translateX(0vw);
                }
                75% {
                    /* variable */
                    transform: translateY(90vh) translateX(${wind * 15}vw);
                }
                100% {
                    /* variable */
                    transform: translateY(90vh) translateX(${wind * 15}vw);
                }
            }
        `, css.cssRules.length)
        css.insertRule(`
        @keyframes stem {
            0% {
                opacity: 1;
            }
            65% {
                opacity: 1;
            }
            75% {
                opacity: 0;
            }
            100% {
                opacity: 0;
            }
        }
        `, css.cssRules.length)
        css.insertRule(`
        @keyframes splat {
            0% {
              opacity: ${precipitation === "rain" ? 1 : 0};
              transform: scale(0);
            }
            80% {
              opacity: ${precipitation === "rain" ? 1 : 0};
              transform: scale(0);
            }
            90% {
              opacity: ${precipitation === "rain" ? 0.5 : 0};
              transform: scale(1);
            }
            100% {
              opacity: 0;
              transform: scale(1.5);
            }
        }
        `, css.cssRules.length)
        css.insertRule(`
        .drop {
            position: absolute;
            bottom: 100%;
            width: 15px;
            height: 120px;
            pointer-events: none;
            animation: drop 0.5s linear infinite;
        }
        `, css.cssRules.length)
        css.insertRule(`
        .stem {
            /* different for snow */
            width: ${precipitation === 'rain' ? 1 : 10}px;
            height: ${precipitation === 'rain' ? '60%' : '10px'};
            border-radius: ${precipitation === 'rain' ? 0 : 50}%;
            margin-left: 7px;
            /* variable (dark-mode option) */
            background: ivory;
            /* variable (wind) */
            transform: rotate(-${wind * 15}deg);
            animation: stem 0.5s linear infinite;
        }
        `, css.cssRules.length)
        css.insertRule(`
        .splat {
            width: 15px;
            height: 10px;
            border-top: 2px dotted rgba(255, 255, 255, 1);
            border-radius: 50%;
            opacity: 1;
            transform: scale(0);
            animation: splat 5s linear infinite;
        }
        `, css.cssRules.length)
    }

    // helper functions will exist
    function makeItRain(element, content, options) {
        // destructure for convenience
        const { precipitation, wind } = options
        element.innerHTML = "";
        let drops = "";
        for (let i = -20; i < 120; i++) {
            const randoHundo = (Math.floor(Math.random() * 99 + 1));
            const randoFiver = (Math.floor(Math.random() * 4 + 2));
            const snowSize = (Math.floor(Math.random() * 15))
            drops += `
            <div class="drop" style="left:${i}%;bottom: ${(randoFiver + randoFiver - 1 + 100)}%; animation-delay: ${randoHundo/10}s; animation-duration: ${ precipitation === 'snow' ? `6.${9*randoHundo}` : `0.5${randoHundo}`}s;">
                <div class="stem" style="${precipitation === "snow" ? `width: ${snowSize}px;height:${snowSize}px;` : ''}animation-delay: ${randoHundo/10}s; animation-duration: ${ precipitation === 'snow' ? `6.${9*randoHundo}` : `0.5${randoHundo}`}s;"></div>
                <div class="splat" style="animation-delay: ${randoHundo/10}s; animation-duration: ${ precipitation === 'snow' ? `6.${9*randoHundo}` : `0.5${randoHundo}`}s;"></div>
            </div>`;
        }
        element.appendChild(content)
        element.innerHTML += drops;
    }

    RainMachine.prototype = {
        // set functions here
    }

    global.RainMachine = global.RainMachine || RainMachine
})(window, window.document)