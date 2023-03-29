attribute vec4 aPosition;
attribute vec3 aNormal;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec3 v_normal;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    v_normal = aNormal;
}