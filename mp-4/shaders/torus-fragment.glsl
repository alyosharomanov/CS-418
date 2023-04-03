precision highp float;

varying vec3 v_normal;

void main() {
    vec3 lightVector = normalize(vec3(1.0, 1.0, 1.0));
    float diffuseWeight = clamp(dot(v_normal, lightVector), 0.2, 1.0);
    gl_FragColor = vec4(vec3(1, 0.373, 0.02) * diffuseWeight, 1.0);
}