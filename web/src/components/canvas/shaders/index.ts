// Exporta los shaders GLSL como strings para uso en THREE.ShaderMaterial.
//
// Next.js no importa archivos .glsl por defecto.
// Los shaders se definen aquí como template literals para evitar
// configurar loaders adicionales en next.config.ts.
// Si en el futuro se agrega soporte a .glsl, este archivo es el único que cambia.

// Vertex shader: transforma posiciones y pasa intensidad al fragment shader
export const fieldVertexShader = /* glsl */`
attribute float aIntensity;

varying float vIntensity;
varying vec3 vViewPosition;

void main() {
  vIntensity = aIntensity;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = 3.0;
}
`;

// Fragment shader: colorea cada fragmento según la intensidad del campo.
// Paleta: vacío profundo (#0a1628) → azul eléctrico (#3a8fff) → cian (#00f0c0) → blanco
export const fieldFragmentShader = /* glsl */`
uniform float uAlpha;
uniform float uBeatPulse;
uniform float uTime;

varying float vIntensity;

vec3 fieldPalette(float t) {
  vec3 colorLow  = vec3(0.039, 0.086, 0.157);
  vec3 colorMid  = vec3(0.227, 0.561, 1.000);
  vec3 colorHigh = vec3(0.000, 0.941, 0.753);
  vec3 colorPeak = vec3(1.000, 1.000, 1.000);

  vec3 col = mix(colorLow,  colorMid,  smoothstep(0.0, 0.35, t));
       col = mix(col,       colorHigh, smoothstep(0.3, 0.65, t));
       col = mix(col,       colorPeak, smoothstep(0.6, 1.00, t));

  return col;
}

void main() {
  float intensity = clamp(vIntensity + uBeatPulse * 0.3, 0.0, 1.0);
  intensity += sin(uTime * 2.0 + vIntensity * 10.0) * 0.03;
  intensity = clamp(intensity, 0.0, 1.0);

  vec3 color = fieldPalette(intensity);
  float alpha = uAlpha * (0.3 + intensity * 0.7);

  gl_FragColor = vec4(color, alpha);
}
`;