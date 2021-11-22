let options = { precipitation: 'rain', wind: 0 }
const sunrise = new Date()
sunrise.setHours('0')
sunrise.setMinutes('0')
sunrise.setSeconds('0')

function setRM() {
    new RainMachine('.rain-container', options)
}

function setRain() {
    options = {...options, precipitation: 'rain'}
    setRM()
}

function setSnow() {
    options = {...options, precipitation: 'snow'}
    setRM()
}

function setHail() {
    options = {...options, precipitation: 'hail'}
    setRM()
}

function setNoWind() {
    options = {...options, wind: 0}
    setRM()
}

function setWind() {
    options = {...options, wind: 1}
    setRM()
}

function setWindy() {
    options = {...options, wind: 2}
    setRM()
}

function setNoClouds() {
    options = {...options, numClouds: 0}
    setRM()
}

function setClouds() {
    options = {...options, numClouds: 5}
    setRM()
}

function setCloudy() {
    options = {...options, numClouds: 25}
    setRM()
}

document.querySelector('#time').addEventListener('input', (event) => {
    const copy = new Date(sunrise)
    copy.setHours(event.target.value)
    document.querySelector("#time-label").innerHTML = copy.toLocaleTimeString()
    options = {...options, now: copy}
    setRM()
})

const now = new Date()
now.setMinutes('0')
now.setSeconds('0')
document.querySelector('#time-label').innerHTML = now.toLocaleTimeString()
document.querySelector('#time').setAttribute('value', now.getHours())
setRM()