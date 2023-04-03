precision highp float;

attribute vec3 a_vertexPosition;
attribute vec3 a_vertexNormal;
uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalMatrix;

varying vec3 v_vertex;
varying vec3 v_normal;
varying vec3 v_color;

// from http://learnwebgl.brown37.net/09_lights/lights_specular.html
void main(void) {
    v_vertex = (u_modelViewMatrix * vec4(a_vertexPosition, 1.0)).xyz;
    v_normal = normalize(u_normalMatrix * a_vertexNormal);
    v_color = vec3(1.0, 1.0, 1.0);

    gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_vertexPosition, 1.0);
}