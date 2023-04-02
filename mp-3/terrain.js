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

function hydraulic(vertices, resolution, heightDelta, iterations, erosionRate, depositionRate, rainAmount, evaporationRate) {
    let min = getMin(vertices)
    let water = new Float32Array(vertices.length / 3).fill(0)
    let sediment = new Float32Array(vertices.length / 3).fill(0)

    for (let iter = 0; iter < iterations; iter++) {
        // add rain
        for (let i = 0; i < vertices.length / 3; i++) {
            water[i] += rainAmount * heightDelta
        }

        // calculate flow
        let flow = new Float32Array((vertices.length / 3) * 4).fill(0)
        for (let i = 0; i < resolution + 1; i++) {
            for (let j = 0; j < resolution + 1; j++) {
                let idx = i * (resolution + 1) + j

                // check all neighbors
                for (let k = 0; k < neighborMap.length; k++) {
                    if (i + neighborMap[k][0] >= 0 && i + neighborMap[k][0] < resolution + 1 && j + neighborMap[k][1] >= 0 && j + neighborMap[k][1] < resolution + 1) {
                        let neighborIdx = (i + neighborMap[k][0]) * (resolution + 1) + (j + neighborMap[k][1])
                        let diff = vertices[idx * 3 + 2] + water[idx] - vertices[neighborIdx * 3 + 2] - water[neighborIdx]
                        if (diff > 0) {
                            flow[idx * 4 + k] = diff
                        }
                    }
                }

                // normalize flow
                let totalFlow = flow[idx * 4] + flow[idx * 4 + 1] + flow[idx * 4 + 2] + flow[idx * 4 + 3]
                if (totalFlow > 0) {
                    for (let k = 0; k < 4; k++) {
                        flow[idx * 4 + k] /= totalFlow
                    }
                }
            }
        }

        // calculate erosion and deposition
        for (let i = 0; i < resolution + 1; i++) {
            for (let j = 0; j < resolution + 1; j++) {
                let idx = i * (resolution + 1) + j

                // erosion
                let erosion = Math.min(erosionRate * heightDelta * water[idx], vertices[idx * 3 + 2] - Math.min(vertices[idx * 3 + 2], min))
                vertices[idx * 3 + 2] -= erosion
                sediment[idx] += erosion

                // deposition
                for (let k = 0; k < neighborMap.length; k++) {
                    if (i + neighborMap[k][0] >= 0 && i + neighborMap[k][0] < resolution + 1 && j + neighborMap[k][1] >= 0 && j + neighborMap[k][1] < resolution + 1) {
                        let neighborIdx = (i + neighborMap[k][0]) * (resolution + 1) + (j + neighborMap[k][1])

                        let deposition = depositionRate * heightDelta * flow[idx * 4 + k] * sediment[idx]
                        sediment[idx] -= deposition
                        sediment[neighborIdx] += deposition
                        vertices[neighborIdx * 3 + 2] += deposition
                    }
                }

                // evaporation
                water[idx] *= 1 - evaporationRate * heightDelta
            }
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

function toSphere(vertices) {
    for (let i = 0; i < vertices.length / 3; i++) {
        let latitude = (vertices[i * 3] + 1) * Math.PI / 2;
        let longitude = (vertices[i * 3 + 1] + 1) * Math.PI;
        vertices[i * 3] = vertices[i * 3 + 2] + Math.sin(latitude) * Math.cos(longitude)
        vertices[i * 3 + 1] = vertices[i * 3 + 2] + Math.sin(latitude) * Math.sin(longitude)
        vertices[i * 3 + 2] = vertices[i * 3 + 2] + Math.cos(latitude)
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

/**
 * map of neighbors from [0, 0]
 */
let neighborMap = [[-1, 0], [1, 0], [0, -1], [0, 1]]

/**
 * Generate vertices, normals, and indices for the terrain
 * @param resolution resolution of the terrain
 * @param slices number of horizontal slices
 * @param sphere is a sphere or not
 * @param erode erosion type
 * @param spheroid_it spheroidal erosion iterations
 * @param drain_it hydraulic erosion iterations
 * @param erosion hydraulic erosion rate
 * @param deposition hydraulic deposition rate
 * @param rain hydraulic rain rate
 * @param evaporation hydraulic evaporation rate
 * @return {{indices: Uint32Array, min: number, vertices: Float32Array, max: number, normals: Float32Array}}
 */
function generateTerrain(resolution, slices, sphere, erode, spheroid_it, drain_it, erosion, deposition, rain, evaporation) {

    // create vertices with x, y, z
    let vertices = []
    for (let i = 0; i < resolution + 1; i++) {
        for (let j = 0; j < resolution + 1; j++) {
            vertices.push(2 * (j / resolution) - 1, 2 * (i / resolution) - 1, 0)
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
    if (erode === "spheroid") {
        spheroidal(vertices, resolution, spheroid_it)
    } else if (erode === "drain") {
        hydraulic(vertices, resolution, heightDelta, drain_it, erosion, deposition, rain, evaporation)
    }
    verticalSeparation(vertices, resolution)
    if (sphere) {
        toSphere(vertices)
    }

    // create normals
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

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices),
        min: getMin(vertices),
        max: getMax(vertices)
    }
}

/**
 * Draw terrain
 * @param shaderProgram shader program for drawing terrain
 * @param resolution resolution of the terrain
 * @param slices number of horizontal slices
 * @param cliffs has cliffs or not
 * @param sphere is a sphere or not
 * @param erode erosion type
 * @param spheroid_it spheroidal erosion iterations
 * @param drain_it hydraulic erosion iterations
 * @param erosion hydraulic erosion rate
 * @param deposition hydraulic deposition rate
 * @param rain hydraulic rain rate
 * @param evaporation hydraulic evaporation rate
 */
function drawTerrain(shaderProgram, resolution, slices, cliffs, sphere, erode, spheroid_it, drain_it, erosion, deposition, rain, evaporation) {
    let terrain = generateTerrain(resolution, slices, sphere, erode, spheroid_it, drain_it, erosion, deposition, rain, evaporation)

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