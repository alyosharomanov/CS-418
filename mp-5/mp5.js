window.addEventListener('load', setup)
window.addEventListener('resize', fillScreen)

let lastTime
let frames = 0

/**
 * Updates the FPS counter
 * From https://webglfundamentals.org/webgl/lessons/webgl-qna-recording-fps-in-webgl.html
 * @param timestamp current time in milliseconds
 */
function updateFPS(timestamp) {
    // if this is the first time the function is called, set the lastTime to the current time
    if (!lastTime) {
        lastTime = timestamp
    }

    // increment the frame counter
    frames++

    // update every second
    if (timestamp - lastTime >= 1000) {
        let fpsCounter = document.getElementById("fps")
        if (fpsCounter) {
            fpsCounter.textContent = `FPS: ${frames}`
        }
        lastTime = timestamp
        frames = 0
    }
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
    if (window.gl) {
        gl.enable(gl.DEPTH_TEST)
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0.075, 0.16, 0.292, 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    }
}

/**
 * Sets up the WebGL context and starts the rendering loop
 */
async function setup() {
    window.gl = document.querySelector('canvas').getContext('webgl2', {
        // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
        antialias: false, depth: true, preserveDrawingBuffer: true
    })
    fillScreen()

    let vs_source = await fetch('shaders/burst-vertex.glsl').then(res => res.text())
    let fs_source = await fetch('shaders/burst-fragment.glsl').then(res => res.text())
    let shaderProgram = compileAndLinkGLSL(vs_source, fs_source)
    gl.useProgram(shaderProgram)
}

/**
 * Compiles a vertex and fragment shader to a shader program
 * @param vs_source string with the vertex shader
 * @param fs_source string with the fragment shader
 * @returns {WebGLProgram} compiled shader program
 */
function compileAndLinkGLSL(vs_source, fs_source) {
    let vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, vs_source)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    let fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, fs_source)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    let shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vs)
    gl.attachShader(shaderProgram, fs)
    gl.linkProgram(shaderProgram)
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(shaderProgram))
        throw Error("Linking failed")
    }

    return shaderProgram
}
