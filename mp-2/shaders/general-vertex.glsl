attribute vec3 vertexPosition;
attribute vec4 vertexColor;
uniform mat4 mvMatrix;
varying vec4 color;
void main() {
    gl_Position = mvMatrix * vec4(vertexPosition, 1.0);
    color = vertexColor;
}
