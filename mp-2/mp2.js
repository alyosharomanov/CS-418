var selection = 1
var canvas
var gl
var frame
var shaderProgram

var vertices
var colors
var vertexBuffer
var colorBuffer
var mvMatrix
var pMatrix

function initialize() {
  canvas = document.getElementById("canvas")
  resizeCanvas()
  document.querySelectorAll('input[name="selection"]').forEach(elem => {
    elem.addEventListener('change', radioChanged)
  })
  radioChanged()
  canvas.addEventListener('mousemove', setMousePosition)

  gl = canvas.getContext("webgl2")
  gl.viewportWidth = canvas.width
  gl.viewportHeight = canvas.height
  gl.clearColor(0.0, 0.0, 0.0, 0.1)
  
  run()
}
window.addEventListener('load', initialize)

async function run() {
  frame = 0
  if (selection === 1 || selection === 2 || selection === 3 || selection === 4) {
    let vs_source = await fetch('shaders/general-vertex.glsl').then(res => res.text())
    let fs_source = await fetch('shaders/general-fragment.glsl').then(res => res.text())
    compileAndLinkGLSL(vs_source, fs_source)

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPosition")
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute)
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor")
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute)

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "mvMatrix")
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "pMatrix")

    mvMatrix = glMatrix.mat4.create()
    pMatrix = glMatrix.mat4.create()

    setVertices()
    setColors()
    animate()

  } else if (selection === 5) {
    // inspired from https://webglfundamentals.org/webgl/lessons/webgl-shadertoy.html
    let vs_source = await fetch('shaders/mouse-vertex.glsl').then(res => res.text())
    let fs_source = await fetch('shaders/mouse-fragment.glsl').then(res => res.text())
    compileAndLinkGLSL(vs_source, fs_source)

    vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,]), gl.STATIC_DRAW)
    animateMouseCanvas()
  } else {
    console.error("Undefined Selection ID!")
  }
}

/** Resizes the canvas to be a square that fits on the screen with at least 20% vertical padding */
function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth
  canvas.height = document.documentElement.clientHeight * 0.8
  let new_size = Math.min(canvas.width, canvas.height)
  canvas.width = new_size
  canvas.height = new_size
}

function radioChanged() {
  let radioValue = parseInt(document.querySelector('input[name="selection"]:checked').value)
  if (selection !== radioValue) {
    selection = radioValue
    cancelAnimationFrame(frame)
    run()
  }
}

var mouseX = 0
var mouseY = 0
function setMousePosition(e) {
  const rect = canvas.getBoundingClientRect()
  let trueX = e.clientX - rect.left
  let trueY = rect.height - (e.clientY - rect.top) - 1
  mouseX = trueX + (mouseX - trueX) * 9/10
  mouseY = trueY + (mouseY - trueY) * 9/10
  if (selection === 5) { animateMouseCanvas() }
}

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

  shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vs)
  gl.attachShader(shaderProgram, fs)
  gl.linkProgram(shaderProgram)
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(shaderProgram))
    throw Error("Linking failed")
  }

  gl.useProgram(shaderProgram)
}

function getIllini(x1, x2, y1, y2, indent, scale) {
  let illini = []
  let vertices = [
    [-x2 + indent, y2 - indent], // 0
    [x2 - indent, y2 - indent], // 1
    [x2 - indent, y1 + indent], // 2
    [x1 - indent, y1 + indent], // 3
    [x1 - indent, -y1 - indent], // 4
    [x2 - indent, -y1 - indent], // 5
    [x2 - indent, -y2 + indent], // 6
    [-x2 + indent, -y2 + indent], // 7
    [-x2 + indent, -y1 - indent], // 8
    [-x1 + indent, -y1 - indent], // 9
    [-x1 + indent, y1 + indent], // 10
    [-x2 + indent, y1 + indent], // 11
  ]
  let illini_shape = [
    0, 1, 2,
    0, 11, 2,
    5, 6, 7,
    5, 8, 7,
    10, 3 ,4,
    10, 9, 4,
  ]
  for(let i = 0; i < illini_shape.length; i++) {
    illini = illini.concat(vertices[illini_shape[i]])
  }
  return illini.map(x => x * scale)
}

function setVertices() {
  vertexBuffer = gl.createBuffer()
  if (selection === 1 || selection === 3) {
    // U of I Logo
    vertices = getIllini(.35, .65, .5, 1, 0, .75)
    vertexBuffer.itemSize = 2
    vertexBuffer.numberOfItems = vertices.length / vertexBuffer.itemSize
  } else if (selection === 2) {
    // Square
    vertices = [
      0.5,0.5, 0.5,-0.5, -0.5,-0.5,
      0.5,0.5, -0.5,-0.5, -0.5,0.5,
    ]
    vertexBuffer.itemSize = 2
    vertexBuffer.numberOfItems = vertices.length / vertexBuffer.itemSize
  } else if (selection === 4) {
    // Stick Figure
    vertices = [
      -.1,.25, 0,.4, .1,.25, // head
      -.1,-.1, 0,.38, .1,-.1, // body
      -.3,.1, 0,.2, 0,.1, // l-arm
      .3,.1, 0,.2, 0,.1, // r-arm
      -.1,-.1, -.05,-.3, 0,-.1, // l-leg
      .1,-.1, .05,-.3, 0,-.1, // r-leg
    ]
    vertexBuffer.itemSize = 2
    vertexBuffer.numberOfItems = vertices.length / vertexBuffer.itemSize
  } else {
    vertices = []
    vertexBuffer = []
    console.error("Undefined Selection ID!")
  }
}

function setColors() {
  colorBuffer = gl.createBuffer()
  if (selection === 1 || selection === 3) {
    // U of I Logo
    colors = []
    for (let i = 0; i < vertices.length / 2; i++) {
      colors.push(1, 0.373, 0.02)
    }
    colorBuffer.itemSize = 3
    colorBuffer.numberOfItems = colors.length / colorBuffer.itemSize
  } else if (selection === 2) {
    // Square
    colors = [1,0,1, 0,1,0, 1,0,0, 1,0,1, 1,0,0, 0,0,1,]
    colorBuffer.itemSize = 3
    colorBuffer.numberOfItems = colors.length / colorBuffer.itemSize
  } else if (selection === 4) {
    // Stick Figure
    colors = []
    for (let i = 0; i < vertices.length / 2; i++) {
      colors.push(0, 0, 0)
    }
    colorBuffer.itemSize = 3
    colorBuffer.numberOfItems = colors.length / colorBuffer.itemSize
  } else {
    colors = []
    colorBuffer = []
    console.error("Undefined Selection ID!")
  }
}

function animate() {
  frame = requestAnimationFrame(animate)
  if (selection === 1) {
    glMatrix.mat4.rotate(mvMatrix, mvMatrix, 1/(180) * Math.PI, [0, 0, 1])
    let scale = .01
    if ((frame % 100) >= 50) {scale *= -1}
    glMatrix.mat4.scale(mvMatrix, mvMatrix, [1 + scale, 1 + scale, 1 + scale])
  } else if (selection === 2) {
    glMatrix.mat4.rotate(mvMatrix, mvMatrix, - 1/(360) * Math.PI, [0, 0, 1])
  } else if (selection === 3) {
    let offset = .001
    if (((frame) % 100) >= 50) {offset *= -1}
    for (let i = 0; i < vertices.length; i += 2) {
      if ((i/2) % 2 === 0) {
        vertices[i + 1] += offset
        vertices[i] += offset
      } else {
        vertices[i + 1] -= offset
        vertices[i] -= offset
      }
    }
  } else if (selection === 4) {
    let loop = 100
    let offset = ((frame % loop) - (loop / 2)) / (loop * 10)
    let offset2 = (((frame + 50) % loop) - (loop / 2)) / (loop * 10)
    for (let i = 0; i < vertices.length; i += 2) {
      //head
      if (i === 0) {
        vertices[i + 1] = .25 + (offset / 10)
      }
      if (i === 2) {
        vertices[i + 1] = .4 + (offset / 10)
      }
      if (i === 4) {
        vertices[i + 1] = .25 + (offset / 10)
      }
      //left arm
      if (i === 12) {
        vertices[i + 1] = .1 + offset
      }
      //right arm
      if (i === 18) {
        vertices[i + 1] = .1 + offset2
      }
      //left leg
      if (i === 26) {
        vertices[i] = -.05 - offset
      }
      //right leg
      if (i === 32) {
        vertices[i] = .05 - offset2
      }
    }
  } else {
    console.error("Undefined Selection ID!")
    return
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // load vertices
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW)

  //load colors
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

  //calculate transform and draw to canvas
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix)
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0)
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0)
  gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numberOfItems)
}

function animateMouseCanvas() {
  if (selection !== 5) {return}
  frame += 1
  gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "a_position"))
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "a_position"), 2, gl.FLOAT, false, 0, 0)
  gl.uniform2f(gl.getUniformLocation(shaderProgram, "u_resolution"), canvas.width, canvas.height)
  gl.uniform2f(gl.getUniformLocation(shaderProgram, "u_mouse"), mouseX, mouseY)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}