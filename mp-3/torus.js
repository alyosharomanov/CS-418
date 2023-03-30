//inspired by https://webglfundamentals.org/webgl/lessons/webgl-qna-how-to-create-a-torus.html
function createTorus(r1, r2, res1, res2) {
    let vertices = [];
    let indices = [];
    let normals = [];

    for (let slice = 0; slice <= res2; ++slice) {
        const slice_angle = (slice / res2) * 2 * Math.PI;
        const cos_slices = Math.cos(slice_angle);
        const sin_slices = Math.sin(slice_angle);
        const slice_rad = r1 + r2 * cos_slices;

        for (let loop = 0; loop <= res1; ++loop) {
            const loop_angle = (loop / res1) * 2 * Math.PI;
            const cos_loops = Math.cos(loop_angle);
            const sin_loops = Math.sin(loop_angle);

            const x = slice_rad * cos_loops;
            const y = slice_rad * sin_loops;
            const z = r2 * sin_slices;

            vertices.push(x, y, z);
            normals.push(
                cos_loops * sin_slices,
                sin_loops * sin_slices,
                cos_slices);
        }
    }

    const vertsPerSlice = res1 + 1;
    for (let i = 0; i < res2; ++i) {
        let v1 = i * vertsPerSlice;
        let v2 = v1 + vertsPerSlice;

        for (let j = 0; j < res1; ++j) {

            indices.push(v1);
            indices.push(v1 + 1);
            indices.push(v2);

            indices.push(v2);
            indices.push(v1 + 1);
            indices.push(v2 + 1);

            v1 += 1;
            v2 += 1;
        }
    }

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint16Array(indices),
    };
}

function drawTorus(shaderProgram, r1, r2, res1, res2) {
    const torus = createTorus(r1, r2, res1, res2);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, torus.vertices, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, torus.normals, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, torus.indices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(shaderProgram, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

    const aNormal = gl.getAttribLocation(shaderProgram, 'aNormal');
    gl.enableVertexAttribArray(aNormal);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    let uModelViewMatrix = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
    let uProjectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
    let angle = 0

    frame = requestAnimationFrame(render);

    function render() {
        if (current_scene !== "torus") {
            console.log("Dropped frames in torus.")
            return
        }
        clearGL()

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projectionMatrix, Math.PI / 3, aspect, 0.1, 100);

        const modelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -5]);
        glMatrix.mat4.rotateX(modelViewMatrix, modelViewMatrix, angle);
        glMatrix.mat4.rotateY(modelViewMatrix, modelViewMatrix, angle);

        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

        gl.drawElements(gl.TRIANGLES, torus.indices.length, gl.UNSIGNED_SHORT, 0);

        angle += 0.005;
        frame = requestAnimationFrame(render);
    }
}