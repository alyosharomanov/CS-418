precision highp float;

attribute vec4 a_position;
attribute float a_radius;
attribute vec4 a_color;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform vec2 u_viewport;

varying vec4 v_color;

void main() {
    gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
    float pointSizeX = u_viewport[0] * u_projectionMatrix[0][0] / gl_Position.w;
    float pointSizeY = u_viewport[1] * u_projectionMatrix[1][1] / gl_Position.w;
    gl_PointSize = a_radius * min(pointSizeX, pointSizeY);
    v_color = a_color;
}
