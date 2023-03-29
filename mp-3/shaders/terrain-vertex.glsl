// Vertex Shader
precision mediump int;
precision mediump float;

// Scene transformations
uniform mat4 u_PVM_transform; // Projection, view, model transform
uniform mat4 u_VM_transform;  // View, model transform

// Light model
uniform vec3 u_Light_position;
uniform vec3 u_Light_color;
uniform float u_Shininess;
uniform vec3 u_Ambient_color;

// Original model data
attribute vec3 a_Vertex;
attribute vec3 a_Color;
attribute vec3 a_Vertex_normal;

// Data (to be interpolated) that is passed on to the fragment shader
varying vec3 v_Vertex;
varying vec4 v_Color;
varying vec3 v_Normal;

void main() {
  v_Vertex = vec3( u_VM_transform * vec4(a_Vertex, 1.0) );
  v_Normal = vec3( u_VM_transform * vec4(a_Vertex_normal, 0.0) );
  v_Color = vec4(a_Color, 1.0);
  gl_Position = u_PVM_transform * vec4(a_Vertex, 1.0);
}