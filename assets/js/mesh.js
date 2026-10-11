(function () {
  const canvas = document.getElementById("mesh-bg");
  if (!canvas || typeof THREE === "undefined") return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });

  // The background is soft noise, so rendering at half resolution is visually
  // identical but shades 4x fewer pixels per frame.
  const RES_SCALE = 0.5;
  const uniforms = {
    u_time: { value: 0 },
    u_scroll: { value: 0 },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_resolution: { value: new THREE.Vector2() }
  };

  function resize() {
    renderer.setPixelRatio(RES_SCALE);
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.u_resolution.value.set(window.innerWidth * RES_SCALE, window.innerHeight * RES_SCALE);
  }
  resize();

  // cache scrollable height instead of reading it every frame
  let maxScroll = 1;
  const measure = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
  measure();
  new ResizeObserver(measure).observe(document.body);

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float u_time;
      uniform float u_scroll;
      uniform vec2 u_mouse;
      uniform vec2 u_resolution;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = st;
        p.x *= u_resolution.x / u_resolution.y;

        float t = u_time * 0.04;
        p.y += u_scroll * 0.35;

        vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t + 3.1));
        float n1 = fbm(p * 2.2 + q * 1.4 + t * 0.6);
        float n2 = fbm(p * 1.4 - q + t * 0.3);

        vec3 color1 = vec3(0.0, 0.88, 0.78);
        vec3 color2 = vec3(0.05, 0.45, 0.85);
        vec3 base = vec3(0.02, 0.05, 0.08);

        vec3 blended = mix(color1, color2, smoothstep(0.2, 0.8, n1));
        vec3 finalColor = mix(base, blended, n2 * 0.55);

        // soft light around the cursor
        vec2 m = u_mouse;
        float d = distance(st * vec2(u_resolution.x / u_resolution.y, 1.0), m * vec2(u_resolution.x / u_resolution.y, 1.0));
        finalColor += vec3(0.0, 0.5, 0.48) * smoothstep(0.55, 0.0, d) * 0.12;

        // vignette
        float vig = smoothstep(1.25, 0.25, distance(st, vec2(0.5)));
        finalColor *= mix(0.55, 1.0, vig);

        gl_FragColor = vec4(finalColor, 0.38);
      }
    `
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const target = { x: 0.5, y: 0.5 };
  window.addEventListener("pointermove", (e) => {
    target.x = e.clientX / window.innerWidth;
    target.y = 1 - e.clientY / window.innerHeight;
  }, { passive: true });

  const clock = new THREE.Clock();

  function render() {
    const dt = Math.min(clock.getDelta(), 0.05);
    uniforms.u_time.value += reduceMotion ? 0 : dt;
    uniforms.u_mouse.value.x += (target.x - uniforms.u_mouse.value.x) * 0.04;
    uniforms.u_mouse.value.y += (target.y - uniforms.u_mouse.value.y) * 0.04;
    uniforms.u_scroll.value = window.scrollY / maxScroll;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  window.addEventListener("resize", () => { resize(); measure(); });
})();
