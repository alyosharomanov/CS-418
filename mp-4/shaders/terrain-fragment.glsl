precision highp float;

uniform vec3 u_cameraPosition;
uniform sampler2D u_image;
uniform bool u_fog;
uniform vec3 u_ambientLightColor;
uniform vec3 u_specularLightColor;
uniform vec3 u_fogColor;
uniform vec3 u_lightPosition;
uniform float u_shininess;

varying vec3 v_vertex;
varying vec3 v_normal;
varying vec2 v_textCoord;

void main(void) {
    vec3 normal = normalize(v_normal);
    vec3 lightDirection = normalize(u_lightPosition - v_vertex);
    vec3 viewDirection = normalize(u_cameraPosition - v_vertex);
    vec3 halfway = normalize(u_lightPosition + viewDirection);

    vec4 coordinateColor = texture2D(u_image, v_textCoord);
    float specularWeight = pow(clamp(dot(halfway, normal), 0.0, 1.0), u_shininess);
    float ambientWeight = clamp(dot(lightDirection, normal), 0.0, 1.0);

    gl_FragColor = vec4(coordinateColor.rgb * (u_ambientLightColor * ambientWeight) + (u_specularLightColor * specularWeight), coordinateColor.a);

    if (u_fog) { // from https://webglfundamentals.org/webgl/lessons/webgl-fog.html
        float fogAmount = smoothstep(2.0, 3.0, length(v_vertex));
        gl_FragColor = mix(gl_FragColor, vec4(u_fogColor, 1.0), fogAmount);
    }
}
