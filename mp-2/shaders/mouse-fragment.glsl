precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
void main() {
    gl_FragColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), 0, 1);
}