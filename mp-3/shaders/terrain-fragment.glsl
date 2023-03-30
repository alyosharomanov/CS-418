#version 300 es
// Fragment Shader
// Implements Gourand shading. See the lecture on "Basic Shading" for details.

// Use high-precision floats if available on this device.
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

// Receive an interpolated normal vector from the vertex shader
// Receive an interpolated position value from vertex shader
in vec3 vertexNormalView;
in vec3 vertexPositionView;

in vec3 kAmbient;
in vec3 kDiffuse;
uniform vec3 kSpecular;
uniform float shininess;

uniform vec3 lightPosition;
uniform vec3 ambientLightColor;
uniform vec3 diffuseLightColor;
uniform vec3 specularLightColor;

out vec4 fragmentColor;

void main(void) {
    // The camera is at the origin in view coordinates
    vec3 cameraPositionView = vec3(0.0, 0.0, 0.0);

    // Calculate the three other vectors we need: l, r, and v
    vec3 lightVector = normalize(lightPosition - vertexPositionView);
    vec3 reflectionVector = normalize(reflect(-lightVector, vertexNormalView));
    vec3 viewVector = normalize(cameraPositionView - vertexPositionView);

    // Calculate diffuse light weighting: (n dot l)
    float diffuseWeight = max(dot(vertexNormalView, lightVector), 0.0);

    // Calculate the specular light weighting: (r dot v)^(shininess)
    float rDotV = max(dot(reflectionVector, viewVector), 0.0);
    float specularWeight = pow(rDotV, shininess);

    // Sum up all three lighting components into the color for the vertex,
    // and send it to the fragment shader.
    fragmentColor = vec4((kAmbient * ambientLightColor + kDiffuse * diffuseLightColor * diffuseWeight + kSpecular * specularLightColor * specularWeight), 1.0);
}
