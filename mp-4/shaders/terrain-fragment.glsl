precision highp float;

uniform vec3 u_ambientLightColor;
uniform vec3 u_specularLightColor;
uniform vec3 u_lightPosition;
uniform float u_shininess;

varying vec3 v_vertex;
varying vec3 v_normal;
varying vec3 v_color;

// from http://learnwebgl.brown37.net/09_lights/lights_specular.html
void main(void) {
    vec3 diffuseLightColor = v_color;
    float shininess = u_shininess;

    vec3 lightVector = normalize(u_lightPosition - v_vertex);
    vec3 reflectionVector = normalize(2.0 * dot(v_normal, lightVector) * v_normal - lightVector);
    vec3 viewVector = normalize(-v_vertex);

    float ambientWeight = 0.1;
    float diffuseWeight = clamp(dot(v_normal, lightVector), 0.0, 1.0);
    float specularWeight = pow(clamp(dot(reflectionVector, viewVector), 0.0, 1.0), shininess);

    gl_FragColor = vec4((u_ambientLightColor * ambientWeight + diffuseLightColor * diffuseWeight + u_specularLightColor * specularWeight), 1.0);
}
