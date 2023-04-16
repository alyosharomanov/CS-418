precision highp float;

uniform vec3 u_cameraPosition;
uniform sampler2D u_image;
uniform bool u_useFog;
uniform bool u_useImage;
uniform vec3 u_ambientLightColor;
uniform vec3 u_specularLightColor;
uniform vec4 u_fogColor;
uniform vec3 u_lightPosition;
uniform float u_shininess;

varying vec3 v_vertex;
varying vec3 v_normal;
varying vec3 v_color;
varying vec2 v_textCoord;

void main(void) {
    vec3 normal = normalize(v_normal);
    vec3 lightDirection = normalize(u_lightPosition - v_vertex);
    vec3 viewDirection = normalize(u_cameraPosition - v_vertex);
    vec3 halfway = normalize(u_lightPosition + viewDirection);

    vec4 color = vec4(v_color, 1.0);
    if (u_useImage) {
        color = texture2D(u_image, v_textCoord);
    }

    float specularWeight = pow(clamp(dot(halfway, normal), 0.0, 1.0), u_shininess);
    float ambientWeight = clamp(dot(lightDirection, normal), 0.0, 1.0);

    gl_FragColor = vec4(color.rgb * (u_ambientLightColor * ambientWeight) + (u_specularLightColor * specularWeight), color.a);

    if (u_useFog) { // from https://webglfundamentals.org/webgl/lessons/webgl-fog.html
        float fogAmount = smoothstep(2.0, 3.0, length(v_vertex));
        gl_FragColor = mix(gl_FragColor, u_fogColor, fogAmount);
    }
}
