const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])

/**
 * Draw one frame
 */
function draw() {
    gl.clearColor(...IlliniBlue) // f(...[1,2,3]) means f(1,2,3)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

/**
 * Resizes the canvas to completely fill the screen
 */
function fillScreen() {
    let canvas = document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
    // to do: update aspect ratio of projection matrix here
    if (window.gl) {
        gl.viewport(0,0, canvas.width, canvas.height)
        draw()
    }
}

/**
 * Compile, link, other option-independent setup
 */
async function setup(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2',
        // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
        {antialias: false, depth:true, preserveDrawingBuffer:true}
    )
    // to do: more setup here
    fillScreen()
}

/**
 * Generate geometry, render the scene
 */
async function setupScene(scene, options) {
    console.log("To do: render",scene,"with options",options)
}

window.addEventListener('load', setup)
window.addEventListener('resize', fillScreen)