precision mediump float;

uniform vec3 u_specularLightColor;
uniform vec3 u_lightPosition;
uniform float u_shininess;

varying vec3 v_vertex;
varying vec3 v_normal;
varying vec3 v_ambientLightColor;
varying vec3 v_diffuseLightColor;

void main(void) {
    vec3 lightVector = normalize(u_lightPosition - v_vertex);
    vec3 reflectionVector = normalize(reflect(-lightVector, v_normal));
    vec3 viewVector = normalize(-v_vertex);

    float diffuseWeight = max(dot(v_normal, lightVector), 0.3);
    float specularWeight = pow(max(dot(reflectionVector, viewVector), 0.0), u_shininess);

    gl_FragColor = vec4((v_ambientLightColor + v_diffuseLightColor * diffuseWeight + u_specularLightColor * specularWeight), 1.0);
}
