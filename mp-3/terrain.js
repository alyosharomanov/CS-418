/**function generateTerrain(resolution, slices, jaggedness) {
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

function calculateColor(terrain, resolution) {
    const colors = new Float32Array(resolution * resolution * 3);

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
    let z_delta = z_max - z_min

    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            const index = y * resolution + x;
            const colorIndex = index * 3;

            // Normalize the height value between 0 and 1
            const heightNormalized = (terrain[index] - z_min) / z_delta

            // Generate colors based on the height value
            const r = heightNormalized;
            const g = heightNormalized;
            const b = heightNormalized;

            colors[colorIndex] = r;
            colors[colorIndex + 1] = g;
            colors[colorIndex + 2] = b;
        }
    }

    return colors;
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

function createTerrainMesh(gl, terrain, resolution) {
    const colors = calculateColor(terrain, resolution);
    const normals = calculateNormals(terrain, resolution);
    const vertices = [];
    const indices = [];

    for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
        const index = y * resolution + x;
        const normalIndex = index * 3;

        const heightLeft = x > 0 ? terrain[index - 1] : terrain[index];
        const heightRight = x < resolution - 1 ? terrain[index + 1] : terrain[index];
        const heightUp = y > 0 ? terrain[index - resolution] : terrain[index];
        const heightDown = y < resolution - 1 ? terrain[index + resolution] : terrain[index];

        const normalX = heightLeft - heightRight;
        const normalY = 2.0;
        const normalZ = heightUp - heightDown;

        const length = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);
        normals[normalIndex] = normalX / length;
        normals[normalIndex + 1] = normalY / length;
        normals[normalIndex + 2] = normalZ / length;
    }
}

    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            const index = y * resolution + x;
            vertices.push(
                x, terrain[index], y,
                normals[index * 3], normals[index * 3 + 1], normals[index * 3 + 2],
                colors[index * 3], colors[index * 3 + 1], colors[index * 3 + 2] // Add colors
            );
        }
    }

    for (let y = 0; y < resolution - 1; y++) {
        for (let x = 0; x < resolution - 1; x++) {
            const i = y * resolution + x;
            indices.push(
                i, i + resolution, i + 1,
                i + resolution, i + resolution + 1, i + 1
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
**/

/** @global The Model matrix */
var modelViewMatrix = glMatrix.mat4.create();
/** @global The Projection matrix */
var projectionMatrix = glMatrix.mat4.create();
/** @global The Normal matrix */
var normalMatrix = glMatrix.mat3.create();

// Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [227 / 255, 191 / 255, 76 / 255];
/** @global Diffuse material color/intensity for Phong reflection */
var kDiffuse = [227 / 255, 191 / 255, 76 / 255];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [227 / 255, 191 / 255, 76 / 255];
/** @global Shininess exponent for Phong reflection */
var shininess = 2;

// Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0, 2, 2];
/** @global Ambient light color/intensity for Phong reflection */
var ambientLightColor = [0.1, 0.1, 0.1];
/** @global Diffuse light color/intensity for Phong reflection */
var diffuseLightColor = [1, 1, 1];
/** @global Specular light color/intensity for Phong reflection */
var specularLightColor = [1, 1, 1];

function generateTerrain(resolution, slices, jaggedness) {

    let positionData = [];
    let normalData = [];
    let faceData = [];

    // positionData: 1D array of floats
    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            positionData.push(2 / resolution * j - 1);
            positionData.push(2 / resolution * i - 1);
            positionData.push(0);
        }
    }

    // faceData
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            // bottom left index
            let bottomLeft = (i * (resolution + 1)) + j;
            let triangular1 = [bottomLeft, bottomLeft + 1, bottomLeft + resolution + 1];
            let triangular2 = [bottomLeft + 1, bottomLeft + resolution + 2, bottomLeft + resolution + 1];
            faceData.push(...triangular1);
            faceData.push(...triangular2);
        }
    }

    // We'll need these to set up the WebGL buffers.
    numVertices = positionData.length / 3;
    numFaces = faceData.length / 3;

    //shapeTerrain();
    //console.log("Terrain: Sculpted terrain");

    let delta = jaggedness/100
    for (let i = 0; i < slices; i++) {
        // construct a random fault plane
        //let p = generateRandomPoint();

        let p = glMatrix.vec3.create();
        let x = Math.random() * 2 - 1;
        let y = Math.random() * 2 - 1;
        glMatrix.vec3.set(p, x, y, 0);


        //let n = generateRandomNormalVec();
        let tmp = glMatrix.vec2.create()
        tmp = glMatrix.vec2.random(tmp);
        let n = glMatrix.vec3.fromValues(tmp[0], tmp[1], 0);

        // raise and lower vertices
        for (let j = 0; j < numVertices; j++) {
            // step1: get vertex b, test which side (b - p) * n >= 0
            let v = glMatrix.vec3.create();
            //getVertex(v, j);
            // MP2: Implement this function!
            v[0] = positionData[j * 3];
            v[1] = positionData[j * 3 + 1];
            v[2] = positionData[j * 3 + 2];

            let sub = glMatrix.vec3.create();
            glMatrix.vec3.subtract(sub, v, p);

            let dist = glMatrix.vec3.distance(v, p);

            //let funcValue = calculateCoefficientFunction(dist);
            let bottomLeft = glMatrix.vec3.fromValues(-1, -1, 0);
            let topRight = glMatrix.vec3.fromValues(1, 1, 0);
            let R = glMatrix.vec3.distance(topRight, bottomLeft);
            //let funcValue = Math.pow(1 - Math.pow(dist / R, 2), 2);
            let funcValue = dist/R

            if (glMatrix.vec3.dot(sub, n) > 0)
                v[2] += delta * funcValue
            else
                v[2] -= delta * funcValue

            //setVertex(b, j);
            positionData[j * 3] = v[0];
            positionData[j * 3 + 1] = v[1];
            positionData[j * 3 + 2] = v[2];
        }
    }

    //do vertical separation
    /**let h = (resolution - 0)/4
    let minZ = Number.MAX_VALUE;
    let maxZ = Number.MIN_VALUE;
    for (let i = 0; i < numVertices; i++) {
        minZ = Math.min(minZ, positionData[i * 3 + 2]);
        maxZ = Math.max(maxZ, positionData[i * 3 + 2]);
    }

    for (let i = 0; i < numVertices; i++) {
        positionData[i * 3 + 2] = ((positionData[i * 3 + 2] - minZ)/(maxZ - minZ))*h-(h/2)
    }**/

    //calculateNormals();
    //console.log("Terrain: Generated normals");
    // MP2: Implement this function!

    // initialize an NArray containing M normals
    let normals = [];
    for (let i = 0; i < numVertices; i++) {
        normals.push([0, 0, 0]);
    }

    // iterate all triangles
    for (let i = 0; i < numFaces; i++) {
        //let indices = getTriangleVertexByIndex(i);
        if (i < 0 || i >= numFaces) {
            throw 'Invalid idx!';
        }
        let indices = [];
        for (let j = 0; j < 3; j++) {
            indices.push(faceData[i * 3 + j]);
        }

        //let vertices = createAndGetPosDataByIndex(indices);

        let vertices = []
        for (let i = 0; i < indices.length; i++) {
            let tmp = glMatrix.vec3.create();
            //getVertex(tmp, indices[i]);
            tmp[0] = positionData[indices[i] * 3];
            tmp[1] = positionData[indices[i] * 3 + 1];
            tmp[2] = positionData[indices[i] * 3 + 2];
            vertices.push(tmp);
        }

        //let N = computeNormalForTriangles(vertices[0], vertices[1], vertices[2]);

        let sub1 = glMatrix.vec3.create();
        let sub2 = glMatrix.vec3.create();
        glMatrix.vec3.subtract(sub1, vertices[1], vertices[0]);
        glMatrix.vec3.subtract(sub2, vertices[2], vertices[0]);
        let N = glMatrix.vec3.create();
        glMatrix.vec3.cross(N, sub1, sub2);


        // average vertex normals by scale with factor 0.5
        glMatrix.vec3.scale(N, N, 0.5);

        indices.forEach(function (index) {
            normals[index] = normals[index].map((a, i) => a + N[i]);
        });
    }

    // normalize each normal in N array to unit length
    for (let i = 0; i < numVertices; i++) {
        let tmp = glMatrix.vec3.fromValues(normals[i][0], normals[i][1], normals[i][2]);
        glMatrix.vec3.normalize(tmp, tmp);
        normalData.push(...tmp);
    }

    return {
        positionData,
        normalData,
        faceData
    };
}

function drawTerrain(shaderProgram, resolution, slices, jaggedness) {

    // Let the Terrain object set up its own buffers.
    let terrain = generateTerrain(resolution, slices, jaggedness);

    // Query the index of each attribute and uniform in the shader program.
    shaderProgram.locations = {};
    shaderProgram.locations.vertexPosition = gl.getAttribLocation(shaderProgram, "vertexPosition");
    shaderProgram.locations.vertexNormal = gl.getAttribLocation(shaderProgram, "vertexNormal");

    shaderProgram.locations.modelViewMatrix = gl.getUniformLocation(shaderProgram, "modelViewMatrix");
    shaderProgram.locations.projectionMatrix = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderProgram.locations.normalMatrix = gl.getUniformLocation(shaderProgram, "normalMatrix");

    shaderProgram.locations.kAmbient = gl.getUniformLocation(shaderProgram, "kAmbient");
    shaderProgram.locations.kDiffuse = gl.getUniformLocation(shaderProgram, "kDiffuse");
    shaderProgram.locations.kSpecular = gl.getUniformLocation(shaderProgram, "kSpecular");
    shaderProgram.locations.shininess = gl.getUniformLocation(shaderProgram, "shininess");

    shaderProgram.locations.lightPosition = gl.getUniformLocation(shaderProgram, "lightPosition");
    shaderProgram.locations.ambientLightColor = gl.getUniformLocation(shaderProgram, "ambientLightColor");
    shaderProgram.locations.diffuseLightColor = gl.getUniformLocation(shaderProgram, "diffuseLightColor");
    shaderProgram.locations.specularLightColor = gl.getUniformLocation(shaderProgram, "specularLightColor");

    shaderProgram.locations.minZ = gl.getUniformLocation(shaderProgram, "minZ");
    shaderProgram.locations.maxZ = gl.getUniformLocation(shaderProgram, "maxZ");

    let vertexArrayObject = gl.createVertexArray();
    let vertexPositionBuffer = gl.createBuffer();
    let vertexNormalBuffer = gl.createBuffer();
    let triangleIndexBuffer = gl.createBuffer();
    // Create and bind the vertex array object.
    gl.bindVertexArray(vertexArrayObject);

    // Create the position buffer and load it with the position data.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(terrain.positionData), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numItems = numVertices;
    console.log("Loaded ", vertexPositionBuffer.numItems, " vertices.");

    // Link the position buffer to the attribute in the shader program.
    gl.vertexAttribPointer(shaderProgram.locations.vertexPosition, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderProgram.locations.vertexPosition);

    // Specify normals to be able to do lighting calculations
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(terrain.normalData), gl.STATIC_DRAW);
    vertexNormalBuffer.itemSize = 3;
    vertexNormalBuffer.numItems = numVertices;
    console.log("Loaded ", vertexNormalBuffer.numItems, " normals.");

    // Link the normal buffer to the attribute in the shader program.
    gl.vertexAttribPointer(shaderProgram.locations.vertexNormal, vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderProgram.locations.vertexNormal);

    // Set up the buffer of indices that tells WebGL which vertices are
    // part of which triangles.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(terrain.faceData), gl.STATIC_DRAW);
    triangleIndexBuffer.itemSize = 1;
    triangleIndexBuffer.numItems = terrain.faceData.length;
    console.log("Loaded ", triangleIndexBuffer.numItems, " triangles.");

    // Set the background color to sky blue (you can change this if you like).
    gl.clearColor(0.82, 0.93, 0.99, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // setMaxMinElevationUniforms();

    let minZ = Number.MAX_VALUE;
    let maxZ = Number.MIN_VALUE;
    for (let i = 0; i < numVertices; i++) {
        let tmp = [0, 0, 0]
        //getVertex(tmp, i);
        tmp[0] = terrain.positionData[i * 3];
        tmp[1] = terrain.positionData[i * 3 + 1];
        tmp[2] = terrain.positionData[i * 3 + 2];

        minZ = Math.min(minZ, tmp[2]);
        maxZ = Math.max(maxZ, tmp[2]);
    }

    gl.uniform1f(shaderProgram.locations.minZ, minZ);
    gl.uniform1f(shaderProgram.locations.maxZ, maxZ);

    //setLightUniforms(ambientLightColor, diffuseLightColor, specularLightColor, lightPosition);

    gl.uniform3fv(shaderProgram.locations.ambientLightColor, ambientLightColor);
    gl.uniform3fv(shaderProgram.locations.diffuseLightColor, diffuseLightColor);
    gl.uniform3fv(shaderProgram.locations.specularLightColor, specularLightColor);
    gl.uniform3fv(shaderProgram.locations.lightPosition, lightPosition);

    //setMaterialUniforms(kAmbient, kDiffuse, kSpecular, shininess);

    gl.uniform3fv(shaderProgram.locations.kAmbient, kAmbient);
    gl.uniform3fv(shaderProgram.locations.kDiffuse, kDiffuse);
    gl.uniform3fv(shaderProgram.locations.kSpecular, kSpecular);
    gl.uniform1f(shaderProgram.locations.shininess, shininess);

    frame = requestAnimationFrame(animate);
    let rotation = 0
    function animate() {
        if (current_scene !== "terrain") {
            console.log("Dropped frames in terrain.")
            return
        }
        clearGL()
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Generate the projection matrix using perspective projection.
        glMatrix.mat4.perspective(projectionMatrix, 1, gl.viewportWidth / gl.viewportHeight, 0.1, 2000);

        // calculate eye Pt factor & referenced by MP1.js
        rotation += 0.001

        glMatrix.mat4.lookAt(modelViewMatrix, glMatrix.vec3.fromValues(2 * Math.cos(rotation), 2 * Math.sin(rotation), 2), [0, 0, 0], [0, 0, 1]);

        //setMatrixUniforms();

        gl.uniformMatrix4fv(shaderProgram.locations.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(shaderProgram.locations.projectionMatrix, false, projectionMatrix);

        // We want to transform the normals by the inverse-transpose of the
        // Model/View matrix
        glMatrix.mat3.fromMat4(normalMatrix, modelViewMatrix);
        glMatrix.mat3.transpose(normalMatrix, normalMatrix);
        glMatrix.mat3.invert(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaderProgram.locations.normalMatrix, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, terrain.faceData.length, gl.UNSIGNED_INT, 0);

        frame = requestAnimationFrame(animate);
    }
}