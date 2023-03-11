var animation = 1;
var frame;
var gl;
var vertexPositions;
var vertexColors;
var mvMatrix = glMatrix.mat4.create();
var pMatrix = glMatrix.mat4.create();
var shaderProgram;
var vertexPositionBuffer;
var vertexColorBuffer;
window.addEventListener('load', setup)

async function setup() {
  frame = 0;
  glMatrix.mat4.identity(mvMatrix);
  glMatrix.mat4.identity(pMatrix);

  resizeCanvas()
  let canvas = document.getElementById("canvas");
  document.querySelectorAll('input[name="example"]').forEach(elem => {
    elem.addEventListener('change', radioChanged)
  })
  radioChanged()

  // set up GL context
  gl = canvas.getContext("webgl2");
  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;
  gl.clearColor(0.0, 0.0, 0.0, 0.1);

  if (animation === 1 || animation === 2 || animation === 3 || animation === 4) {
    let vs_source = await fetch('shaders/general-vertex.glsl').then(res => res.text())
    let fs_source = await fetch('shaders/general-fragment.glsl').then(res => res.text())
    await compileAndLinkGLSL(vs_source, fs_source)

    getLocations();
    vertexPositionBuffer = gl.createBuffer();
    getVertexPositions();
    loadVertices();
    vertexColorBuffer = gl.createBuffer();
    getVertexColors();
    loadColors();
    tick();

  } else if (animation === 5) {
    // inspired from https://webglfundamentals.org/webgl/lessons/webgl-shadertoy.html
    let vs_source = await fetch('shaders/mouse-vertex.glsl').then(res => res.text())
    let fs_source = await fetch('shaders/mouse-fragment.glsl').then(res => res.text())
    await compileAndLinkGLSL(vs_source, fs_source)

    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, "a_position");
    const resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
    const mouseLocation = gl.getUniformLocation(shaderProgram, "u_mouse");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1,  1, -1,  1, 1, -1, 1,  1,]), gl.STATIC_DRAW)
    let mouseX = 0;
    let mouseY = 0;

    function setMousePosition(e) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = rect.height - (e.clientY - rect.top) - 1;
      render()
    }
    canvas.addEventListener('mousemove', setMousePosition);

    function render() {
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(mouseLocation, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }
}

/** Resizes the canvas to be a square that fits on the screen with at least 20% vertical padding */
function resizeCanvas() {
  let c = document.querySelector('canvas')
  c.width = c.parentElement.clientWidth
  c.height = document.documentElement.clientHeight * 0.8
  console.log(c.width, c.height)
  if (c.width > c.height){
    c.width = c.height
  } else {
    c.height = c.width
  }
}

function radioChanged() {
  radioValue = parseInt(document.querySelector('input[name="example"]:checked').value)
  if (animation !== radioValue) {
    animation = radioValue;
    cancelAnimationFrame(frame);
    setup();
  }
}

async function compileAndLinkGLSL(vs_source, fs_source) {
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

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vs);
  gl.attachShader(shaderProgram, fs);
  gl.linkProgram(shaderProgram);
  gl.enable(gl.DEPTH_TEST);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }
  gl.useProgram(shaderProgram);
}

function getLocations() {
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

function loadVertices() {
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.DYNAMIC_DRAW);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
}

function loadColors() {
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
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
  ];

  let illini_shape = [
    0, 1, 2,
    0, 11, 2,
    5, 6, 7,
    5, 8, 7,
    10, 3 ,4,
    10, 9, 4,
  ];

  for(var i = 0; i < illini_shape.length; i++) {
    illini = illini.concat(vertices[illini_shape[i]])
  }

  return illini.map(x => x * scale)
}

function getVertexPositions() {
  if (animation === 1 || animation === 3) {
    vertexPositions = getIllini(.35, .65, .5, 1, 0, .75);
    vertexPositionBuffer.itemSize = 2;
    vertexPositionBuffer.numberOfItems = vertexPositions.length / vertexPositionBuffer.itemSize;
  } else if (animation === 2) {
    vertexPositions = [
      0.5,0.5, 0.5,-0.5, -0.5,-0.5,
      0.5,0.5, -0.5,-0.5, -0.5,0.5,
    ];
    vertexPositionBuffer.itemSize = 2;
    vertexPositionBuffer.numberOfItems = vertexPositions.length / vertexPositionBuffer.itemSize;
  } else if (animation === 4) {
    vertexPositions = [
      -.1,.25, 0,.4, .1,.25, //head
      -.1,-.1, 0,.38, .1,-.1, //body
      -.3,.1, 0,.2, 0,.1, //l-arm
      .3,.1, 0,.2, 0,.1, //r-arm
      -.1,-.1, -.05,-.3, 0,-.1, //l-leg
      .1,-.1, .05,-.3, 0,-.1, //r-leg
    ];
    vertexPositionBuffer.itemSize = 2;
    vertexPositionBuffer.numberOfItems = vertexPositions.length / vertexPositionBuffer.itemSize;
  } else {
    console.error("Incorrect Animation ID!")
  }
}

function getVertexColors() {
  if (animation === 1 || animation === 3) {
    vertexColors = [];
    for (let i = 0; i < vertexPositions.length / 2; i++) {
      vertexColors.push(1, 0.373, 0.02);
    }
    vertexColorBuffer.itemSize = 3;
    vertexColorBuffer.numberOfItems = vertexColors.length / vertexColorBuffer.itemSize;
  } else if (animation === 2) {
    vertexColors = [1,0,1, 0,1,0, 1,0,0, 1,0,1, 1,0,0, 0,0,1,];
    vertexColorBuffer.itemSize = 3;
    vertexColorBuffer.numberOfItems = vertexColors.length / vertexColorBuffer.itemSize;
  } else if (animation === 4) {
    vertexColors = [];
    for (let i = 0; i < vertexPositions.length / 2; i++) {
      vertexColors.push(0, 0, 0);
    }
    vertexColorBuffer.itemSize = 3;
    vertexColorBuffer.numberOfItems = vertexColors.length / vertexColorBuffer.itemSize;
  } else {
    console.error("Incorrect Animation ID!")
  }
}

function tick() {
  frame = requestAnimationFrame(tick);
  animate();
  draw();
}

function animate() {
  if (animation === 1) {
    glMatrix.mat4.rotate(mvMatrix, mvMatrix, 1/(180) * Math.PI, [0, 0, 1]);
    let scale = .01;
    if ((frame % 100) >= 50) {scale *= -1}
    glMatrix.mat4.scale(mvMatrix, mvMatrix, [1 + scale, 1 + scale, 1 + scale]);
  } else if (animation === 2) {
    glMatrix.mat4.rotate(mvMatrix, mvMatrix, - 1/(360) * Math.PI, [0, 0, 1]);
  } else if (animation === 3) {
    let offset = .001;
    if (((frame) % 100) >= 50) {offset *= -1}
    for (let i = 0; i < vertexPositions.length; i += 2) {
      if ((i/2) % 2 === 0) {
        vertexPositions[i + 1] += offset;
        vertexPositions[i] += offset;
      } else {
        vertexPositions[i + 1] -= offset;
        vertexPositions[i] -= offset;
      }

    }
  } else if (animation === 4) {
    let loop = 100
    let offset = ((frame % loop) - (loop / 2)) / (loop * 10)
    let offset2 = (((frame + 50) % loop) - (loop / 2)) / (loop * 10)
    for (let i = 0; i < vertexPositions.length; i += 2) {
      //head -.1,.25, 0,.4, .1,.25, //head
      if (i === 0) {
        vertexPositions[i + 1] = .25 + (offset / 10)
      }
      if (i === 2) {
        vertexPositions[i + 1] = .4 + (offset / 10)
      }
      if (i === 4) {
        vertexPositions[i + 1] = .25 + (offset / 10)
      }
      //left arm
      if (i === 12) {
        vertexPositions[i + 1] = .1 + offset
      }
      //right arm
      if (i === 18) {
        vertexPositions[i + 1] = .1 + offset2
      }
      //left leg
      if (i === 26) {
        vertexPositions[i] = -.05 - offset
      }
      //right leg
      if (i === 32) {
        vertexPositions[i] = .05 - offset2
      }
    }
  } else {
    console.error("Incorrect Animation ID!")
  }

  loadVertices();
  loadColors();
}

function draw() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems)
}