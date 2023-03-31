/**
 * Generate vertices, normals, and indices for the terrain
 * @param resolution resolution of the terrain
 * @param slices number of horizontal slices
 * @return {vertices, normals, indices, min, max}
 */
function generateTerrain(resolution, slices) {

    let vertices = []
    let normals = []
    let indices = []

    // create vertices with x, y, z
    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            vertices.push(2*j / resolution - 1, 2*i / resolution - 1, 0)
        }
    }
    let size = vertices.length / 3

    // create indices for keeping track of the triangles
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            let k = (i * (resolution + 1)) + j
            indices.push(k, k + 1, k + resolution + 1)
            indices.push(k + 1, k + resolution + 2, k + resolution + 1)
        }
    }

    // generate terrain
    for (let i = 0; i < slices; i++) {
        // construct a random fault plane
        let fault = glMatrix.vec3.create()
        glMatrix.vec3.set(fault, Math.random() * 2 - 1, Math.random() * 2 - 1, 0)
        let random = glMatrix.vec3.random(glMatrix.vec3.create())

        // raise and lower vertices
        for (let j = 0; j < size; j++) {
            let vertex = glMatrix.vec3.fromValues(vertices[j * 3], vertices[j * 3 + 1], vertices[j * 3 + 2])
            let sub = glMatrix.vec3.create()
            glMatrix.vec3.subtract(sub, vertex, fault)

            if (glMatrix.vec3.dot(sub, random) > 0)
                vertex[2] += 1/resolution
            else
                vertex[2] -= 1/resolution

            for (let k = 0; k < 3; k++) {
                vertices[j * 3 + k] = vertex[k]
            }
        }
    }

    // calculate min and max
    let min = Number.MAX_VALUE
    let max = Number.MIN_VALUE
    for (let i = 0; i < size; i++) {
        min = Math.min(min, vertices[i * 3 + 2])
        max = Math.max(max, vertices[i * 3 + 2])
    }

    // do vertical separation
    let h = (resolution/2) / resolution
    for (let i = 0; i < size; i++) {
        vertices[i * 3 + 2] = (vertices[i * 3 + 2] - min)/(max - min) * h - (h/2)
    }
    // update min and max
    let min_ = min
    let max_ = max
    min = (min_ - min_)/(max_ - min_) * h - (h/2)
    max = (max_ - min_)/(max_ - min_) * h - (h/2)

    // create normals
    normals = Array(vertices.length).fill(0)
    for (let i = 0; i < indices.length; i+=3) {
        let triangle = []
        for (let j = 0; j < 3; j++) {
            triangle.push(glMatrix.vec3.fromValues(vertices[indices[i + j] * 3], vertices[indices[i + j] * 3 + 1], vertices[indices[i + j] * 3 + 2]))
        }

        // inspired from https://www.khronos.org/opengl/wiki/Calculating_a_Surface_Normal
        let u = glMatrix.vec3.create()
        glMatrix.vec3.subtract(u, triangle[1], triangle[0])
        let v = glMatrix.vec3.create()
        glMatrix.vec3.subtract(v, triangle[2], triangle[0])
        let normal = glMatrix.vec3.create()
        glMatrix.vec3.cross(normal, u, v)
        for (let j = 0; j < 3; j++) {
            let normalized = glMatrix.vec3.fromValues(normals[indices[i + j] * 3] + normal[0], normals[indices[i + j] * 3 + 1] + normal[1], normals[indices[i + j] * 3 + 2] + normal[2]);
            glMatrix.vec3.normalize(normalized, normalized);
            for (let k = 0; k < 3; k++) {
                normals[indices[i + j] * 3 + k] = normalized[k]
            }
        }
    }

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices),
        min, max
    }
}

/**
 * Draw terrain
 * @param shaderProgram shader program for drawing terrain
 * @param resolution resolution of the terrain
 * @param slices number of horizontal slices
 * @param cliffCutoff float at which we determine a fragment is a cliff or not
 */
function drawTerrain(shaderProgram, resolution, slices, cliffCutoff) {
    let terrain = generateTerrain(resolution, slices)

    shaderProgram.vertexPosition = gl.getAttribLocation(shaderProgram, "a_vertexPosition")
    shaderProgram.vertexNormal = gl.getAttribLocation(shaderProgram, "a_vertexNormal")
    shaderProgram.modelViewMatrix = gl.getUniformLocation(shaderProgram, "u_modelViewMatrix")
    shaderProgram.projectionMatrix = gl.getUniformLocation(shaderProgram, "u_projectionMatrix")
    shaderProgram.normalMatrix = gl.getUniformLocation(shaderProgram, "u_normalMatrix")
    gl.uniform2fv(gl.getUniformLocation(shaderProgram, "u_HeightRange"), [terrain.min, terrain.max])
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_specularLightColor'), [1, 1, 1])
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_lightPosition'), [1, 1, 1])
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'u_shininess'), 5)
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'u_cliffCutoff'), cliffCutoff)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, terrain.vertices, gl.STATIC_DRAW)
    gl.vertexAttribPointer(shaderProgram.vertexPosition, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shaderProgram.vertexPosition)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, terrain.normals, gl.STATIC_DRAW)
    gl.vertexAttribPointer(shaderProgram.vertexNormal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shaderProgram.vertexNormal)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, terrain.indices, gl.STATIC_DRAW)

    let projectionMatrix = glMatrix.mat4.create()
    let modelViewMatrix = glMatrix.mat4.create()
    let normalMatrix = glMatrix.mat3.create()
    let rotation = 0

    frame = requestAnimationFrame(render)
    function render() {
        if (current_scene !== "terrain") {
            console.log("Dropped frames in terrain.")
            return
        }
        rotation += 0.001
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        glMatrix.mat4.perspective(projectionMatrix, 1, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100)
        let eye = glMatrix.vec3.fromValues(   2 * Math.cos(rotation), 2 * Math.sin(rotation), 2)
        glMatrix.mat4.lookAt(modelViewMatrix, eye, [0, 0, 0], [0, 0, 1])

        glMatrix.mat3.fromMat4(normalMatrix, modelViewMatrix)
        glMatrix.mat3.transpose(normalMatrix, normalMatrix)
        glMatrix.mat3.invert(normalMatrix, normalMatrix)

        gl.uniformMatrix4fv(shaderProgram.modelViewMatrix, false, modelViewMatrix)
        gl.uniformMatrix3fv(shaderProgram.normalMatrix, false, normalMatrix)
        gl.uniformMatrix4fv(shaderProgram.projectionMatrix, false, projectionMatrix)
        gl.drawElements(gl.TRIANGLES, terrain.indices.length, gl.UNSIGNED_INT, 0)

        frame = requestAnimationFrame(render)
    }
}