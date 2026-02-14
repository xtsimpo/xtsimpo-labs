const canvas = document.getElementById("mesh-bg");

const scene = new THREE.Scene();
const camera = new THREE.Camera();
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const geometry = new THREE.PlaneGeometry(2, 2);

const material = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_resolution: {
      value: new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
      )
    }
  },
  vertexShader: `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    uniform float u_time;
    uniform vec2 u_resolution;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      vec2 u = f*f*(3.0-2.0*f);

      return mix(a, b, u.x) +
             (c - a)* u.y * (1.0 - u.x) +
             (d - b)* u.x * u.y;
    }

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;

      float t = u_time * 0.03;

      float n1 = noise(st * 3.0 + t);
      float n2 = noise(st * 2.0 - t * 0.8);

      vec3 color1 = vec3(0.0, 0.88, 0.78);
      vec3 color2 = vec3(0.05, 0.45, 0.85);
      vec3 base = vec3(0.02, 0.05, 0.08);

      vec3 blended = mix(color1, color2, n1);
      vec3 finalColor = mix(base, blended, n2 * 0.6);

      gl_FragColor = vec4(finalColor, 0.35);
    }
  `,
  transparent: true
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function animate() {
  material.uniforms.u_time.value += 0.05;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.u_resolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
});
