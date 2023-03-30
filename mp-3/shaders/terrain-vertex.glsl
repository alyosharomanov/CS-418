#version 300 es
// Vertex Shader
// Implements Gourand shading. See the lecture on "Basic Shading" for details.

// Use high-precision floats if available on this device.
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

in vec3 vertexPosition;
in vec3 vertexNormal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

// Send an interpolated normal vector from the vertex shader to the fragment shader.
// Send an interpolated position value from vertex shader to the fragment shader.
out vec3 vertexPositionView;
out vec3 vertexNormalView;
out vec3 kAmbient;
out vec3 kDiffuse;

// send maxZ and minZ to vertex shader
uniform float minZ;
uniform float maxZ;

void main(void) {
    float height_percentage = (vertexPosition.z-minZ)/(maxZ-minZ);
    vec3 myColor;
    if (height_percentage < 0.333) {
        myColor = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), height_percentage * 3.0);
    } else if (height_percentage < 0.666) {
        myColor = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (height_percentage - 0.333) * 3.0);
    } else {
        myColor = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (height_percentage - 0.666) * 3.0);
    }

    kAmbient = myColor;
    kDiffuse = myColor;

    // Transform the vertex position and normal to view coordinates
    vertexPositionView =(modelViewMatrix * vec4(vertexPosition, 1.0)).xyz;
    vertexNormalView = normalize(normalMatrix * vertexNormal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
}