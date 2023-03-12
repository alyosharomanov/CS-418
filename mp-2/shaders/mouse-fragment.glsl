precision highp float;
uniform vec2 resolution;
uniform vec2 mouse;
void main() {
    gl_FragColor = vec4(fract((gl_FragCoord.xy - mouse) / resolution), 0, 1);
}