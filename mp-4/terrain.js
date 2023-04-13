function faultingTerrain(vertices, resolution, heightDelta, slices) {
    for (let i = 0; i < slices; i++) {

        // random fault plane
        let fault = glMatrix.vec3.fromValues(Math.random() * 2 - 1, Math.random() * 2 - 1, 0)
        let faultDirection = glMatrix.vec3.random(glMatrix.vec3.create())

        // raise and lower vertices
        for (let j = 0; j < vertices.length / 3; j++) {
            let vertex = glMatrix.vec3.fromValues(vertices[j * 3], vertices[j * 3 + 1], vertices[j * 3 + 2])
            let vertexSubFault = glMatrix.vec3.create()
            glMatrix.vec3.subtract(vertexSubFault, vertex, fault)

            // lift or raise each side of the fault
            if (glMatrix.vec3.dot(vertexSubFault, faultDirection) > 0) {
                vertex[2] += heightDelta
            } else {
                vertex[2] -= heightDelta
            }

            // push to vertices
            for (let k = 0; k < 3; k++) {
                vertices[j * 3 + k] = vertex[k]
            }
        }
    }
}

function spheroidal(vertices, resolution, iterations) {
    let neighborMap = [[-1, 0], [1, 0], [0, -1], [0, 1]]

    for (let iter = 0; iter < iterations; iter++) {
        let tempVertices = Array(vertices.length).fill(0)

        // iterate all vertices
        for (let i = 0; i < resolution + 1; i++) {
            for (let j = 0; j < resolution + 1; j++) {

                // get all neighbors
                let neighbors = []
                for (let k = 0; k < neighborMap.length; k++) {
                    if (i + neighborMap[k][0] >= 0 && i + neighborMap[k][0] < resolution + 1 && j + neighborMap[k][1] >= 0 && j + neighborMap[k][1] < resolution + 1) {
                        let neighborIdx = ((i + neighborMap[k][0]) * (resolution + 1) + (j + neighborMap[k][1])) * 3
                        neighbors.push(neighborIdx)
                    }
                }

                // calculate the average position of neighbors
                let average = [0, 0, 0]
                for (let k = 0; k < neighbors.length; k++) {
                    for (let l = 0; l < 3; l++) {
                        average[l] += vertices[neighbors[k] + l] / neighbors.length
                    }
                }

                // move the vertex part-way toward the average position of its neighbors
                for (let k = 0; k < 3; k++) {
                    let idx = i * (resolution + 1) + j
                    tempVertices[idx * 3 + k] = (average[k] + vertices[idx * 3 + k]) * 0.5
                }
            }
        }

        // deep copy to original vertices
        for (let j = 0; j < vertices.length; j++) {
            vertices[j] = tempVertices[j]
        }
    }
}

function verticalSeparation(vertices, resolution) {
    let min = getMin(vertices)
    let max = getMax(vertices)
    let h = (resolution / 2) / resolution
    for (let i = 0; i < vertices.length / 3; i++) {
        vertices[i * 3 + 2] = (vertices[i * 3 + 2] - min) / (max - min) * h - (h / 2)
    }
}

/**
 * min z of an array of vertices.
 * @param vertices float array of vertices
 * @return {number} min z
 */
function getMin(vertices) {
    let min = Number.MAX_VALUE
    for (let i = 0; i < vertices.length / 3; i++) {
        min = Math.min(min, vertices[i * 3 + 2])
    }
    return min
}

/**
 * max z of an array of vertices.
 * @param vertices float array of vertices
 * @return {number} max z
 */
function getMax(vertices) {
    let max = Number.MIN_VALUE
    for (let i = 0; i < vertices.length / 3; i++) {
        max = Math.max(max, vertices[i * 3 + 2])
    }
    return max
}

function generateNormals(vertices, indices) {
    let normals = Array(vertices.length).fill(0)
    for (let i = 0; i < indices.length; i += 3) {
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
        glMatrix.vec3.normalize(normal, normal)

        // push to normals
        for (let j = 0; j < 3; j++) {
            let normalized = glMatrix.vec3.fromValues(normals[indices[i + j] * 3] + normal[0], normals[indices[i + j] * 3 + 1] + normal[1], normals[indices[i + j] * 3 + 2] + normal[2])
            glMatrix.vec3.normalize(normalized, normalized)
            for (let k = 0; k < 3; k++) {
                normals[indices[i + j] * 3 + k] = normalized[k]
            }
        }
    }
    return normals
}

/**
 * Generate vertices, normals, and indices for the terrain
 * @param resolution resolution of the terrain
 * @param slices number of horizontal slices
 * @return {{indices: Uint32Array, vertices: Float32Array, normals: Float32Array, texCoords: Float32Array}}
 */
function generateTerrain(resolution, slices) {
    // create vertices with x, y, z
    let vertices = []
    let texCoords = []
    for (let i = 0; i < resolution + 1; i++) {
        for (let j = 0; j < resolution + 1; j++) {
            vertices.push(2 * (j / resolution) - 1, 2 * (i / resolution) - 1, 0)
            texCoords.push(j / resolution, i / resolution)
        }
    }

    // create indices for keeping track of the triangles
    let indices = []
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            let k = i * (resolution + 1) + j
            indices.push(k, k + 1, k + resolution + 1)
            indices.push(k + 1, k + resolution + 2, k + resolution + 1)
        }
    }

    // generate terrain
    let heightDelta = Math.min(1 / resolution, .1)
    faultingTerrain(vertices, resolution, heightDelta, slices)
    spheroidal(vertices, resolution, 5)
    verticalSeparation(vertices, resolution)

    // create normals
    let normals = generateNormals(vertices, indices);

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices),
        texCoords: new Float32Array(texCoords)
    }
}

/**
 * calculates camera vectors
 * from https://www.tomdalling.com/blog/modern-opengl/04-cameras-vectors-and-input/
 * @param camera the current camera position
 * @return {{forward: vec3, right: vec3, up: vec3}}
 */
function calculateCameraVectors(camera) {
    let forward = glMatrix.vec3.fromValues(Math.cos(camera.yaw) * Math.cos(camera.pitch), Math.sin(camera.yaw) * Math.cos(camera.pitch), Math.sin(camera.pitch));
    let right = glMatrix.vec3.create();
    let up = glMatrix.vec3.fromValues(0, 0, 1);
    glMatrix.vec3.cross(right, forward, up);
    glMatrix.vec3.normalize(right, right);
    return {forward, right, up};
}

/**
 * Draw terrain
 * @param shaderProgram shader program for drawing terrain
 * @param resolution resolution of the terrain
 * @param slices number of horizontal slices
 * @param terrainTexturePath file path to the texture
 * @param model model to draw on the terrain
 * @param modelTexturePath file path to the model texture
 */
function drawTerrain(shaderProgram, resolution, slices, terrainTexturePath, model, modelTexturePath) {
    let terrain = generateTerrain(resolution, slices)

    let terrainTextureSlot = 0
    let terrainTexture = new Image();
    terrainTexture.src = terrainTexturePath
    terrainTexture.onload = function () {
        gl.activeTexture(gl.TEXTURE0 + terrainTextureSlot);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, terrainTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    terrainTexture.onerror = function () {
        console.log("Error loading terrain texture")
        terrainTextureSlot = undefined
    }

    let modelTextureSlot = 1
    let modelTexture = new Image();
    modelTexture.src = modelTexturePath;
    modelTexture.onload = function () {
        gl.activeTexture(gl.TEXTURE0 + modelTextureSlot);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, modelTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    modelTexture.onerror = function () {
        console.log("Error loading model texture, attempting to use terrain texture")
        modelTextureSlot = terrainTextureSlot
    }

    shaderProgram.vertexPosition = gl.getAttribLocation(shaderProgram, "a_vertexPosition")
    shaderProgram.vertexNormal = gl.getAttribLocation(shaderProgram, "a_vertexNormal")
    shaderProgram.vertexCoordinates = gl.getAttribLocation(shaderProgram, "a_vertexCoordinates");
    shaderProgram.modelViewMatrix = gl.getUniformLocation(shaderProgram, "u_modelViewMatrix")
    shaderProgram.projectionMatrix = gl.getUniformLocation(shaderProgram, "u_projectionMatrix")
    shaderProgram.normalMatrix = gl.getUniformLocation(shaderProgram, "u_normalMatrix")
    shaderProgram.cameraPosition = gl.getUniformLocation(shaderProgram, "u_cameraPosition")
    shaderProgram.image = gl.getUniformLocation(shaderProgram, "u_image")
    shaderProgram.fog = gl.getUniformLocation(shaderProgram, "u_fog")
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_ambientLightColor'), [1, 1, 1])
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_specularLightColor'), [1, 1, 1])
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_fogColor'), [0.075, 0.16, 0.292])
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_lightPosition'), [2, 2, 2])
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'u_shininess'), 20)

    let projectionMatrix = glMatrix.mat4.create()
    let modelViewMatrix = glMatrix.mat4.create()
    let camera = {
        position: glMatrix.vec3.fromValues(0, -1.75, 1.25),
        pitch: 1.2 * Math.PI,
        yaw: 1.5 * Math.PI,
        moveSpeed: 0.005,
        maxPitchUP: 1.5 * Math.PI - 0.01,
        maxPitchDown: .5 * Math.PI + 0.01,
    };

    requestAnimationFrame(render)

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        let cameraVectors = calculateCameraVectors(camera);
        if (keysBeingPressed.w) {
            glMatrix.vec3.scaleAndAdd(camera.position, camera.position, cameraVectors.forward, camera.moveSpeed);
        }
        if (keysBeingPressed.s) {
            glMatrix.vec3.scaleAndAdd(camera.position, camera.position, cameraVectors.forward, -camera.moveSpeed);
        }
        if (keysBeingPressed.d) {
            glMatrix.vec3.scaleAndAdd(camera.position, camera.position, cameraVectors.right, camera.moveSpeed);
        }
        if (keysBeingPressed.a) {
            glMatrix.vec3.scaleAndAdd(camera.position, camera.position, cameraVectors.right, -camera.moveSpeed);
        }
        if (keysBeingPressed.arrowup) {
            camera.pitch -= camera.moveSpeed / 2;
            if (camera.pitch <= camera.maxPitchDown) {
                camera.pitch = camera.maxPitchDown
            }
        }
        if (keysBeingPressed.arrowdown) {
            camera.pitch += camera.moveSpeed / 2;
            if (camera.pitch >= camera.maxPitchUP) {
                camera.pitch = camera.maxPitchUP
            }
        }
        if (keysBeingPressed.arrowright) {
            camera.yaw -= camera.moveSpeed / 2;
        }
        if (keysBeingPressed.arrowleft) {
            camera.yaw += camera.moveSpeed / 2;
        }
        gl.uniform1f(shaderProgram.fog, keysBeingPressed.fog)

        // set the camera
        glMatrix.mat4.perspective(projectionMatrix, 1, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100)
        let target = glMatrix.vec3.create();
        cameraVectors = calculateCameraVectors(camera);
        glMatrix.vec3.add(target, camera.position, cameraVectors.forward);
        glMatrix.mat4.lookAt(modelViewMatrix, camera.position, target, cameraVectors.up);
        gl.uniform3fv(shaderProgram.cameraPosition, camera.position)

        /**
         * Draw the geometry
         * @param shaderProgram the shader program to use
         * @param object the object to draw
         * @param modelViewMatrix the model view matrix
         * @param projectionMatrix the projection matrix
         * @param slot the texture slot to use
         */
        function drawGeometry(shaderProgram, object, modelViewMatrix, projectionMatrix, slot) {
            // bind vertex buffer
            if (object.vertices.length !== 0) {
                gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
                gl.bufferData(gl.ARRAY_BUFFER, object.vertices, gl.STATIC_DRAW)
                gl.vertexAttribPointer(shaderProgram.vertexPosition, 3, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(shaderProgram.vertexPosition)
            } else {
                console.log("No vertex data found for object, skipping")
                return
            }

            // bind normal buffer
            if (object.normals.length !== 0) {
                gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
                gl.bufferData(gl.ARRAY_BUFFER, object.normals, gl.STATIC_DRAW)
                gl.vertexAttribPointer(shaderProgram.vertexNormal, 3, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(shaderProgram.vertexNormal)
            } else {
                gl.disableVertexAttribArray(shaderProgram.vertexNormal)
            }

            // bind texture coordinates
            if (object.texCoords.length !== 0) {
                gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
                gl.bufferData(gl.ARRAY_BUFFER, object.texCoords, gl.STATIC_DRAW)
                gl.vertexAttribPointer(shaderProgram.vertexCoordinates, 2, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(shaderProgram.vertexCoordinates)

                if (slot !== undefined) {
                    gl.uniform1i(shaderProgram.image, slot)
                }
            } else {
                gl.disableVertexAttribArray(shaderProgram.vertexCoordinates)
            }

            // bind index buffer
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, object.indices, gl.STATIC_DRAW)

            // calculate normal matrix from model view matrix
            let normalMatrix = glMatrix.mat3.create()
            glMatrix.mat3.normalFromMat4(normalMatrix, modelViewMatrix)
            glMatrix.mat3.invert(normalMatrix, normalMatrix)
            glMatrix.mat3.transpose(normalMatrix, normalMatrix)

            // set uniforms and draw geometry
            gl.uniformMatrix4fv(shaderProgram.modelViewMatrix, false, modelViewMatrix)
            gl.uniformMatrix3fv(shaderProgram.normalMatrix, false, normalMatrix)
            gl.uniformMatrix4fv(shaderProgram.projectionMatrix, false, projectionMatrix)
            gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_INT, 0)
        }

        // draw terrain
        drawGeometry(shaderProgram, terrain, modelViewMatrix, projectionMatrix, terrainTextureSlot);

        //draw model
        let modelViewMatrix2 = glMatrix.mat4.clone(modelViewMatrix);
        let scale = 0.25
        glMatrix.mat4.scale(modelViewMatrix2, modelViewMatrix2, [scale, scale, scale]);
        glMatrix.mat4.translate(modelViewMatrix2, modelViewMatrix2, [0, 0, 1 + scale + terrain.vertices[(resolution + 1) * (resolution / 2) * 3 + 2]]);
        drawGeometry(shaderProgram, model, modelViewMatrix2, projectionMatrix, modelTextureSlot);

        // request next frame
        requestAnimationFrame(render)
    }
}
