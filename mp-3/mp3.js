let shaderPrograms = [];
let current_scene = "null"
let frame = 0

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
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0,0, canvas.width, canvas.height)
        gl.clearColor(0.075, 0.16, 0.292, 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
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

    let vs_source_terrain = await fetch('shaders/terrain-vertex.glsl').then(res => res.text())
    let fs_source_terrain = await fetch('shaders/terrain-fragment.glsl').then(res => res.text())
    shaderPrograms["terrain"] = compileAndLinkGLSL(vs_source_terrain, fs_source_terrain)

    let vs_source_torus = await fetch('shaders/torus-vertex.glsl').then(res => res.text())
    let fs_source_torus = await fetch('shaders/torus-fragment.glsl').then(res => res.text())
    shaderPrograms["torus"] = compileAndLinkGLSL(vs_source_torus, fs_source_torus)

    fillScreen()
}

/**
 * Generate geometry, render the scene
 */
async function setupScene(scene, options) {
    console.log("To do: render",scene,"with options",options)

    if (current_scene !== scene) {
        console.log("Changing shader")
        cancelAnimationFrame(frame)
        gl.useProgram(shaderPrograms[scene])
        current_scene = scene
    }

    if (scene === "terrain") {
        drawTerrain(shaderPrograms[scene], options["resolution"], options["slices"], options["cliffCutoff"])
    } else if (scene === "torus") {
        drawTorus(shaderPrograms[scene], options["r1"], options["r2"], options["res1"], options["res2"])
    }
}

window.addEventListener('load', setup)
window.addEventListener('resize', fillScreen)

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