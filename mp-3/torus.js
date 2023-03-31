/**
 * Generate vertices, normals, and indices for the torus
 * @param r1 major radius
 * @param r2 minor radius
 * @param res1 number of rings
 * @param res2 points per ring
 * @return {vertices, normals, indices}
 */
function generateTorus(r1, r2, res1, res2) {

    let vertices = []
    let indices = []
    let normals = []

    // generate vertices and normals
    for (let slice = 0; slice <= res2; ++slice) {
        const slice_angle = (slice / res2) * 2 * Math.PI
        const cos_slices = Math.cos(slice_angle)
        const sin_slices = Math.sin(slice_angle)
        const slice_rad = r1 + r2 * cos_slices

        for (let loop = 0; loop <= res1; ++loop) {
            const loop_angle = (loop / res1) * 2 * Math.PI
            const cos_loops = Math.cos(loop_angle)
            const sin_loops = Math.sin(loop_angle)

            vertices.push(slice_rad * cos_loops, slice_rad * sin_loops, r2 * sin_slices)
            normals.push(cos_loops * sin_slices, sin_loops * sin_slices, cos_slices)
        }
    }

    // generate indices
    for (let i = 0; i < res2; ++i) {
        let v1 = i * (res1 + 1)
        let v2 = v1 + res1 + 1

        for (let j = 0; j < res1; ++j) {
            indices.push(v1 + j, v1 + j + 1, v2 + j)
            indices.push(v2 + j, v1 +j + 1, v2 + j + 1)
        }
    }

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint16Array(indices),
    }
}

/**
 * Draw a torus
 * inspired by https://webglfundamentals.org/webgl/lessons/webgl-qna-how-to-create-a-torus.html
 * @param shaderProgram shader program for drawing a torus
 * @param r1 major radius
 * @param r2 minor radius
 * @param res1 number of rings
 * @param res2 points per ring
 */
function drawTorus(shaderProgram, r1, r2, res1, res2) {
    const torus = generateTorus(r1, r2, res1, res2)

    shaderProgram.vertexPosition = gl.getAttribLocation(shaderProgram, "a_vertexPosition")
    shaderProgram.vertexNormal = gl.getAttribLocation(shaderProgram, "a_vertexNormal")
    shaderProgram.modelViewMatrix = gl.getUniformLocation(shaderProgram, "u_modelViewMatrix")
    shaderProgram.projectionMatrix = gl.getUniformLocation(shaderProgram, "u_projectionMatrix")

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, torus.vertices, gl.STATIC_DRAW)
    gl.vertexAttribPointer(shaderProgram.vertexPosition, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shaderProgram.vertexPosition)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, torus.normals, gl.STATIC_DRAW)
    gl.vertexAttribPointer(shaderProgram.vertexNormal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shaderProgram.vertexNormal)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, torus.indices, gl.STATIC_DRAW)

    let rotation = 0

    frame = requestAnimationFrame(render)
    function render() {
        if (current_scene !== "torus") {
            console.log("Dropped frames in torus.")
            return
        }
        rotation += 0.005
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        let projectionMatrix = glMatrix.mat4.create()
        let modelViewMatrix = glMatrix.mat4.create()

        glMatrix.mat4.perspective(projectionMatrix, Math.PI / 3, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100)

        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -5])
        glMatrix.mat4.rotateX(modelViewMatrix, modelViewMatrix, rotation)
        glMatrix.mat4.rotateY(modelViewMatrix, modelViewMatrix, rotation)

        gl.uniformMatrix4fv(shaderProgram.modelViewMatrix, false, modelViewMatrix)
        gl.uniformMatrix4fv(shaderProgram.projectionMatrix, false, projectionMatrix)
        gl.drawElements(gl.TRIANGLES, torus.indices.length, gl.UNSIGNED_SHORT, 0)

        frame = requestAnimationFrame(render)
    }
}