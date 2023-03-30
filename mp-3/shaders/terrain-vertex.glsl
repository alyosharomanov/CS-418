precision mediump float;

attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec3 vertexPositionView;
varying vec3 vertexNormalView;
varying vec3 kAmbient;
varying vec3 kDiffuse;

uniform vec2 u_HeightRange;

void main(void) {
    float height_percentage = (vertexPosition.z - u_HeightRange.x) / (u_HeightRange.y - u_HeightRange.x);

    vec3 color;
    if (height_percentage < 0.333) {
        color = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), height_percentage * 3.0);
    } else if (height_percentage < 0.666) {
        color = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (height_percentage - 0.333) * 3.0);
    } else {
        color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (height_percentage - 0.666) * 3.0);
    }
    kAmbient = color;
    kDiffuse = color;

    vertexPositionView =(modelViewMatrix * vec4(vertexPosition, 1.0)).xyz;
    vertexNormalView = normalize(normalMatrix * vertexNormal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
}