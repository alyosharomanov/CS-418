precision highp float;

attribute vec3 a_vertexPosition;
attribute vec3 a_vertexNormal;
attribute vec2 a_vertexCoordinates;
uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalMatrix;

varying vec3 v_vertex;
varying vec3 v_normal;
varying vec2 v_textCoord;

void main(void) {
    vec4 transformedVertex = u_modelViewMatrix * vec4(a_vertexPosition, 1.0);

    v_vertex = transformedVertex.xyz;
    v_normal = u_normalMatrix * a_vertexNormal;
    v_textCoord = a_vertexCoordinates;

    gl_Position = u_projectionMatrix * transformedVertex;
}
