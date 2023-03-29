precision mediump float;
varying vec3 v_normal;

void main() {
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0)); // set light
    float brightness = max(0.2, dot(v_normal, lightDirection)); // set brightness
    gl_FragColor = vec4(vec3(1, 0.373, 0.02) * brightness, 1.0); // set Illini orange
}