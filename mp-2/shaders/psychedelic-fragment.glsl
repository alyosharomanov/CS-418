precision highp float;
uniform vec2 resolution;
uniform float time;
void main() {
    gl_FragColor = vec4(fract((gl_FragCoord.xy) / resolution), fract(time), 1);
}