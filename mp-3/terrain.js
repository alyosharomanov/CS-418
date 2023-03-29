function generateTerrain(resolution, slices, jaggedness) {
    const terrain = new Float32Array(resolution * resolution);

    //generate naive terrain
    for (let i = 0; i < slices; i++) {
        const x1 = Math.random() * resolution;
        const y1 = Math.random() * resolution;
        const x2 = Math.random() * resolution;
        const y2 = Math.random() * resolution;

        for (let y = 0; y < resolution; y++) {
            for (let x = 0; x < resolution; x++) {
                const index = y * resolution + x;
                const side = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);

                if (side > 0) {
                    terrain[index] += 1/jaggedness;
                } else {
                    terrain[index] -= 1/jaggedness;
                }
            }
        }
    }

    //do vertical separation
    let h = (resolution - 0)/4
    let z_min = terrain[0]
    let z_max = terrain[0]
    for(let i= 1; i<terrain.length; i++){
        if(parseInt(terrain[i],10) < z_min){
            z_min = terrain[i];
        }
        if(parseInt(terrain[i],10) > z_max){
            z_max = terrain[i];
        }
    }
    for (let i = 0; i < terrain.length; i++) {
        terrain[i] = ((terrain[i] - z_min)/(z_max - z_min))*h-(h/2)
    }

    return terrain;
}

function calculateNormals(terrain, width, height) {
    const normals = new Float32Array(width * height * 3);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const normalIndex = index * 3;

            const heightLeft = x > 0 ? terrain[index - 1] : terrain[index];
            const heightRight = x < width - 1 ? terrain[index + 1] : terrain[index];
            const heightUp = y > 0 ? terrain[index - width] : terrain[index];
            const heightDown = y < height - 1 ? terrain[index + width] : terrain[index];

            const normalX = heightLeft - heightRight;
            const normalY = 2.0;
            const normalZ = heightUp - heightDown;

            const length = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);
            normals[normalIndex] = normalX / length;
            normals[normalIndex + 1] = normalY / length;
            normals[normalIndex + 2] = normalZ / length;
        }
    }

    return normals;
}

function createTerrainMesh(gl, terrain, normals, width, height) {
    const colors = generateColorBuffer(terrain, height);
    const vertices = [];
    const indices = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            vertices.push(
                x, terrain[index], y,
                normals[index * 3], normals[index * 3 + 1], normals[index * 3 + 2],
                colors[index * 3], colors[index * 3 + 1], colors[index * 3 + 2] // Add colors
            );
        }
    }

    for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
            const i = y * width + x;
            indices.push(
                i, i + width, i + 1,
                i + width, i + width + 1, i + 1
            );
        }
    }

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    return {
        vertexBuffer,
        indexBuffer,
        colorBuffer,
        numVertices: indices.length
    };
}

function generateColorBuffer(terrain, resolution) {
    const colors = new Float32Array(resolution * resolution * 3);

    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            const index = y * resolution + x;
            const colorIndex = index * 3;

            // Normalize the height value between 0 and 1
            const heightNormalized = (terrain[index] + resolution / 4) / (resolution / 2);

            // Generate colors based on the height value
            const r = heightNormalized * 0.5 + 0.5;
            const g = heightNormalized * 0.7 + 0.3;
            const b = heightNormalized * 0.9;

            colors[colorIndex] = r;
            colors[colorIndex + 1] = g;
            colors[colorIndex + 2] = b;
        }
    }

    return colors;
}

function drawTerrain(shaderProgram, resolution, slices, jaggedness) {
    const terrain = generateTerrain(resolution, slices, jaggedness);
    const normals = calculateNormals(terrain, resolution, resolution);
    const terrainMesh = createTerrainMesh(gl, terrain, normals, resolution, resolution);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    const projectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projectionMatrix, Math.PI / 4, aspect, 0.1, 1000);

    const viewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.lookAt(viewMatrix, [0, resolution * 1.5, resolution * 1.5], [resolution / 2, 0, resolution / 2], [0, 1, 0]);

    const modelMatrix = glMatrix.mat4.create();
    glMatrix.mat4.identity(modelMatrix);

    const modelViewProjectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
    glMatrix.mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix);

    const normalMatrix = glMatrix.mat4.create();
    glMatrix.mat4.invert(normalMatrix, modelViewProjectionMatrix);
    glMatrix.mat4.transpose(normalMatrix, normalMatrix);

    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_Vertex');
    gl.bindBuffer(gl.ARRAY_BUFFER, terrainMesh.vertexBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(positionLocation);

    const normalLocation = gl.getAttribLocation(shaderProgram, 'a_Vertex_normal');
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainMesh.indexBuffer);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 36, 12);
    gl.enableVertexAttribArray(normalLocation);

    const colorLocation = gl.getAttribLocation(shaderProgram, 'a_Color');
    gl.bindBuffer(gl.ARRAY_BUFFER, terrainMesh.vertexBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 36, 24);
    gl.enableVertexAttribArray(colorLocation);

    const modelViewProjectionLocation = gl.getUniformLocation(shaderProgram, 'u_PVM_transform');
    const normalMatrixLocation = gl.getUniformLocation(shaderProgram, 'u_VM_transform');

    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_Light_position'), [1, 100, 1]);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_Light_color'), [.1, .1, .1]);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'u_Shininess'), 128);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_Ambient_color'), [0.2, 0.2, 0.2]);

    let rotation = 0;

    frame = requestAnimationFrame(render);

    function render() {
        if (current_scene !== "terrain") {
            console.log("Dropped frames in terrain.")
            return
        }
        draw()

        // Update rotation and model matrix
        //rotation += 0.01;
        //glMatrix.mat4.identity(modelMatrix);
        //glMatrix.mat4.rotateY(modelMatrix, modelMatrix, rotation);

        rotation += 0.0025;

        //const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

        // Compute the new camera position based on rotation
        const cameraRadius = resolution * 1.5;
        const cameraPosition = [
            Math.sin(rotation) * cameraRadius,
            resolution * 0.5,
            Math.cos(rotation) * cameraRadius
        ]

        // Update the view matrix with the new camera position
        glMatrix.mat4.lookAt(viewMatrix, cameraPosition, [resolution / 2, 0, resolution / 2], [0, 1, 0]);


        // Compute the model-view-projection and normal matrices
        glMatrix.mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
        glMatrix.mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix);
        glMatrix.mat4.invert(normalMatrix, modelViewProjectionMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);


        gl.uniformMatrix4fv(modelViewProjectionLocation, false, modelViewProjectionMatrix);
        gl.uniformMatrix4fv(normalMatrixLocation, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, terrainMesh.numVertices, gl.UNSIGNED_SHORT, 0);

        frame = requestAnimationFrame(render);
    }
}