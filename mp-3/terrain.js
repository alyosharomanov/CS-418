function generateTerrain(resolution, slices, jaggedness) {

    let vertices = [];
    let normals = [];
    let indices = [];

    // create vertices with x, y, z
    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            vertices.push(2*j / resolution - 1);
            vertices.push(2*i / resolution - 1);
            vertices.push(0);
        }
    }

    // create indices for keeping track of the triangles
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            let bottomLeft = (i * (resolution + 1)) + j;
            indices.push(...[bottomLeft, bottomLeft + 1, bottomLeft + resolution + 1]);
            indices.push(...[bottomLeft + 1, bottomLeft + resolution + 2, bottomLeft + resolution + 1]);
        }
    }

    let size = vertices.length / 3;
    let numFaces = indices.length / 3;

    //shape terrain
    for (let i = 0; i < slices; i++) {
        // construct a random fault plane
        let faultPlane = glMatrix.vec3.create();
        let x = Math.random() * 2 - 1;
        let y = Math.random() * 2 - 1;
        glMatrix.vec3.set(faultPlane, x, y, 0);

        let random = glMatrix.vec2.random(glMatrix.vec2.create());
        let randomNormalVec = glMatrix.vec3.fromValues(random[0], random[1], 0);

        // raise and lower vertices
        for (let j = 0; j < size; j++) {
            let vertex = glMatrix.vec3.fromValues(vertices[j * 3], vertices[j * 3 + 1], vertices[j * 3 + 2]);

            let sub = glMatrix.vec3.create();
            glMatrix.vec3.subtract(sub, vertex, faultPlane);

            let delta = jaggedness/100
            let dist = glMatrix.vec3.distance(vertex, faultPlane) / (2 * Math.sqrt(2))

            if (glMatrix.vec3.dot(sub, randomNormalVec) > 0)
                vertex[2] += delta * dist
            else
                vertex[2] -= delta * dist

            vertices[j * 3] = vertex[0];
            vertices[j * 3 + 1] = vertex[1];
            vertices[j * 3 + 2] = vertex[2];
        }
    }

    //do vertical separation
    let h = resolution/4
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    for (let i = 0; i < size; i++) {
        min = Math.min(min, vertices[i * 3 + 2]);
        max = Math.max(max, vertices[i * 3 + 2]);
    }
    /**for (let i = 0; i < size; i++) {
        vertices[i * 3 + 2] = ((vertices[i * 3 + 2] - minZ)/(maxZ - minZ)) * h - (h/2)
    }**/

    // initialize an NArray containing M normals
    let normalsTemp = [];
    for (let i = 0; i < size; i++) {
        normalsTemp.push([0, 0, 0]);
    }

    // iterate all triangles
    for (let i = 0; i < numFaces; i++) {
        let indicesTemp = [];
        indicesTemp.push(indices[i * 3])
        indicesTemp.push(indices[i * 3 + 1])
        indicesTemp.push(indices[i * 3 + 2])

        //let vertices = createAndGetPosDataByIndex(indicesTemp);
        let verticesTemp = []
        for (let i = 0; i < indicesTemp.length; i++) {
            let tmp = glMatrix.vec3.create();
            //getVertex(tmp, indicesTemp[i]);
            tmp[0] = vertices[indicesTemp[i] * 3];
            tmp[1] = vertices[indicesTemp[i] * 3 + 1];
            tmp[2] = vertices[indicesTemp[i] * 3 + 2];
            verticesTemp.push(tmp);
        }

        //let N = computeNormalForTriangles(verticesTemp[0], verticesTemp[1], verticesTemp[2]);

        let sub1 = glMatrix.vec3.create();
        let sub2 = glMatrix.vec3.create();
        glMatrix.vec3.subtract(sub1, verticesTemp[1], verticesTemp[0]);
        glMatrix.vec3.subtract(sub2, verticesTemp[2], verticesTemp[0]);
        let N = glMatrix.vec3.create();
        glMatrix.vec3.cross(N, sub1, sub2);


        // average vertex normalsTemp by scale with factor 0.5
        glMatrix.vec3.scale(N, N, 0.5);

        indicesTemp.forEach(function (index) {
            normalsTemp[index] = normalsTemp[index].map((a, i) => a + N[i]);
        });
    }

    for (let i = 0; i < size; i++) {
        let tmp = glMatrix.vec3.fromValues(normalsTemp[i][0], normalsTemp[i][1], normalsTemp[i][2]);
        glMatrix.vec3.normalize(tmp, tmp);
        normals.push(...tmp);
    }

    min = Number.MAX_VALUE;
    max = Number.MIN_VALUE;
    for (let i = 0; i < size; i++) {
        min = Math.min(min, vertices[i * 3 + 2]);
        max = Math.max(max, vertices[i * 3 + 2]);
    }

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices),
        min, max,
        size
    };
}

function drawTerrain(shaderProgram, resolution, slices, jaggedness) {
    let terrain = generateTerrain(resolution, slices, jaggedness);

    shaderProgram.varying = {};
    shaderProgram.varying.vertexPosition = gl.getAttribLocation(shaderProgram, "vertexPosition");
    shaderProgram.varying.vertexNormal = gl.getAttribLocation(shaderProgram, "vertexNormal");
    shaderProgram.varying.modelViewMatrix = gl.getUniformLocation(shaderProgram, "modelViewMatrix");
    shaderProgram.varying.projectionMatrix = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderProgram.varying.normalMatrix = gl.getUniformLocation(shaderProgram, "normalMatrix");
    shaderProgram.uniform = {};
    shaderProgram.uniform.heightRange = gl.getUniformLocation(shaderProgram, "u_HeightRange")

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, terrain.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(shaderProgram.varying.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderProgram.varying.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, terrain.normals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(shaderProgram.varying.vertexNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderProgram.varying.vertexNormal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, terrain.indices, gl.STATIC_DRAW);

    gl.uniform2fv(shaderProgram.uniform.heightRange, [terrain.min, terrain.max]);

    let modelViewMatrix = glMatrix.mat4.create()
    let projectionMatrix = glMatrix.mat4.create()
    let normalMatrix = glMatrix.mat3.create()
    let rotation = 0

    frame = requestAnimationFrame(animate);
    function animate() {
        if (current_scene !== "terrain") {
            console.log("Dropped frames in terrain.")
            return
        }
        clearGL()
        rotation += 0.001

        glMatrix.mat4.perspective(projectionMatrix, 1, gl.viewportWidth / gl.viewportHeight, 0.1, 2000);
        glMatrix.mat4.lookAt(modelViewMatrix, glMatrix.vec3.fromValues(2 * Math.cos(rotation), 2 * Math.sin(rotation), 2), [0, 0, 0], [0, 0, 1]);

        gl.uniformMatrix4fv(shaderProgram.varying.modelViewMatrix, false, modelViewMatrix);
        glMatrix.mat3.fromMat4(normalMatrix, modelViewMatrix);
        glMatrix.mat3.transpose(normalMatrix, normalMatrix);
        glMatrix.mat3.invert(normalMatrix, normalMatrix);
        gl.uniformMatrix3fv(shaderProgram.varying.normalMatrix, false, normalMatrix);
        gl.uniformMatrix4fv(shaderProgram.varying.projectionMatrix, false, projectionMatrix);

        gl.drawElements(gl.TRIANGLES, terrain.indices.length, gl.UNSIGNED_INT, 0);

        frame = requestAnimationFrame(animate);
    }
}