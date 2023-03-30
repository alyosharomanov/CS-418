precision mediump float;

varying vec3 vertexNormalView;
varying vec3 vertexPositionView;

varying vec3 kAmbient;
varying vec3 kDiffuse;

void main(void) {
    vec3 ambientLightColor = vec3(.1, .1, .1);
    vec3 diffuseLightColor = vec3(1, 1, 1);
    vec3 specularLightColor = vec3(1, 1, 1);
    vec3 lightPosition = vec3(1, 1, 1);
    vec3 kSpecular = vec3(1, 1, 1);
    float shininess = 10.0;

    vec3 lightVector = normalize(lightPosition - vertexPositionView);
    vec3 reflectionVector = normalize(reflect(-lightVector, vertexNormalView));
    vec3 viewVector = normalize(-vertexPositionView);
    float diffuseWeight = max(dot(vertexNormalView, lightVector), 0.0);
    float rDotV = max(dot(reflectionVector, viewVector), 0.0);
    float specularWeight = pow(rDotV, shininess);

    gl_FragColor = vec4((kAmbient * ambientLightColor + kDiffuse * diffuseLightColor * diffuseWeight + kSpecular * specularLightColor * specularWeight), 1.0);
}
