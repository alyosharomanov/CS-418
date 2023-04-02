function faultingTerrain(vertices, resolution, slices, heightDelta) {
    let size = vertices.length / 3
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
                vertex[2] += heightDelta
            else
                vertex[2] -= heightDelta

            for (let k = 0; k < 3; k++) {
                vertices[j * 3 + k] = vertex[k]
            }
        }
    }
}

function spheroidal(vertices, resolution, iterations) {
    let size = vertices.length / 3

    let test = 0
    for (let i = 0; i < resolution + 1; i++) {
        for (let j = 0; j < resolution + 1; j++) {
            test += 1
        }
    }

    for (let i = 0; i < iterations; i++) {
        let tempVertices = Array(size * 3).fill(0)

        // iterate all vertices
        for (let i = 0; i < resolution + 1; i++) {
            for (let j = 0; j < resolution + 1; j++) {

                // get all neighbors
                let neighbors = []
                let neighborIndices = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]]
                for (let k = 0; k < neighborIndices.length; k++) {
                    //if (neighborIndices[k][0] >= 0 && neighborIndices[k][0] < resolution + 1 && neighborIndices[k][1] >= 0 && neighborIndices[k][1] < resolution + 1) {
                    if (neighborIndices[k][0] >= 0 && neighborIndices[k][0] < resolution + 1 && neighborIndices[k][1] >= 0 && neighborIndices[k][1] < resolution + 1) {
                        let index = neighborIndices[k][0] * (resolution + 1) + neighborIndices[k][1];
                        neighbors.push(index * 3);
                    }
                }

                // calculate the average position of neighbors
                let average = [0, 0, 0]
                for (let k = 0; k < neighbors.length; k++) {
                    for (let l = 0; l < 3; l++) {
                        average[l] += vertices[neighbors[k] + l] / neighbors.length;
                    }
                }

                // move the vertex part-way toward the average position of its neighbors
                for (let k = 0; k < 3; k++) {
                    let idx = i * (resolution + 1) + j
                    tempVertices[idx * 3 + k] = (average[k] + vertices[idx * 3 + k]) * 0.5
                }
            }
        }

        // update the original vertices
        for (let j = 0; j < size; j++) {
            for (let k = 0; k < 3; k++) {
                vertices[j * 3 + k] = tempVertices[j * 3 + k];
            }
        }
    }
}

let neighborMap = [[-1, 0], [1, 0], [0, -1], [0, 1]]

function hydraulic(vertices, resolution, heightDelta, iterations, erosionRate, depositionRate, rainAmount, evaporationRate) {
    let size = vertices.length / 3

    let min = Number.MAX_VALUE
    for (let i = 0; i < size; i++) {
        min = Math.min(min, vertices[i * 3 + 2])
    }

    let waterMap = new Float32Array(size).fill(0);
    let sedimentMap = new Float32Array(size).fill(0);

    for (let iter = 0; iter < iterations; iter++) {

        // Add rain
        for (let i = 0; i < size; i++) {
            waterMap[i] += rainAmount * heightDelta;
        }

        // Calculate flow directions
        let flowMap = new Float32Array(size * 4).fill(0);
        for (let i = 1; i < resolution; i++) {
            for (let j = 1; j < resolution; j++) {
                let idx = (i * (resolution + 1)) + j // getIdx(i, j, resolution);

                for (let k = 0; k < 4; k++) {
                    let neighborIdx = ((i + neighborMap[k][0]) * (resolution + 1)) + (j + neighborMap[k][1]) // getIdx(i + di, j + dj, resolution);

                    let diffHeight = vertices[idx * 3 + 2] + waterMap[idx] - vertices[neighborIdx * 3 + 2] - waterMap[neighborIdx];
                    if (diffHeight > 0) {
                        flowMap[idx * 4 + k] = diffHeight;
                    }
                }

                // Normalize flow
                let totalFlow = flowMap[idx * 4] + flowMap[idx * 4 + 1] + flowMap[idx * 4 + 2] + flowMap[idx * 4 + 3];
                if (totalFlow > 0) {
                    for (let k = 0; k < 4; k++) {
                        flowMap[idx * 4 + k] /= totalFlow;
                    }
                }
            }
        }

        // Erosion and deposition
        for (let i = 1; i < resolution; i++) {
            for (let j = 1; j < resolution; j++) {
                let idx = (i * (resolution + 1)) + j // getIdx(i, j, resolution);

                // Erosion
                let erosionAmount = erosionRate * heightDelta * waterMap[idx];
                let maxErosion = vertices[idx * 3 + 2] - Math.min(vertices[idx * 3 + 2], min);
                erosionAmount = Math.min(erosionAmount, maxErosion);
                vertices[idx * 3 + 2] -= erosionAmount;
                sedimentMap[idx] += erosionAmount;

                // Deposition
                for (let k = 0; k < 4; k++) {
                    let neighborIdx = ((i + neighborMap[k][0]) * (resolution + 1)) + (j + neighborMap[k][1]) // getIdx(i + di, j + dj, resolution);

                    let sedimentTransport = depositionRate * heightDelta * flowMap[idx * 4 + k] * sedimentMap[idx];
                    sedimentMap[idx] -= sedimentTransport;
                    sedimentMap[neighborIdx] += sedimentTransport;

                    vertices[neighborIdx * 3 + 2] += sedimentTransport;
                }

                // Evaporation
                waterMap[idx] *= (1 - evaporationRate * heightDelta);
            }
        }
    }

    // fix edges
    for (let i = 0; i < size * 3; i++) {
        if (vertices[i * 3 + 1] === -1.0) {
            vertices[i * 3 + 2] = vertices[(i + resolution) * 3 + 2]
        }
        if (vertices[i * 3] === -1.0) {
            vertices[i * 3 + 2] = vertices[(i + 1) * 3 + 2]
        }
        if (vertices[i * 3] === 1.0) {
            vertices[i * 3 + 2] = vertices[(i - 1) * 3 + 2]
        }
        if (vertices[i * 3 + 1] === 1.0) {
            vertices[i * 3 + 2] = vertices[(i - resolution) * 3 + 2]
        }
    }

    //fix corners
    vertices[2] = vertices[5] = vertices[3 * resolution + 5]
    vertices[size * 3 - 1] = vertices[size * 3 - 1 - 3] = vertices[(size * 3 - 1) - (3 * resolution) - 3]
}

function verticalSeperation(vertices, resolution) {
    let size = vertices.length / 3
    let min = Number.MAX_VALUE
    let max = Number.MIN_VALUE
    for (let i = 0; i < size; i++) {
        min = Math.min(min, vertices[i * 3 + 2])
        max = Math.max(max, vertices[i * 3 + 2])
    }

    // do vertical separation
    let h = (resolution / 2) / resolution
    for (let i = 0; i < size; i++) {
        vertices[i * 3 + 2] = (vertices[i * 3 + 2] - min) / (max - min) * h - (h / 2)
    }
}

/**
 * Generate vertices, normals, and indices for the terrain
 * @param resolution resolution of the terrain
 * @param slices number of horizontal slices
 * @return {vertices, normals, indices, min, max}
 */
function generateTerrain(resolution, slices, erode, spheroid_it, drain_it, erosion, deposition, rain, evaporation) {

    let vertices = []
    let normals = []
    let indices = []

    // create vertices with x, y, z
    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            vertices.push(2 * j / resolution - 1, 2 * i / resolution - 1, 0)
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
    let heightDelta = Math.min(1 / resolution, .1)
    faultingTerrain(vertices, resolution, slices, heightDelta)
    if (erode === "spheroid") {
        spheroidal(vertices, resolution, spheroid_it)
    } else if (erode === "drain") {
        hydraulic(vertices, resolution, heightDelta, drain_it, erosion, deposition, rain, evaporation)
    }
    verticalSeperation(vertices, resolution)

    // recalculate min and max
    let min = Number.MAX_VALUE
    let max = Number.MIN_VALUE
    for (let i = 0; i < size; i++) {
        min = Math.min(min, vertices[i * 3 + 2])
        max = Math.max(max, vertices[i * 3 + 2])
    }

    // create normals
    normals = Array(vertices.length).fill(0)
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

        //push to normals
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

//const getIdx = (i, j, resolution) => (i * (resolution + 1)) + j;

/**
 * Draw terrain
 * @param shaderProgram shader program for drawing terrain
 * @param resolution resolution of the terrain
 * @param slices number of horizontal slices
 */
function drawTerrain(shaderProgram, resolution, slices, cliffs, erode, spheroid_it, drain_it, erosion, deposition, rain, evaporation) {
    let terrain = generateTerrain(resolution, slices, erode, spheroid_it, drain_it, erosion, deposition, rain, evaporation)

    shaderProgram.vertexPosition = gl.getAttribLocation(shaderProgram, "a_vertexPosition")
    shaderProgram.vertexNormal = gl.getAttribLocation(shaderProgram, "a_vertexNormal")
    shaderProgram.modelViewMatrix = gl.getUniformLocation(shaderProgram, "u_modelViewMatrix")
    shaderProgram.projectionMatrix = gl.getUniformLocation(shaderProgram, "u_projectionMatrix")
    shaderProgram.normalMatrix = gl.getUniformLocation(shaderProgram, "u_normalMatrix")
    gl.uniform2fv(gl.getUniformLocation(shaderProgram, "u_HeightRange"), [terrain.min, terrain.max])
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_ambientLightColor'), [1, 1, 1])
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_specularLightColor'), [1, 1, 1])
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_lightPosition'), [2, 2, 2])
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'u_shininess'), 20)
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'u_cliff'), cliffs)

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
        let eye = glMatrix.vec3.fromValues(2 * Math.cos(rotation), 2 * Math.sin(rotation), 2)
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