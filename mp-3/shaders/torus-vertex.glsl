precision mediump float;

attribute vec4 a_vertexPosition;
attribute vec3 a_vertexNormal;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;

varying vec3 v_normal;

void main() {
    v_normal = a_vertexNormal;

    gl_Position = u_projectionMatrix * u_modelViewMatrix * a_vertexPosition;
}