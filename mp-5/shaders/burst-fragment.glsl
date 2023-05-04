precision highp float;

uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;

varying vec4 v_color;

// from https://stackoverflow.com/questions/47331124/how-to-handle-lightning-ambient-diffuse-specular-for-point-spheres-in-opengl
void main() {
    float r = length(gl_PointCoord*2.0 - vec2(1, 1));
    if (r > 1.0) discard;

    vec3 normal = vec3(gl_PointCoord * 2.0 - vec2(1, 1), sqrt(1.0 - r * r));
    float diffuse = max(dot(normal, normalize(u_lightDirection)), 0.0);

    gl_FragColor = vec4(v_color.rgb * u_lightColor * diffuse, v_color.a);
}
