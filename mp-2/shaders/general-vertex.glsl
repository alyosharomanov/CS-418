attribute vec3 vertexPosition;
attribute vec4 vertexColor;
uniform mat4 mvMatrix;
uniform mat4 pMatrix;
varying vec4 color;
void main() {
    gl_Position = mvMatrix *pMatrix * vec4(vertexPosition, 1.0);
    color = vertexColor;
}
