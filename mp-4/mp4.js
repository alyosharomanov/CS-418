window.addEventListener('load', setup)
window.addEventListener('resize', fillScreen)
window.addEventListener('popstate', function () {
    location.reload()
})

let keysBeingPressed = {
    w: false,
    s: false,
    a: false,
    d: false,
    arrowup: false,
    arrowdown: false,
    arrowleft: false,
    arrowright: false,
    vehicle: false,
    fog: true,
}

document.addEventListener('keydown', (event) => {
    if (keysBeingPressed.hasOwnProperty(event.key.toLowerCase())) {
        keysBeingPressed[event.key.toLowerCase()] = true
    }
    if (event.key.toLowerCase() === 'f') {
        keysBeingPressed.fog = !keysBeingPressed.fog
    }
    if (event.key.toLowerCase() === 'g') {
        keysBeingPressed.vehicle = !keysBeingPressed.vehicle
    }
    if (event.key.toLowerCase() === 'h') {
        let textbox = document.getElementById("description")
        if (textbox) {
            textbox.style.display = 'none'
        }
    }
})

document.addEventListener('keyup', (event) => {
    if (keysBeingPressed.hasOwnProperty(event.key.toLowerCase())) {
        keysBeingPressed[event.key.toLowerCase()] = false
    }
})

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
        const fpsCounter = document.getElementById("fps")
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

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
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

    let vs_source = await fetch('shaders/terrain-vertex.glsl').then(res => res.text())
    let fs_source = await fetch('shaders/terrain-fragment.glsl').then(res => res.text())
    let shaderProgram = compileAndLinkGLSL(vs_source, fs_source)
    gl.useProgram(shaderProgram)

    let object_path = window.location.hash.substr(1)
    if (object_path === '') {
        object_path = 'example.obj'
    }
    let model_source = await fetch(object_path).then(res => res.text())
    let model = parseObj(model_source)

    drawTerrain(shaderProgram, 100, 100, 'terrain.jpg', model, object_path.replace(/\.obj$/, '.jpg'))
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

/**
 * Parses an obj file and returns an object with the parsed data
 * from: https://webglfundamentals.org/webgl/lessons/webgl-load-obj.html
 * @param objText string with the obj file
 * @return {{indices: Uint32Array, vertices: Float32Array, normals: Float32Array, texCoords: Float32Array}}
 */
function parseObj(objText) {
    let vertices = []
    let texCoords = []
    let normals = []
    let indices = []
    let normal_indices = []

    // parse obj file
    for (const line of objText.split('\n').map(line => line.trim().split(/\s+/))) {
        if (line[0] === 'v') { // vertex
            vertices.push(parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3]))
        } else if (line[0] === 'vn') { // vertex normal
            normals.push(parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3]))
        } else if (line[0] === 'vt') { // texture coordinate
            texCoords.push(parseFloat(line[1]), parseFloat(line[2]))
        } else if (line[0] === 'f') { // face
            let face = []
            for (let i = 1; i < line.length; i++) {
                const parameters = line[i].split('/').map(x => parseInt(x))
                if (parameters.length === 1) {
                    face.push({index: parameters[0]})
                } else if (parameters.length === 2) {
                    face.push({index: parameters[0], normal: parameters[1]})
                } else if (parameters.length === 3) {
                    face.push({index: parameters[0], texture: parameters[1], normal: parameters[2]})
                } else {
                    throw Error("Unsupported number of parameters in face: " + parameters.length)
                }
            }

            // triangulate face
            if (face.length < 3 || face.length > 4) {
                throw Error("Unsupported number of vertices in face: " + face.length)
            }
            const triangles = face.length === 3 ? [face] : [[face[0], face[1], face[2]], [face[0], face[2], face[3]],]

            // add indices
            for (let triangle of triangles) {
                indices.push(...triangle.map(x => x.index - 1))
                normal_indices.push(...triangle.map(x => x.normal - 1))
            }
        }
    }

    if (normals.length > 0) { // organize normals according to the indices
        let sorted_normals = new Float32Array(normals.length).fill(0)
        for (let i = 0; i < normal_indices.length; i++) {
            for (let j = 0; j < 3; j++) {
                sorted_normals[indices[i] * 3 + j] = normals[normal_indices[i] * 3 + j]
            }
        }
        normals = sorted_normals
    } else { // generate normals if they are not present
        normals = generateNormals(vertices, indices)
    }

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices),
        texCoords: new Float32Array(texCoords)
    }
}
