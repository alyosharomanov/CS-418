attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_modelViewProjection;
uniform mat4 u_normalMatrix;

varying vec3 v_normal;

void main() {
    v_normal = (u_normalMatrix * vec4(a_normal, 0.0)).xyz;
    gl_Position = u_modelViewProjection * vec4(a_position, 1.0);
}