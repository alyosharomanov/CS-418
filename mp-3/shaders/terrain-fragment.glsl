precision mediump float;

varying vec3 v_normal;
uniform vec3 u_lightDirection;

void main() {
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float diffuse = max(0.0, dot(lightDirection, v_normal));

    vec3 ambientColor = vec3(0.2, 0.2, 0.2);
    vec3 diffuseColor = vec3(0.6, 0.6, 0.6);

    vec3 color = ambientColor + diffuseColor * diffuse;
    gl_FragColor = vec4(color, 1.0);
}