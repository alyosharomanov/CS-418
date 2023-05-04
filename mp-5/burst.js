class Sphere {
    /**
     * Creates a sphere
     * @param position the position of the sphere
     * @param velocity the velocity of the sphere
     * @param radius the radius of the sphere
     * @param color the color of the sphere
     */
    constructor(position, velocity, radius, color) {
        this.position = position
        this.velocity = velocity
        this.radius = radius
        this.color = color
    }
}

let spheres

/**
 * Initialize sphere data randomly within the bounding box
 */
function resetSpheres() {
    spheres = []

    for (let i = 0; i < numSpheres; i++) {
        const position = [
            boundingBoxSize * (Math.random() - 0.5),
            boundingBoxSize * (Math.random() - 0.5),
            boundingBoxSize * (Math.random() - 0.5)
        ]

        const velocity = [
            Math.random(),
            Math.random(),
            Math.random()
        ]

        const radius = Math.random() * 0.06 + 0.03

        const color = [
            Math.random(),
            Math.random(),
            Math.random(),
            1.0
        ]

        spheres.push(new Sphere(position, velocity, radius, color))
    }
}


/**
 * Apply gravity, drag, and check for collisions
 * @param elapsedTime the time elapsed since the last update
 */
function updateSpherePositions(elapsedTime) {
    for (const sphere of spheres) {
        // update position
        sphere.position[0] += sphere.velocity[0] * elapsedTime
        sphere.position[1] += sphere.velocity[1] * elapsedTime
        sphere.position[2] += sphere.velocity[2] * elapsedTime

        // apply gravity
        sphere.velocity[1] += gravity * elapsedTime

        // apply drag
        sphere.velocity[0] *= drag
        sphere.velocity[1] *= drag
        sphere.velocity[2] *= drag

        // Check for collisions with bounding box
        for (let i = 0; i < 3; i++) {
            // check if sphere is outside the box
            if (Math.abs(sphere.position[i]) + sphere.radius > boundingBoxSize / 2) {

                //update velocity, elastic collision for x and z, inelastic for y
                if (i === 1) {
                    sphere.velocity[i] *= -.6
                    // set to zero if velocity is small enough
                    if (Math.abs(sphere.velocity[i]) < 0.1) {
                        sphere.velocity[i] = 0
                    }
                } else {
                    sphere.velocity[i] *= -.9
                }

                // update position to be inside the box
                if (sphere.position[i] > 0) {
                    sphere.position[i] = (boundingBoxSize / 2 - sphere.radius) - elapsedTime
                } else {
                    sphere.position[i] = -(boundingBoxSize / 2 - sphere.radius) - elapsedTime
                }
            }
        }
    }
}

/**
 * Check if a reset is needed
 * Kinetic energy formula taken from https://www.geeksforgeeks.org/program-to-calculate-kinetic-energy-and-potential-energy/
 * @return {boolean} true if a reset is needed, false otherwise
 */
function spheresShouldReset() {
    let totalEnergy = 0
    for (const sphere of spheres) {
        // calculate kinetic energy of each sphere and add to total
        totalEnergy += 0.5 * sphere.velocity[0] * sphere.velocity[0] + sphere.velocity[1] * sphere.velocity[1] + sphere.velocity[2] * sphere.velocity[2]
    }
    return totalEnergy < 0.01
}

const numSpheres = 50
const boundingBoxSize = 1.0
const gravity = -9.81
const drag = 0.995

function burst(shaderProgram) {
    resetSpheres()

    // Pass uniforms to the shader
    shaderProgram.modelViewMatrix = gl.getUniformLocation(shaderProgram, "u_modelViewMatrix")
    shaderProgram.projectionMatrix = gl.getUniformLocation(shaderProgram, "u_projectionMatrix")
    shaderProgram.viewport = gl.getUniformLocation(shaderProgram, "u_viewport")
    shaderProgram.position = gl.getAttribLocation(shaderProgram, "a_position")
    shaderProgram.radius = gl.getAttribLocation(shaderProgram, "a_radius")
    shaderProgram.color = gl.getAttribLocation(shaderProgram, "a_color")
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_lightDirection'), [1, -1, 3])
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, 'u_lightColor'), [1, 1, 1])

    let projectionMatrix = glMatrix.mat4.create()
    let modelViewMatrix = glMatrix.mat4.create()
    let lastTimestamp = 0

    requestAnimationFrame(render)

    /**
     * Render the scene
     * @param timestamp current time in milliseconds
     */
    function render(timestamp) {
        updateFPS(timestamp)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        // Calculate elapsed time since last frame
        let elapsedTime = (timestamp - lastTimestamp) / 1000
        lastTimestamp = timestamp

        // Update positions and apply physics
        updateSpherePositions(elapsedTime)
        if (spheresShouldReset()) {
            resetSpheres()
        }

        // Set up model-view matrix
        glMatrix.mat4.lookAt(modelViewMatrix, [1, 1, 1], [0, -.25, 0], [0, 1, 0])
        gl.uniformMatrix4fv(shaderProgram.modelViewMatrix, false, modelViewMatrix)

        // Set up projection matrix
        glMatrix.mat4.perspective(projectionMatrix, 1, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0)
        gl.uniformMatrix4fv(shaderProgram.projectionMatrix, false, projectionMatrix)

        // Set up viewport
        gl.uniform2fv(shaderProgram.viewport, [gl.canvas.width, gl.canvas.height])

        // Set up position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spheres.flatMap(s => s.position)), gl.STATIC_DRAW)
        gl.vertexAttribPointer(shaderProgram.position, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(shaderProgram.position)

        // Set up radius attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spheres.map(s => s.radius)), gl.STATIC_DRAW)
        gl.vertexAttribPointer(shaderProgram.radius, 1, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(shaderProgram.radius)

        // Set up color attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spheres.flatMap(s => s.color)), gl.STATIC_DRAW)
        gl.vertexAttribPointer(shaderProgram.color, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(shaderProgram.color)

        // Draw spheres
        gl.drawArrays(gl.POINTS, 0, numSpheres)

        // request next timestamp
        requestAnimationFrame(render)
    }
}