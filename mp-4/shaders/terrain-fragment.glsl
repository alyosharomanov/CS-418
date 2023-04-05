precision highp float;

uniform vec3 u_ambientLightColor;
uniform vec3 u_specularLightColor;
uniform vec3 u_fogColor;
uniform vec3 u_lightPosition;
uniform float u_shininess;
uniform vec3 u_cameraPosition;
uniform sampler2D u_image;
uniform bool u_fog;

varying vec3 v_vertex;
varying vec3 v_normal;
varying vec3 v_color;
varying vec2 v_coordinate;

// from http://learnwebgl.brown37.net/09_lights/lights_specular.html
void main(void) {
    vec3 lightVector = normalize(u_lightPosition - v_vertex);
    vec3 reflectionVector = normalize(2.0 * dot(v_normal, lightVector) * v_normal - lightVector);
    vec3 viewVector = normalize(u_cameraPosition - v_vertex);

    vec4 coordinateColor = texture2D(u_image, v_coordinate);
    float diffuseWeight = clamp(dot(v_normal, lightVector), 0.0, 1.0);
    float specularWeight = pow(clamp(dot(reflectionVector, viewVector), 0.0, 1.0), u_shininess);

    gl_FragColor = vec4((coordinateColor.rgb * (v_color * diffuseWeight + u_specularLightColor * specularWeight)), coordinateColor.a);

    // from https://webglfundamentals.org/webgl/lessons/webgl-fog.html
    if (u_fog) {
        float fogAmount = smoothstep(1.0, 5.0, length(v_vertex));
        gl_FragColor = mix(gl_FragColor, vec4(u_fogColor, 1.0), fogAmount);
    }
}
