"use strict";

/**
 * Create an HTML element
 * @param {string} tag The type of HTML element
 * @param {string[]} classes A list of class names to add to the element
 * @param {{[key: string]: string}} props Key/value pairs to set element properties
 * @param  {...HTMLElement} children Children to append to this element
 * @returns {HTMLElement}
 */
const el = (tag, classes = [], props = {}, ...children) => {
  const element = document.createElement(tag);
  classes.forEach((c) => element.classList.add(c));
  Object.entries(props).forEach(([key, value]) =>
    element.setAttribute(key, value)
  );
  children.forEach((child) => element.appendChild(child));
  return element;
};

/**
 * Normalize x over the range [a,b] based on it's value between [min,max]
 * @param {number} x
 * @param {number} max
 * @param {number} min
 * @param {number} a
 * @param {number} b
 * @returns
 */
const normalize = (x, max, min, a, b) =>
  ((b - a) * (x - min)) / (max - min) + a;

(function (global, document) {
  function RainMachine(query, options = {}) {
    // setup thingies here
    this.options = {
      // default options go here
      precipitation: "rain", // 'rain', 'snow', 'hail'
      wind: 0, // 0, 1, 2 for now
      sunAndMoon: true,
      now: new Date(),
      numClouds: 0, // >=0, number of clouds to show
      lightData: {
        sunrise: new Date(new Date().setHours("08")),
        sunset: new Date(new Date().setHours("17")),
      },
      ...validateOptions(options),
    };
    const [colour, sunPos] = skyMath(this.options);
    this.options.sunPos = sunPos;
    this.element = document.querySelector(query);
    this.element.style.backgroundColor = colour;
    this.content = this.element.querySelector(".rain-content");
    // important styles for container/content
    this.element.style.overflow = "hidden";
    this.content.style.zIndex = 100;
    this.styleSheet = setStyles(this.options, query); // work on this lol
    document.head.appendChild(this.styleSheet);
    makeItRain(this.element, this.content, this.options);
  }

  const getSkyHsl = (lightness) => `hsla(195, 100%, ${lightness}%, 1)`;

  /**
   * Validate the user-input options
   * @param {library options} options
   * @returns validated options
   */
  function validateOptions(options) {
    const valid = { ...options };
    if (!["rain", "snow", "hail", "none"].includes(valid.precipitation)) {
      valid.precipitation = "none";
    }
    if (!valid.wind || valid.wind < 0 || valid.wind > 2) {
      valid.wind = 0; // restricted for now
    }
    if (valid.numClouds && valid.numClouds > 40) {
      valid.numClouds = 40;
    }
    if (valid.lightData && typeof valid.lightData.sunrise === "number") {
      valid.lightData.sunrise = new Date(valid.lightData.sunrise);
    }
    if (valid.lightData && typeof valid.lightData.sunset === "number") {
      valid.lightData.sunset = new Date(valid.lightData.sunset);
    }
    return valid;
  }

  /**
   * do the math to find out sky colour and sunPos
   * @param {ListExtender options} options
   * @returns {[string, string]} [colour, sunPos]
   */
  function skyMath(options) {
    const { now } = options;
    const { sunrise, sunset } = options.lightData;
    let colour;
    let sunPos;
    if (now > sunset) {
      const newSunrise = new Date(sunrise);
      newSunrise.setDate(newSunrise.getDate() + 1);
      sunPos = 100 + normalize(now, newSunrise, sunset, 0, 100);
      colour = getSkyHsl(10);
    } else if (now < sunrise) {
      const newSunset = new Date(sunset);
      newSunset.setDate(newSunset.getDate() - 1);
      sunPos = 100 + normalize(now, sunrise, newSunset, 0, 100);
      colour = getSkyHsl(10);
    } else {
      const normalized = normalize(now, sunset, sunrise, -20, 20);
      const lightness = 40 - Math.abs(normalized);
      sunPos = normalize(now, sunset, sunrise, 0, 100);
      colour = getSkyHsl(lightness);
    }
    return [colour, sunPos];
  }

  /**
   * Resets the custom rules that are set by RainMachine
   * @param {CSSStyleSheet} css
   */
  function removeRules(css) {
    const rules = [...css.cssRules];
    if (rules.length < 6) {
      // stops early if not enough styles are set
      return;
    }
    const indicies = [];
    indicies.push(rules.findIndex((rule) => rule.name === "drop")); // drop keyframe
    indicies.push(rules.findIndex((rule) => rule.name === "stem")); // drop keyframe
    indicies.push(rules.findIndex((rule) => rule.name === "splat")); // drop keyframe
    indicies.push(rules.findIndex((rule) => rule.selectorText === ".drop")); // drop rules
    indicies.push(rules.findIndex((rule) => rule.selectorText === ".stem")); // drop rules
    indicies.push(rules.findIndex((rule) => rule.selectorText === ".splat")); // drop rules
    indicies
      .sort((a, b) => b - a)
      .forEach((index) => {
        if (index >= 0) {
          css.deleteRule(index);
        }
      });
  }

  function setStyles(options, query) {
    // reset styles in case previous ones exist
    const styleSheet = document.createElement("style");
    styleSheet.setAttribute("type", "text/css");
    // destructure relevant options
    const { precipitation, wind, sunPos } = options;
    styleSheet.appendChild(
      document.createTextNode(`
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
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
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
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
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
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        @keyframes sun {
            0% {
              transform: rotate(0deg);
            }
            50% {
              transform: rotate(180deg);
            }
            100% {
              transform: rotate(360deg);
            }
        }
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        @keyframes cloud {
            0% {
              transform: translateX(-40vw);
            }
            100% {
              transform: translateX(140vw);
            }
        }
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .drop {
            position: absolute;
            bottom: 100%;
            width: 15px;
            height: 120px;
            pointer-events: none;
            animation: drop 0.5s linear infinite;
            z-index: 10;
        }
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .stem {
            /* different for snow */
            width: ${precipitation === "rain" ? 1 : 10}px;
            height: ${precipitation === "rain" ? "60%" : "10px"};
            border-radius: ${precipitation === "rain" ? 0 : 50}%;
            margin-left: 7px;
            /* variable (dark-mode option) */
            background: ivory;
            /* variable (wind) */
            transform: rotate(-${wind * 15}deg);
            animation: stem 0.5s linear infinite;
        }
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .splat {
            width: 15px;
            height: 10px;
            border-top: 2px dotted rgba(255, 255, 255, 1);
            border-radius: 50%;
            opacity: 1;
            transform: scale(0);
            animation: splat 5s linear infinite;
        }
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .cloud-main {
            width: 12rem;
            height: 4rem;
            background: ${precipitation !== "none" ? "lightgray" : "ivory"};
            opacity: 0.9;
            position: absolute;
            border-radius: 50px;
            animation: cloud ${20 / (wind + 1)}s linear infinite;
        }
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .cloud-sub {
            position: absolute;
            border-radius: 50%;
            background: ${precipitation !== "none" ? "lightgray" : "ivory"};
        }
        `)
    );
    // sun styles
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .rm--sun {
          background: #FFD475;
            opacity: 0.9;
            box-shadow: 0px 0px 64px rgba(158, 230, 254, .6);
            width: 0;
            height: 0;
            padding: 5%;
            border-radius: 50%;
            position: absolute;
            top: ${5 + Math.pow(sunPos - 50, 2) / 100}%;
            left: ${sunPos % 200}%;
            z-index: 6;
        }
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .rm--sun-shadow {
          position: absolute;
          z-index: 2;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: transparent;
          box-shadow: 0px 0px 0px 16px rgba(255, 203, 87, 0.6);
        }
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .rm--sun:before {
          content: "";
          position: absolute;
          z-index: 2;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: transparent;
          box-shadow: 0px 0px 0px 32px rgba(255, 203, 87, 0.4);
        }
      `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .rm--sun:after {
          content: "";
          position: absolute;
          z-index: 2;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: transparent;
          box-shadow: 0px 0px 0px 48px rgba(255, 203, 87, 0.2);
        }
      `)
    );
    // moon styles
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .rm--moon {
            background-color: #F6F6F6;
            opacity: 0.9;
            box-shadow: 0px 0px 64px rgba(158, 230, 254, .6);
            width: 0;
            height: 0;
            padding: 5%;
            border-radius: 50%;
            position: absolute;
            top: ${5 + Math.pow(sunPos - 150, 2) / 100}%;
            left: ${sunPos - (110 % 200)}%;
            z-index: 6;
        }
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .rm--moon-shadow {
          position: absolute;
          z-index: 2;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: transparent;
          box-shadow: 0px 0px 0px 16px rgba(32,94,114,.6);
        }
        `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .rm--moon:before {
          content: "";
          position: absolute;
          z-index: 2;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: transparent;
          box-shadow: 0px 0px 0px 32px rgba(32,94,114,.4);
        }
      `)
    );
    styleSheet.appendChild(
      document.createTextNode(`
        ${query} .rm--moon:after {
          content: "";
          position: absolute;
          z-index: 2;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: transparent;
          box-shadow: 0px 0px 0px 48px rgba(32,94,114,.2);
        }
      `)
    );
    return styleSheet;
  }

  // helper functions will exist
  function makeItRain(element, content, options) {
    // destructure for convenience
    const { precipitation, wind, sunAndMoon, numClouds } = options;
    element.innerHTML = "";
    // make drops
    let drops = "";
    if (precipitation !== "none") {
      for (let i = -20; i < 120; i++) {
        const randoHundo = Math.floor(Math.random() * 99 + 1);
        const randoFiver = Math.floor(Math.random() * 4 + 2);
        const snowSize = Math.floor(Math.random() * 15);
        drops += `
                <div class="drop" style="left:${i}%;bottom: ${
          randoFiver + randoFiver - 1 + 100
        }%; animation-delay: ${randoHundo / 10}s; animation-duration: ${
          precipitation === "snow" ? `6.${9 * randoHundo}` : `0.5${randoHundo}`
        }s;">
                    <div class="stem" style="${
                      precipitation === "snow"
                        ? `width: ${snowSize}px;height:${snowSize}px;`
                        : ""
                    }animation-delay: ${
          randoHundo / 10
        }s; animation-duration: ${
          precipitation === "snow" ? `6.${9 * randoHundo}` : `0.5${randoHundo}`
        }s;"></div>
                    <div class="splat" style="animation-delay: ${
                      randoHundo / 10
                    }s; animation-duration: ${
          precipitation === "snow" ? `6.${9 * randoHundo}` : `0.5${randoHundo}`
        }s;"></div>
                </div>`;
      }
    }
    // make sun and moon
    let sunElement = el("div");
    let moonElement = el("div");
    if (sunAndMoon) {
      sunElement = el("div", ["rm--sun"], {}, el("div", ["rm--sun-shadow"]));
      moonElement = el("div", ["rm--moon"], {}, el("div", ["rm--moon-shadow"]));
    }
    // make clouds
    let clouds = "";
    for (let i = 0; i < numClouds; i++) {
      const cloudHeight =
        Math.random() * 15 +
        Math.random() * 10 * (Math.random() >= 0.5 ? 1 : -1);
      const delay = Math.random() * 20 + i;
      const duration = (Math.random() * 5 + 40) / (wind / 2 + 1);
      const zIndex = Math.random() >= 0.4 ? 7 : 1;
      const mainHeight = Math.random() * 3 + 1;
      const mainWidth = mainHeight * 2.2; //Math.random()*2 + 14;
      clouds += `
            <div class="cloud-main" style="width:0;height:0;padding:${mainHeight}% ${mainWidth}%;top:${cloudHeight}%;animation-delay:-${delay}s;animation-duration:${duration}s;z-index:${zIndex};left:-40vw;">
                <div class="cloud-sub" style="height:0;width:0;padding:20% 20%;top:-27%;left:10%;"></div>
                <div class="cloud-sub" style="height:0;width:0;padding:30% 30%;top:-37%;left:35%;"></div>
            </div>
            `;
    }
    element.appendChild(content);
    element.appendChild(sunElement);
    element.appendChild(moonElement);
    element.innerHTML += drops;
    element.innerHTML += clouds;
  }

  RainMachine.prototype = {
    getSkyColour: function () {
      return skyMath(this.options)[0];
    },
  };

  /**
   * Get type of precipitation according to weather API specs
   * @param {number} code
   * @returns {'rain' | 'snow' | 'none'}
   */
  const processPrecipitation = (code) => {
    const d = Math.floor(code / 100);
    if ([2, 3, 5].includes(d)) {
      return "rain";
    }
    if (d === 6) {
      return "snow";
    }
    return "none";
  };

  /**
   * Transform data from weather API type to rain machine type
   * @param {*} data
   * @returns {{precipitation: 'rain' | 'snow' | 'none', wind: any, numClouds: number, lightData: {sunrise: number, sunset: number}}}
   */
  const toRainMachineOptions = (data) => ({
    precipitation: processPrecipitation(data.weather[0].id),
    wind: data.wind,
    numClouds: data.clouds,
    lightData: {
      sunrise: data.sys.sunrise * 1000,
      sunset: data.sys.sunset * 1000,
    },
  });

  global.RainMachine = global.RainMachine || RainMachine;
  global.RainMachine.toRainMachineOptions = toRainMachineOptions;
})(window, window.document);
