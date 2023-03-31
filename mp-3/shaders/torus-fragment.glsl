precision mediump float;

varying vec3 v_normal;

void main() {
    vec3 illiniOrange = vec3(1, 0.373, 0.02);

    vec3 lightVector = normalize(vec3(1.0, 1.0, 1.0));
    float diffuseWeight = max(dot(v_normal, lightVector), 0.3);

    gl_FragColor = vec4(illiniOrange * diffuseWeight, 1.0);
}