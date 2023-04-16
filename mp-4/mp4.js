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
        let fog = document.getElementById("fog")
        if (fog) {
            fog.textContent = `fog: ${keysBeingPressed.fog ? 'on' : 'off'}`
        }
    }
    if (event.key.toLowerCase() === 'g') {
        keysBeingPressed.vehicle = !keysBeingPressed.vehicle
        let flight = document.getElementById("flight")
        if (flight) {
            flight.textContent = `mode: ${keysBeingPressed.vehicle ? 'vehicle' : 'flight'}`
        }
    }
    if (event.key.toLowerCase() === 'h') {
        let description = document.getElementById("description")
        if (description) {
            description.style.display = 'none'
        }
        let fps = document.getElementById("fps")
        if (fps) {
            fps.style.display = 'none'
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

    // set the background color of the button to white
    let button = document.getElementById(object_path.replace(/\.obj$/, ''))
    if (button) {
        button.style.backgroundColor = 'white'
        button.style.color = 'black'
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
 * @returns {{indices: Uint32Array, vertices: Float32Array, normals: Float32Array, texCoords: Float32Array, colors: Float32Array}}
 */
function parseObj(objText) {
    let vertices = []
    let normals = []
    let normal_indices = []
    let colors = []
    let indices = []
    let texCoords = []
    let texCoord_indices = []

    // parse obj file
    for (let line of objText.split('\n').map(line => line.trim().split(/\s+/))) {
        if (line[0] === 'v') { // vertex
            vertices.push(parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3]))
            if (line.length === 7) { // vertex colors
                colors.push(parseFloat(line[4]), parseFloat(line[5]), parseFloat(line[6]))
            }
        } else if (line[0] === 'vn') { // vertex normal
            normals.push(parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3]))
        } else if (line[0] === 'vt') { // texture coordinate
            texCoords.push(parseFloat(line[1]), parseFloat(line[2]))
        } else if (line[0] === 'f') { // face
            let face = []
            for (let i = 1; i < line.length; i++) {
                let [index, texture, normal] = line[i].split('/').map(x => parseInt(x))
                let attributes = {}
                if (index !== undefined) attributes.index = index
                if (texture !== undefined) attributes.texture = texture
                if (normal !== undefined) attributes.normal = normal
                face.push(attributes)
            }

            //triangulate the face
            if (face.length < 3) {
                throw Error("Unsupported number of vertices in face: " + face.length)
            }
            let triangles = []
            for (let i = 1; i < face.length - 1; i++) {
                triangles.push([face[0], face[i], face[i + 1]])
            }

            // add indices, colors and normals if they exist
            for (let triangle of triangles) {
                indices.push(...triangle.map(x => x?.index - 1) ?? [])
                texCoord_indices.push(...triangle.map(x => x?.texture - 1) ?? [])
                normal_indices.push(...triangle.map(x => x?.normal - 1) ?? [])
            }
        }
    }

    if (normals.length > 0 && normal_indices.length > 0) { // organize normals according to the indices
        let sorted_normals = new Array(normals.length).fill(0)
        for (let i = 0; i < normal_indices.length; i++) {
            for (let j = 0; j < 3; j++) {
                sorted_normals[indices[i] * 3 + j] = normals[normal_indices[i] * 3 + j]
            }
        }
        normals = sorted_normals
    } else { // generate normals if they are not present
        normals = generateNormals(vertices, indices)
    }

    if (colors.length === 0) { // generate colors if they are not present
        for (let i = 0; i < vertices.length / 3; i++) {
            colors.push(1, 0.373, 0.02)
        }
    }

    if (texCoords.length > 0 && texCoord_indices.length > 0) { // organize texCoords according to the indices
        let sorted_texCoords = new Array(texCoords.length).fill(0)
        for (let i = 0; i < texCoord_indices.length; i++) {
            for (let j = 0; j < 2; j++) {
                sorted_texCoords[indices[i] * 2 + j] = texCoords[texCoord_indices[i] * 2 + j]
            }
        }
        texCoords = sorted_texCoords
    }

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        colors: new Float32Array(colors),
        indices: new Uint32Array(indices),
        texCoords: new Float32Array(texCoords)
    }
}
