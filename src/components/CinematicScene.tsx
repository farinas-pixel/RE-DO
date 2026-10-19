import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CinematicSceneProps {
  scrollProgress: number; // 0.0 to 1.0 overall scroll
  currentSection: number;  // 0 to 5
}

export const CinematicScene: React.FC<CinematicSceneProps> = ({ scrollProgress, currentSection }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(scrollProgress);
  const sectionRef = useRef(currentSection);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    sectionRef.current = currentSection;
  }, [currentSection]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect user accessibility preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      180
    );
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 2. Cinematic Lighting Setup (Cyan, Magenta & Ambient Cosmic Lights)
    const ambientLight = new THREE.AmbientLight(0x0a0618, 2.4);
    scene.add(ambientLight);

    const cyanLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    cyanLight.position.set(-4.0, 5.0, 4.0);
    scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xf43f5e, 3.5, 35);
    magentaLight.position.set(4.5, 2.0, -2.5);
    scene.add(magentaLight);

    // -------------------------------------------------------------------------
    // 3. LAYER A: Authentic Reference Galaxy Panorama (Live GLSL Animated Texture)
    // Directly references public/reference_galaxy.png to recreate the exact
    // atmosphere: deep navy sky, flowing cyan cloud ribbons, billowing magenta
    // nebulae, distant alpine mountains with snow couloirs, and foreground pines.
    // -------------------------------------------------------------------------
    const texLoader = new THREE.TextureLoader();
    const galaxyTex = texLoader.load(`${import.meta.env.BASE_URL}reference_galaxy.png`, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      renderer.render(scene, camera);
    });

    const galaxyUniforms = {
      uTexture: { value: galaxyTex },
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
    };

    const galaxyMat = new THREE.ShaderMaterial({
      uniforms: galaxyUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          // Curve subtly into a panoramic cylinder arc
          pos.z -= pow(pos.x / 27.0, 2.0) * 3.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uScrollProgress;
        varying vec2 vUv;

        void main() {
          // 1. Live cosmic atmospheric flow across clouds (vUv.y > 0.32)
          // Preserves sharp distant alpine mountains and foreground pines below
          float skyFactor = smoothstep(0.26, 0.42, vUv.y);

          // Multi-octave fluid advection
          vec2 flow1 = vec2(
            sin(vUv.y * 5.5 + uTime * 0.28),
            cos(vUv.x * 5.0 + uTime * 0.22)
          ) * 0.016;

          vec2 flow2 = vec2(
            cos(vUv.x * 12.0 - uTime * 0.42),
            sin(vUv.y * 10.0 + uTime * 0.35)
          ) * 0.008;

          vec2 uvFlow = vUv + (flow1 + flow2) * skyFactor;
          vec4 baseCol = texture2D(uTexture, uvFlow);

          // 2. Isolate & illuminate living cyan cloud ribbons (upper-left)
          float cyanMask = smoothstep(0.20, 0.60, baseCol.b - baseCol.r * 0.55) * smoothstep(0.35, 0.95, vUv.y) * smoothstep(0.85, 0.15, vUv.x);
          float cyanPulse = sin(uTime * 1.8 + vUv.x * 6.5) * 0.5 + 0.5;
          float cyanSwirl = cos(uTime * 2.4 - vUv.y * 8.0) * 0.5 + 0.5;
          vec3 livingCyan = vec3(0.0, 0.94, 1.0) * (cyanMask * (0.32 + cyanPulse * 0.35 + cyanSwirl * 0.18));

          // 3. Isolate & illuminate living magenta/purple nebula (upper-right)
          float magMask = smoothstep(0.18, 0.52, baseCol.r * baseCol.b) * smoothstep(0.32, 0.95, vUv.y) * smoothstep(0.20, 0.90, vUv.x);
          float magPulse = cos(uTime * 1.5 + vUv.y * 5.5) * 0.5 + 0.5;
          float magSwirl = sin(uTime * 2.1 + vUv.x * 7.5) * 0.5 + 0.5;
          vec3 livingMagenta = vec3(0.98, 0.18, 0.76) * (magMask * (0.28 + magPulse * 0.30 + magSwirl * 0.18));

          // 4. Starlight twinkle on bright stars
          float brightStars = smoothstep(0.78, 0.98, max(baseCol.r, max(baseCol.g, baseCol.b)));
          float starTwinkle = sin(uTime * 3.6 + vUv.x * 85.0 + vUv.y * 85.0) * 0.5 + 0.5;
          vec3 livingStars = vec3(1.0, 1.0, 1.0) * (brightStars * starTwinkle * 0.55);

          // 5. Delicate alpine glow along mountain ridges
          float mountainMask = smoothstep(0.24, 0.36, vUv.y) * smoothstep(0.44, 0.30, vUv.y) * smoothstep(0.25, 0.65, baseCol.r + baseCol.b);
          vec3 alpineGlow = vec3(0.95, 0.38, 0.72) * (mountainMask * (0.16 + sin(uTime * 0.9) * 0.06));

          // 6. Volumetric crepuscular light rays (god rays) streaming down from cosmic core
          vec2 lightCore = vec2(0.48, 0.82);
          vec2 rayDelta = vUv - lightCore;
          float rayAngle = atan(rayDelta.y, rayDelta.x);
          float rayDist = length(rayDelta);
          float rays = sin(rayAngle * 14.0 + uTime * 0.12) * 0.5 + 0.5;
          rays += sin(rayAngle * 24.0 - uTime * 0.18) * 0.3;
          rays = clamp(rays, 0.0, 1.0);
          float rayAttenuation = smoothstep(1.3, 0.15, rayDist) * smoothstep(0.18, 0.88, vUv.y);
          vec3 godRays = mix(vec3(0.0, 0.80, 1.0), vec3(0.96, 0.38, 0.88), clamp(vUv.x, 0.0, 1.0)) * (pow(rays, 2.0) * rayAttenuation * 0.15);

          // 7. Atmospheric valley haze & soft forest base (eliminates harsh flat black cutout look)
          float valleyMist = smoothstep(0.32, 0.10, vUv.y);
          float fogDrift = sin(vUv.x * 7.0 + uTime * 0.15) * cos(vUv.y * 10.0 - uTime * 0.10) * 0.5 + 0.5;
          vec3 valleyHaze = vec3(0.12, 0.08, 0.24) * (valleyMist * (0.14 + fogDrift * 0.08));

          // Soften tree bases into deep midnight navy/violet ambient
          float treeBaseSoften = smoothstep(0.20, 0.0, vUv.y);
          vec3 treeAmbient = vec3(0.04, 0.02, 0.08);

          vec3 finalColor = baseCol.rgb + livingCyan + livingMagenta + livingStars + alpineGlow + godRays;
          finalColor = mix(finalColor, max(finalColor, treeAmbient), treeBaseSoften * 0.80);
          finalColor += valleyHaze;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      depthWrite: false,
    });

    const galaxyGeo = new THREE.PlaneGeometry(54, 30.5, 64, 32);
    const galaxyMesh = new THREE.Mesh(galaxyGeo, galaxyMat);
    galaxyMesh.position.set(0, 0.2, -26.0);
    galaxyMesh.renderOrder = -200;
    scene.add(galaxyMesh);

    // Responsive 100% Viewport Cover Scaling
    // Eliminates all side strips, exposed gaps, and margins on all aspect ratios without stretching
    const updateGalaxySize = () => {
      const aspect = window.innerWidth / window.innerHeight;
      const dist = 5.2 - (-26.0);
      const fovRad = (camera.fov * Math.PI) / 360;
      const vHeight = 2.0 * dist * Math.tan(fovRad);
      const vWidth = vHeight * aspect;
      const imgAspect = 16 / 9;

      let targetW = vWidth;
      let targetH = vWidth / imgAspect;
      if (aspect < imgAspect) {
        targetH = vHeight;
        targetW = vHeight * imgAspect;
      }

      // Safe 35% overscan margin absorbs all cylinder curvature and scroll parallax
      targetW *= 1.35;
      targetH *= 1.35;

      galaxyMesh.scale.set(targetW / 54, targetH / 30.5, 1);
    };
    updateGalaxySize();

    // -------------------------------------------------------------------------
    // 4. LAYER B: 3D True Volumetric Nebula Cloud Planes (Real Spatial Parallax)
    // -------------------------------------------------------------------------
    const noiseGLSL = `
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.52;
        for (int i = 0; i < 3; i++) {
          v += a * (snoise(p) * 0.5 + 0.5);
          p = p * 2.08 + vec3(0.18, 0.42, 0.65);
          a *= 0.48;
        }
        return v;
      }
    `;

    // Left 3D Cyan Cloud Ribbon (Z = -13)
    const cyanNebulaUniforms = { uTime: { value: 0 } };
    const cyanNebulaMat = new THREE.ShaderMaterial({
      uniforms: cyanNebulaUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        ${noiseGLSL}

        void main() {
          vec3 p = vec3(vUv.x * 2.6 + uTime * 0.022, vUv.y * 1.6, uTime * 0.012);
          float n = fbm(p);
          float maskX = smoothstep(0.0, 0.45, vUv.x) * smoothstep(1.0, 0.55, vUv.x);
          float maskY = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
          float density = pow(n, 1.7) * (maskX * maskY);
          vec3 cDeepCyan = vec3(0.02, 0.45, 0.85);
          vec3 cElectricCyan = vec3(0.0, 0.90, 1.0);
          vec3 col = mix(cDeepCyan, cElectricCyan, clamp(n * 1.35, 0.0, 1.0));
          gl_FragColor = vec4(col, density * 0.65);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const cyanNebulaMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), cyanNebulaMat);
    cyanNebulaMesh.position.set(-4.2, 1.8, -13.0);
    cyanNebulaMesh.renderOrder = -170;
    scene.add(cyanNebulaMesh);

    // Right 3D Magenta Billowing Nebula (Z = -17)
    const magNebulaUniforms = { uTime: { value: 0 } };
    const magNebulaMat = new THREE.ShaderMaterial({
      uniforms: magNebulaUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        ${noiseGLSL}

        void main() {
          vec3 p = vec3(vUv.x * 2.4 - uTime * 0.016, vUv.y * 2.0 + uTime * 0.010, uTime * 0.015);
          float n = fbm(p);
          float maskX = smoothstep(0.0, 0.45, vUv.x) * smoothstep(1.0, 0.55, vUv.x);
          float maskY = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
          float density = pow(n, 1.6) * (maskX * maskY);
          vec3 cRoyalViolet = vec3(0.24, 0.05, 0.42);
          vec3 cVibrantMagenta = vec3(0.86, 0.12, 0.72);
          vec3 cHotPink = vec3(0.98, 0.28, 0.65);
          vec3 col = mix(cRoyalViolet, cVibrantMagenta, clamp(n * 1.3, 0.0, 1.0));
          col = mix(col, cHotPink, pow(clamp(n, 0.0, 1.0), 2.5) * 0.75);
          gl_FragColor = vec4(col, density * 0.68);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const magNebulaMesh = new THREE.Mesh(new THREE.PlaneGeometry(18, 11), magNebulaMat);
    magNebulaMesh.position.set(3.8, 1.2, -17.0);
    magNebulaMesh.renderOrder = -160;
    scene.add(magNebulaMesh);

    // Midground 3D Low-Lying Atmospheric Mist Plane (Z = -14.0, Y = -1.25)
    // Floats softly between distant mountains and foreground trees for cinematic atmospheric depth
    const mistUniforms = { uTime: { value: 0 } };
    const mistMat = new THREE.ShaderMaterial({
      uniforms: mistUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        ${noiseGLSL}

        void main() {
          vec3 p = vec3(vUv.x * 2.8 - uTime * 0.016, vUv.y * 2.2, uTime * 0.010);
          float n = fbm(p);
          float maskX = smoothstep(0.0, 0.32, vUv.x) * smoothstep(1.0, 0.68, vUv.x);
          float maskY = smoothstep(0.0, 0.40, vUv.y) * smoothstep(1.0, 0.48, vUv.y);
          float density = pow(n, 1.7) * (maskX * maskY) * 0.45;

          vec3 cMistViolet = vec3(0.20, 0.14, 0.38);
          vec3 cMistLavender = vec3(0.55, 0.30, 0.62);
          vec3 col = mix(cMistViolet, cMistLavender, clamp(n * 1.25, 0.0, 1.0));
          gl_FragColor = vec4(col, density);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mistMesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 6.5), mistMat);
    mistMesh.position.set(0, -1.25, -14.0);
    mistMesh.renderOrder = -150;
    scene.add(mistMesh);

    // -------------------------------------------------------------------------
    // 5. LAYER C: Multi-Depth 3D Starfield (1,400 Stars with True Perspective Depth)
    // -------------------------------------------------------------------------
    const starCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starTwinkle = new Float32Array(starCount);

    const paletteStar = [
      new THREE.Color(0xffffff), // Diamond white
      new THREE.Color(0xbae6fd), // Pale icy cyan
      new THREE.Color(0x38bdf8), // Electric cyan
      new THREE.Color(0xf5d0fe), // Soft celestial lavender
      new THREE.Color(0xfbcfe8), // Pale celestial rose
    ];

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      starPos[idx]     = (Math.random() - 0.5) * 54;
      starPos[idx + 1] = (Math.random() - 0.5) * 36;
      starPos[idx + 2] = -5.0 - Math.random() * 55.0; // Real 3D depth from -5 to -60

      const c = paletteStar[Math.floor(Math.random() * paletteStar.length)];
      starColors[idx]     = c.r;
      starColors[idx + 1] = c.g;
      starColors[idx + 2] = c.b;

      starTwinkle[i] = Math.random() * 6.28;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeo.setAttribute('aTwinkle', new THREE.BufferAttribute(starTwinkle, 1));

    const starUniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };

    const starMat = new THREE.ShaderMaterial({
      uniforms: starUniforms,
      vertexShader: `
        attribute vec3 color;
        attribute float aTwinkle;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          float tw = 0.5 + 0.5 * sin(uTime * 1.8 + aTwinkle);
          vAlpha = 0.35 + 0.65 * tw;

          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (1.9 + tw * 1.5) * (26.0 / -mvPos.z) * (uPixelRatio * 0.5);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float core = smoothstep(0.5, 0.04, dist);
          gl_FragColor = vec4(vColor, vAlpha * core);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const starPoints = new THREE.Points(starGeo, starMat);
    starPoints.renderOrder = -140;
    scene.add(starPoints);

    // Floating Midground Cosmic Dust Particles (45 motes)
    const dustCount = 45;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3]     = (Math.random() - 0.5) * 16;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2.0;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfbcfe8,
      size: 0.07,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    // -------------------------------------------------------------------------
    // 6. LAYER D: Realistic 3D Crystal Orb & Physically Convincing 3D Liquid Volume
    // Completely eliminates the half-sphere slice, horizontal banding, and white outline.
    // -------------------------------------------------------------------------
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // Dynamic Inertia Fluid Physics Uniforms & Local Coordinates
    const liquidUniforms = {
      uTime: { value: 0 },
      uSlosh: { value: new THREE.Vector2(0, 0) },
      uSloshVelocity: { value: 0 },
      uOrbMatrixInverse: { value: new THREE.Matrix4() },
      uCameraPos: { value: new THREE.Vector3(0, 0, 5.2) },
      uGalaxyTex: { value: galaxyTex },
    };

    // A. Continuous Volumetric 3D Bioluminescent Fluid Shader & Optical Crystal Refraction
    // Eliminates all split hemispheres, seams, and flat bowl appearance forever
    const liquidMat = new THREE.ShaderMaterial({
      uniforms: liquidUniforms,
      vertexShader: `
        precision highp float;
        varying vec3 vLocalPos;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vScreenUv;

        void main() {
          vLocalPos = position;
          vNormal = normalize(normalMatrix * normal);
          vec4 wPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = wPos.xyz;
          vec4 clipPos = projectionMatrix * viewMatrix * wPos;
          vScreenUv = (clipPos.xy / clipPos.w) * 0.5 + 0.5;
          gl_Position = clipPos;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec2 uSlosh;
        uniform float uSloshVelocity;
        uniform mat4 uOrbMatrixInverse;
        uniform vec3 uCameraPos;
        uniform sampler2D uGalaxyTex;

        varying vec3 vLocalPos;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vScreenUv;

        // Wave height in local XZ plane with organic curved meniscus & concave fluid swell
        float getWave(vec2 p, float t, vec2 slosh) {
          float r = length(p);
          // Meniscus: natural capillary action climbs the inner glass sphere wall (R ~ 1.20)
          float meniscus = pow(clamp(r / 1.18, 0.0, 1.0), 3.0) * 0.16 - 0.10;
          // Layered fluid dynamics: primary harmonic, cross-swell, and fine ripples
          float w1 = sin(p.x * 1.8 + t * 1.2 + p.y * 0.8) * 0.048;
          float w2 = cos(p.y * 2.2 - t * 0.95 - p.x * 1.1) * 0.035;
          float w3 = sin((p.x + p.y) * 3.4 + t * 1.8) * 0.018;
          float sloshInertia = (p.x * slosh.x + p.y * slosh.y) * 0.25;
          return -0.05 + meniscus + w1 + w2 + w3 + sloshInertia;
        }

        void main() {
          vec3 rayOrigin = (uOrbMatrixInverse * vec4(uCameraPos, 1.0)).xyz;
          vec3 rayTarget = vLocalPos;
          vec3 rayDir = normalize(rayTarget - rayOrigin);

          // Analytical intersection with inner cavity sphere (R = 1.20)
          float R = 1.20;
          float b = dot(rayOrigin, rayDir);
          float c = dot(rayOrigin, rayOrigin) - R * R;
          float disc = b * b - c;
          if (disc < 0.0) discard;

          float t1 = -b - sqrt(disc);
          float t2 = -b + sqrt(disc);

          float tStart = max(t1, 0.0);
          float tEnd = t2;
          if (tStart >= tEnd) discard;

          vec3 pEntry = rayOrigin + rayDir * tStart;
          vec3 pExit  = rayOrigin + rayDir * tEnd;

          // Spherical optical lens refraction of the cosmic background
          vec2 galaxyUv = (vScreenUv - vec2(0.5, 0.51)) / 1.35 + 0.5;
          vec2 refrOffset = -vLocalPos.xy * 0.032 + rayDir.xy * 0.010;

          float skyFactor = smoothstep(0.24, 0.44, galaxyUv.y);
          vec2 flow = vec2(
            sin(galaxyUv.y * 5.5 + uTime * 0.28),
            cos(galaxyUv.x * 5.0 + uTime * 0.22)
          ) * 0.012 * skyFactor;

          // Chromatic dispersion offsets (icy cyan R, neutral G, violet B)
          vec2 uvR = galaxyUv + refrOffset * 0.93 + flow;
          vec2 uvG = galaxyUv + refrOffset * 1.00 + flow;
          vec2 uvB = galaxyUv + refrOffset * 1.07 + flow;

          float rTex = texture2D(uGalaxyTex, clamp(uvR, 0.002, 0.998)).r;
          float gTex = texture2D(uGalaxyTex, clamp(uvG, 0.002, 0.998)).g;
          float bTex = texture2D(uGalaxyTex, clamp(uvB, 0.002, 0.998)).b;
          vec3 refractedCosmos = vec3(rTex, gTex, bTex);

          // World-space lights transformed to local orb space
          vec3 lightCyan = normalize((uOrbMatrixInverse * vec4(-3.5, 5.0, 3.5, 0.0)).xyz);
          vec3 lightMag = normalize((uOrbMatrixInverse * vec4(4.0, 2.5, -2.5, 0.0)).xyz);
          vec3 halfCyan = normalize(lightCyan - rayDir);
          vec3 halfMag = normalize(lightMag - rayDir);

          float waveAtEntry = getWave(pEntry.xz, uTime, uSlosh);
          bool enteredFromTop = (pEntry.y > waveAtEntry);

          vec3 accumColor = vec3(0.0);
          vec3 transmittance = vec3(1.0);
          float tLiquidStart = tStart;

          if (enteredFromTop) {
            // Ray enters in the upper clear cavity!
            // Search along the ray to detect if it strikes the liquid top surface from above
            const int S_STEPS = 20;
            float dtS = (tEnd - tStart) / float(S_STEPS);
            bool hitWave = false;
            float tWaveHit = tEnd;

            for (int s = 0; s < S_STEPS; s++) {
              float tc = tStart + float(s + 1) * dtS;
              vec3 pc = rayOrigin + rayDir * tc;
              if (pc.y <= getWave(pc.xz, uTime, uSlosh)) {
                hitWave = true;
                // Refined bisection
                float tA = tc - dtS;
                float tB = tc;
                for (int j = 0; j < 6; j++) {
                  float tM = (tA + tB) * 0.5;
                  vec3 pM = rayOrigin + rayDir * tM;
                  if (pM.y <= getWave(pM.xz, uTime, uSlosh)) tB = tM;
                  else tA = tM;
                }
                tWaveHit = tB;
                break;
              }
            }

            if (!hitWave) {
              // Ray completely misses the liquid: travels entirely through clear crystal dome!
              // Discard allows the true 3D background (stars, nebula planes, mountains) to be viewed with pristine crystal clarity
              discard;
            }

            // Ray strikes the TOP WAVE MENISCUS of the liquid from above!
            tLiquidStart = tWaveHit;
            vec3 pSurf = rayOrigin + rayDir * tWaveHit;

            // Compute true wave surface normal
            float eps = 0.02;
            float hL = getWave(vec2(pSurf.x - eps, pSurf.z), uTime, uSlosh);
            float hR = getWave(vec2(pSurf.x + eps, pSurf.z), uTime, uSlosh);
            float hD = getWave(vec2(pSurf.x, pSurf.z - eps), uTime, uSlosh);
            float hU = getWave(vec2(pSurf.x, pSurf.z + eps), uTime, uSlosh);
            vec3 surfNormal = normalize(vec3(-(hR - hL) / (2.0 * eps), 1.0, -(hU - hD) / (2.0 * eps)));

            // Top meniscus specular highlights & physical Fresnel
            float specC = pow(max(dot(surfNormal, halfCyan), 0.0), 90.0) * 1.6;
            float specM = pow(max(dot(surfNormal, halfMag), 0.0), 65.0) * 1.1;
            float fWave = pow(1.0 - max(dot(-rayDir, surfNormal), 0.0), 2.8);

            vec3 skyRefl = mix(vec3(0.0, 0.92, 1.0), vec3(0.98, 0.28, 0.82), clamp(surfNormal.x * 0.5 + 0.5, 0.0, 1.0));
            float crestH = smoothstep(-0.06, 0.14, pSurf.y);
            vec3 crestGlow = vec3(1.0, 0.70, 0.95) * (crestH * 0.40);

            // Radiant luminous fluid wave crest (bright fuchsia/magenta crest line)
            float crestEdge = pow(clamp(1.0 - abs(surfNormal.y), 0.0, 1.0), 2.5);
            vec3 crestLine = mix(vec3(0.98, 0.35, 0.85), vec3(1.0, 0.85, 0.98), crestEdge) * (crestEdge * 0.95);

            vec3 surfRefl = skyRefl * (fWave * 0.70) + vec3(0.90, 0.98, 1.0) * specC + vec3(1.0, 0.70, 0.95) * specM + crestGlow + crestLine;
            accumColor += surfRefl;
            transmittance *= (1.0 - fWave * 0.45);
          } else {
            // Ray enters the liquid DIRECTLY through the front glass wall!
            tLiquidStart = tStart;
            // Front glass boundary reflection (dais reflection and soft glancing rim)
            float fFront = pow(1.0 - max(dot(-rayDir, normalize(pEntry)), 0.0), 3.0);
            float daisGlow = (1.0 - smoothstep(-1.20, -0.65, pEntry.y)) * 0.55;
            accumColor += mix(vec3(0.0, 0.9, 1.0), vec3(0.95, 0.25, 0.8), clamp(pEntry.x * 0.5 + 0.5, 0.0, 1.0)) * (daisGlow * fFront);
            transmittance *= (1.0 - fFront * 0.25);
          }

          // March through the 3D fluid volume
          const int VOL_STEPS = 28;
          float dt = (tEnd - tLiquidStart) / float(VOL_STEPS);
          vec3 corePos = vec3(0.02, -0.36, 0.0);
          vec3 cAmethyst = vec3(0.12, 0.01, 0.28);
          vec3 cRoyalMagenta = vec3(0.96, 0.08, 0.65);
          vec3 cHotPink = vec3(1.0, 0.32, 0.88);

          for (int i = 0; i < VOL_STEPS; i++) {
            float t = tLiquidStart + (float(i) + 0.5) * dt;
            vec3 p = rayOrigin + rayDir * t;

            // Distance to incandescent bioluminescent core
            float dCore = length(p - corePos);
            float coreGlow = pow(clamp(1.0 - dCore / 0.95, 0.0, 1.0), 1.6) * 3.8;
            float coreHot = pow(clamp(1.0 - dCore / 0.28, 0.0, 1.0), 2.2) * 5.0;

            // Organic fluid currents & swirling filaments
            vec3 swirlP = p + vec3(sin(p.y * 2.2 + uTime * 0.8), cos(p.x * 2.0 - uTime * 0.6), sin(p.z * 1.8 + uTime * 0.7)) * 0.22;
            float fil1 = sin(swirlP.x * 2.6 + swirlP.y * 2.0 + uTime * 1.1);
            float fil2 = cos(swirlP.z * 2.4 - swirlP.y * 1.8 - uTime * 0.85);
            float fil3 = sin((swirlP.x + swirlP.z) * 2.0 + uTime * 1.3);
            float caustics = pow(clamp((fil1 * fil2 + fil3 * 0.6) * 0.40 + 0.50, 0.0, 1.0), 2.0) * 1.3;

            // Layered fluid colors: deep amethyst base, vibrant magenta mid-body, warm rose core
            float depthNorm = clamp((p.y + 1.20) / 1.4, 0.0, 1.0);
            vec3 emission = mix(cAmethyst, cRoyalMagenta, pow(depthNorm, 1.1));
            emission = mix(emission, cHotPink, coreGlow * 0.60);
            emission += vec3(1.0, 0.90, 0.98) * (coreHot * 0.55);
            emission += vec3(1.0, 0.60, 0.95) * (caustics * coreGlow * 0.45);

            // Upward dais reflection at fluid base
            float daisFactor = 1.0 - smoothstep(-1.20, -0.65, p.y);
            emission += mix(vec3(0.0, 0.88, 1.0), vec3(0.92, 0.18, 0.80), clamp(p.x * 0.5 + 0.5, 0.0, 1.0)) * (daisFactor * 0.50);

            // Physical Beer-Lambert chromatic absorption
            // Allows the background cosmos to be seen through the liquid!
            vec3 stepAbsorb = vec3(0.35, 1.20, 0.75) * dt * 1.0;
            accumColor += emission * dt * 1.15 * transmittance;
            transmittance *= exp(-stepAbsorb);

            if (dot(transmittance, vec3(0.33)) < 0.02) break;
          }

          // Transmit the refracted background cosmos through the fluid
          accumColor += refractedCosmos * transmittance;

          float finalAlpha = clamp(1.0 - dot(transmittance, vec3(0.33)) * 0.45, 0.70, 0.98);
          gl_FragColor = vec4(accumColor, finalAlpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });

    // Single unified sphere geometry for volumetric liquid (R = 1.22)
    const liquidGeo = new THREE.SphereGeometry(1.22, 64, 64);
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.renderOrder = 0;

    // Parent into single coordinated liquidGroup
    const liquidGroup = new THREE.Group();
    orbGroup.add(liquidGroup);
    liquidGroup.add(liquidMesh);

    // B. Outer Crystal Glass Shell with Realistic Fresnel & Cosmic Reflections
    // Pure optical crystal glass with Fresnel rim and diamond edge glints - NO artificial white hotspot
    const glassUniforms = {
      uTime: { value: 0 },
      uRimColorPink: { value: new THREE.Color(0xfbcfe8) },      // Soft crystal rose-pink
      uRimColorLavender: { value: new THREE.Color(0xe9d5ff) },  // Soft crystal lavender
      uLightDir: { value: new THREE.Vector3(1.5, 4.5, 3.5).normalize() },
    };

    const glassMat = new THREE.ShaderMaterial({
      uniforms: glassUniforms,
      vertexShader: `
        precision highp float;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        varying vec3 vWorldNormal;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPos = -mvPos.xyz;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uRimColorPink;
        uniform vec3 uRimColorLavender;
        uniform vec3 uLightDir;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        varying vec3 vWorldNormal;

        void main() {
          vec3 viewDir = normalize(vViewPos);
          vec3 norm = normalize(vNormal);

          // Crystal glass transparency facing camera (NdotV ~ 1.0), brilliant reflections at glancing angles
          float NdotV = max(dot(viewDir, norm), 0.0);
          float fresnel = pow(1.0 - NdotV, 3.2);

          // Controlled, sharp diamond specular glints (icy cyan on left, rose on right)
          vec3 halfDir1 = normalize(uLightDir + viewDir);
          float spec1 = pow(max(dot(norm, halfDir1), 0.0), 180.0) * 1.2;

          vec3 halfDir2 = normalize(vec3(-2.2, 3.2, 1.8) + viewDir);
          float spec2 = pow(max(dot(norm, halfDir2), 0.0), 130.0) * 0.8;

          vec3 specCol = mix(vec3(0.85, 0.95, 1.0), vec3(1.0, 0.80, 0.95), clamp(norm.x * 0.5 + 0.5, 0.0, 1.0));

          // Cosmic Galaxy Environment Reflection (cyan on left, magenta on right)
          vec3 refl = reflect(-viewDir, norm);
          vec3 envGalaxy = vec3(0.02, 0.01, 0.04);
          float cyanRefl = pow(max(dot(refl, normalize(vec3(-0.8, 0.6, -0.4))), 0.0), 2.5);
          envGalaxy = mix(envGalaxy, vec3(0.0, 0.92, 1.0), cyanRefl * 0.65);
          float magRefl = pow(max(dot(refl, normalize(vec3(0.8, 0.5, -0.4))), 0.0), 2.5);
          envGalaxy = mix(envGalaxy, vec3(0.98, 0.22, 0.72), magRefl * 0.65);

          // Crystal chromatic rim dispersion (cyan on left, magenta on right, diamond white at glancing edge)
          vec3 rimColor = mix(vec3(0.0, 0.95, 1.0), vec3(0.98, 0.25, 0.78), clamp(vWorldNormal.x * 0.5 + 0.5, 0.0, 1.0));
          rimColor = mix(rimColor, vec3(1.0, 1.0, 1.0), pow(1.0 - NdotV, 4.5) * 0.65);

          // Celestial top rim highlight (crisp rim glow contouring the top of the crystal dome)
          float topRim = pow(max(norm.y, 0.0), 2.8) * pow(1.0 - NdotV, 2.2);
          vec3 cTopRim = mix(vec3(0.0, 0.95, 1.0), vec3(0.98, 0.40, 0.88), clamp(norm.x * 0.5 + 0.5, 0.0, 1.0)) * (topRim * 1.5);

          // Dais upward reflection on bottom rim of crystal glass
          float daisRim = (1.0 - smoothstep(-1.26, -0.65, vWorldNormal.y)) * pow(1.0 - NdotV, 2.0);
          vec3 cDais = mix(vec3(0.0, 0.92, 1.0), vec3(0.95, 0.25, 0.8), clamp(norm.x * 0.5 + 0.5, 0.0, 1.0)) * daisRim * 0.85;

          // Inner bevel refraction rim (characteristics of thick Lalique crystal glass)
          float innerBevel = smoothstep(0.06, 0.20, NdotV) * smoothstep(0.36, 0.20, NdotV);
          vec3 cInnerBevel = mix(vec3(0.0, 0.95, 1.0), vec3(0.98, 0.40, 0.85), clamp(norm.x * 0.5 + 0.5, 0.0, 1.0)) * (innerBevel * 0.35);

          vec3 finalColor = rimColor * fresnel * 1.55 + (envGalaxy * fresnel * 0.85) + specCol * (spec1 + spec2) + cTopRim + cDais + cInnerBevel;

          // Alpha: Pure optical crystal transparency in center, radiant reflections at silhouette edge and specular glints
          float alpha = clamp(0.02 + fresnel * 0.88 + (spec1 + spec2) * 0.80 + innerBevel * 0.25, 0.02, 0.95);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const glassGeo = new THREE.SphereGeometry(1.26, 96, 96);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.renderOrder = 1;
    orbGroup.add(glassMesh);

    // C. Pristine Optical Glass Dome
    const dropletsGroup = new THREE.Group();
    orbGroup.add(dropletsGroup);

    // D. Delicate Crystalline Celestial Orbit Threads (Dual tilted rings matching reference_master.jpg)
    const ringGeo1 = new THREE.TorusGeometry(1.68, 0.0022, 8, 96);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xf5d0fe,
      emissive: 0xc084fc,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.32,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh.rotation.x = Math.PI / 3.2;
    ringMesh.rotation.y = 0.15;
    orbGroup.add(ringMesh);

    const ringGeo2 = new THREE.TorusGeometry(1.84, 0.0018, 8, 96);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.30,
      transparent: true,
      opacity: 0.28,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = Math.PI / 2.7;
    ringMesh2.rotation.y = -0.22;
    ringMesh2.rotation.z = 0.12;
    orbGroup.add(ringMesh2);

    // Crystalline Motes on the Orbit Rings
    const moteGeo = new THREE.SphereGeometry(0.024, 16, 16);
    const moteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.65,
      roughness: 0.1,
      metalness: 0.9,
    });
    const motesGroup = new THREE.Group();
    motesGroup.rotation.copy(ringMesh.rotation);
    [0.35, 2.45, 4.65].forEach((ang) => {
      const m = new THREE.Mesh(moteGeo, moteMat);
      m.position.set(1.68 * Math.cos(ang), 1.68 * Math.sin(ang), 0);
      motesGroup.add(m);
    });
    orbGroup.add(motesGroup);

    const motesGroup2 = new THREE.Group();
    motesGroup2.rotation.copy(ringMesh2.rotation);
    [1.15, 3.85].forEach((ang) => {
      const m = new THREE.Mesh(moteGeo, moteMat);
      m.position.set(1.84 * Math.cos(ang), 1.84 * Math.sin(ang), 0);
      motesGroup2.add(m);
    });
    orbGroup.add(motesGroup2);

    // E. Reflective Circular Platform & Obsidian Cylinder Dais beneath the Crystal Orb
    const daisGroup = new THREE.Group();
    daisGroup.position.set(0, -1.26, 0.08);
    scene.add(daisGroup);

    // 3D Dimensional Obsidian Platform Base Cylinder
    const cylinderGeo = new THREE.CylinderGeometry(1.42, 1.54, 0.08, 64);
    const cylinderMat = new THREE.MeshStandardMaterial({
      color: 0x090514,
      roughness: 0.25,
      metalness: 0.80,
      transparent: true,
      opacity: 0.92,
    });
    const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
    cylinderMesh.renderOrder = -25;
    daisGroup.add(cylinderMesh);

    // Subtle Cyan/Magenta Bevel Edge Highlight on Cylinder Top Rim
    const rimBevelGeo = new THREE.TorusGeometry(1.42, 0.007, 12, 64);
    const rimBevelMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.50,
    });
    const rimBevelMesh = new THREE.Mesh(rimBevelGeo, rimBevelMat);
    rimBevelMesh.rotation.x = Math.PI / 2;
    rimBevelMesh.position.y = 0.041;
    daisGroup.add(rimBevelMesh);

    const platformUniforms = {
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
    };
    const platformMat = new THREE.ShaderMaterial({
      uniforms: platformUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform float uScrollProgress;
        varying vec2 vUv;

        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float r = length(p);
          if (r > 1.0) discard;

          // Concentric luminous rings (matching reference_master.jpg circular dais)
          float ringOuter = smoothstep(0.025, 0.0, abs(r - 0.88));
          float ringMid1  = smoothstep(0.018, 0.0, abs(r - 0.74));
          float ringMid2  = smoothstep(0.020, 0.0, abs(r - 0.58));
          float ringInner = smoothstep(0.016, 0.0, abs(r - 0.42));

          // Flowing energy pulses along perimeter
          float angle = atan(p.y, p.x);
          float pulse1 = sin(angle * 6.0 + uTime * 2.2) * 0.5 + 0.5;
          float pulse2 = cos(angle * 8.0 - uTime * 2.8) * 0.5 + 0.5;

          vec3 cCyan = vec3(0.0, 0.92, 1.0);
          vec3 cMagenta = vec3(0.96, 0.25, 0.75);
          vec3 cLavender = vec3(0.85, 0.55, 1.0);

          // Polished obsidian reflective dais
          vec3 baseCol = vec3(0.02, 0.01, 0.04);

          // Upward luminous reflection of the orb's internal bioluminescent liquid core
          float coreReflection = pow(clamp(1.0 - r / 0.75, 0.0, 1.0), 2.2) * 0.95;
          vec3 liquidRefl = mix(cMagenta, cLavender, 0.40) * coreReflection;

          vec3 col = baseCol + liquidRefl;
          col += cCyan * (ringOuter * 1.6 + ringMid1 * 0.75 + pulse1 * ringMid2 * 0.85);
          col += cMagenta * (ringMid2 * 1.35 + pulse2 * 0.75 * ringInner);
          col += vec3(1.0, 1.0, 1.0) * (ringOuter * 0.7);

          float edgeFade = smoothstep(1.0, 0.88, r);
          float alpha = edgeFade * 0.88;

          // Platform is prominent in Hero (Scene 1) and Final CTA (Scene 6)
          float s1Visibility = smoothstep(0.18, 0.01, uScrollProgress);
          float s6Visibility = smoothstep(0.86, 0.98, uScrollProgress);
          alpha *= max(s1Visibility, s6Visibility);

          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const platformMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), platformMat);
    platformMesh.rotation.x = -Math.PI / 2.26;
    platformMesh.position.set(0, 0.043, 0);
    platformMesh.renderOrder = -20;
    daisGroup.add(platformMesh);

    // F. Celestial Shooting Stars
    const shootingStarMat1 = new THREE.LineBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const shootingStarMat2 = new THREE.LineBasicMaterial({
      color: 0xfbcfe8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const ssGeo1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-1.8, 1.1, 0),
    ]);
    const ssGeo2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.6, 1.0, 0),
    ]);
    const ssMesh1 = new THREE.Line(ssGeo1, shootingStarMat1);
    const ssMesh2 = new THREE.Line(ssGeo2, shootingStarMat2);
    scene.add(ssMesh1);
    scene.add(ssMesh2);

    // -------------------------------------------------------------------------
    // 7. Interactive Fluid Slosh Physics & Pointer Inertia
    // -------------------------------------------------------------------------
    const sloshCurrent = new THREE.Vector2(0, 0);
    const sloshTarget = new THREE.Vector2(0, 0);
    let sloshVelocity = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let isPointerDown = false;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = (clientX - lastMouseX) * 0.015;
      const deltaY = (clientY - lastMouseY) * 0.015;

      lastMouseX = clientX;
      lastMouseY = clientY;

      if (isPointerDown) {
        sloshTarget.x = Math.max(-0.5, Math.min(0.5, sloshTarget.x + deltaX * 1.5));
        sloshTarget.y = Math.max(-0.5, Math.min(0.5, sloshTarget.y + deltaY * 1.5));
        sloshVelocity = Math.min(1.0, Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 2.0);
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isPointerDown = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      lastMouseX = clientX;
      lastMouseY = clientY;
    };

    const handlePointerUp = () => {
      isPointerDown = false;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      starUniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
      updateGalaxySize();
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------------------
    // 8. Exact Scroll Choreography
    // Scene A (Hero): Orb centered in negative space between headline and CTA (scale: 0.86, orbY: -0.32)
    // Scene B (AI Tutor): Orb SHRINKS (scale: 0.62) and glides to Left Flank (orbX: -2.35, camZ: 4.8)
    // Scene C (Universe): Orb glides across to Right Flank (scale: 0.65, orbX: +2.35, camZ: 4.6)
    // Scene D (Rehearsal): Orb glides back to Left Flank (scale: 0.62, orbX: -2.30, camZ: 4.5)
    // Scene E (Progress): Orb glides to Right Flank (scale: 0.65, orbX: +2.30, camZ: 4.6)
    // Scene F (Final CTA): Orb framed gracefully behind CTA glass card (scale: 0.90, orbX: 0.0, orbY: 0.05, camZ: 5.2)
    // -------------------------------------------------------------------------
    const keyframes = [
      { progress: 0.00, orbX: 0.00,  orbY: -0.40, orbZ: 0.0, scale: 0.72, rotY: 0.0,  camZ: 5.2 },
      { progress: 0.20, orbX: -2.35, orbY: 0.00,  orbZ: 0.0, scale: 0.62, rotY: 1.2,  camZ: 4.8 },
      { progress: 0.40, orbX: 2.35,  orbY: 0.05,  orbZ: 0.0, scale: 0.65, rotY: 2.5,  camZ: 4.6 },
      { progress: 0.60, orbX: -2.30, orbY: -0.05, orbZ: 0.0, scale: 0.62, rotY: 3.8,  camZ: 4.5 },
      { progress: 0.80, orbX: 2.30,  orbY: 0.00,  orbZ: 0.0, scale: 0.65, rotY: 5.0,  camZ: 4.6 },
      { progress: 1.00, orbX: 0.00,  orbY: 0.05,  orbZ: 0.0, scale: 0.90, rotY: 6.3,  camZ: 5.2 },
    ];

    const interpolate = (p: number) => {
      const clamped = Math.max(0, Math.min(1, p));
      let idx = 0;
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (clamped >= keyframes[i].progress && clamped <= keyframes[i + 1].progress) {
          idx = i;
          break;
        }
      }
      const k1 = keyframes[idx];
      const k2 = keyframes[idx + 1];
      const t = (clamped - k1.progress) / (k2.progress - k1.progress);
      const ease = t * t * (3 - 2 * t);

      return {
        x: THREE.MathUtils.lerp(k1.orbX, k2.orbX, ease),
        y: THREE.MathUtils.lerp(k1.orbY, k2.orbY, ease),
        z: THREE.MathUtils.lerp(k1.orbZ, k2.orbZ, ease),
        scale: THREE.MathUtils.lerp(k1.scale, k2.scale, ease),
        rotY: THREE.MathUtils.lerp(k1.rotY, k2.rotY, ease),
        camZ: THREE.MathUtils.lerp(k1.camZ, k2.camZ, ease),
      };
    };

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();
    let lastScroll = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const rawTime = clock.getElapsedTime();
      const time = prefersReducedMotion ? rawTime * 0.1 : rawTime;

      // Inertia Fluid Slosh update
      const scrollDelta = (scrollRef.current - lastScroll) * 4.0;
      lastScroll = scrollRef.current;
      sloshTarget.y += scrollDelta;
      sloshTarget.x *= 0.92; // Natural dampening
      sloshTarget.y *= 0.92;
      sloshVelocity *= 0.94;

      sloshCurrent.x += (sloshTarget.x - sloshCurrent.x) * 0.08;
      sloshCurrent.y += (sloshTarget.y - sloshCurrent.y) * 0.08;

      // Update shader uniforms
      liquidUniforms.uTime.value = time;
      liquidUniforms.uSlosh.value.copy(sloshCurrent);
      liquidUniforms.uSloshVelocity.value = sloshVelocity;
      glassUniforms.uTime.value = time;
      galaxyUniforms.uTime.value = time;
      galaxyUniforms.uScrollProgress.value = scrollRef.current;
      cyanNebulaUniforms.uTime.value = time;
      magNebulaUniforms.uTime.value = time;
      mistUniforms.uTime.value = time;
      starUniforms.uTime.value = time;

      // Scroll interpolation for Orb & Camera
      const targetState = interpolate(scrollRef.current);
      const isMobile = window.innerWidth <= 768;

      let targetX = targetState.x;
      let targetY = targetState.y;
      let targetScale = targetState.scale;

      if (isMobile) {
        if (scrollRef.current < 0.12 || scrollRef.current > 0.88) {
          targetX = 0.0;
          targetY = scrollRef.current < 0.12 ? -0.36 : 0.05;
          targetScale = targetState.scale * 0.62;
        } else {
          targetX = targetState.x * 0.20;
          targetY = targetState.y + 0.25;
          targetScale = targetState.scale * 0.58;
        }
      }

      orbGroup.position.x += (targetX - orbGroup.position.x) * 0.08;
      orbGroup.position.y += (targetY - orbGroup.position.y) * 0.08;
      orbGroup.position.z += (targetState.z - orbGroup.position.z) * 0.08;

      const currentScale = orbGroup.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.08;
      orbGroup.scale.set(newScale, newScale, newScale);

      // Camera travel depth (through the galaxy)
      camera.position.z += (targetState.camZ - camera.position.z) * 0.06;

      // Continuous rotation
      glassMesh.rotation.y = targetState.rotY + time * 0.20;
      liquidGroup.rotation.y = targetState.rotY * 0.8 + time * 0.16;
      dropletsGroup.rotation.y = glassMesh.rotation.y;
      ringMesh.rotation.z += 0.0022;
      motesGroup.rotation.z = ringMesh.rotation.z;
      ringMesh2.rotation.z -= 0.0018;
      motesGroup2.rotation.z = ringMesh2.rotation.z;

      // Update local inverse matrix and camera position for volumetric raymarching
      liquidUniforms.uCameraPos.value.copy(camera.position);
      liquidGroup.updateMatrixWorld();
      liquidUniforms.uOrbMatrixInverse.value.copy(liquidGroup.matrixWorld).invert();

      // Platform & Dais visibility updates
      platformUniforms.uTime.value = time;
      platformUniforms.uScrollProgress.value = scrollRef.current;
      const s1Vis = THREE.MathUtils.smoothstep(0.18, 0.01, scrollRef.current);
      const s6Vis = THREE.MathUtils.smoothstep(0.86, 0.98, scrollRef.current);
      const daisVis = Math.max(s1Vis, s6Vis);
      daisGroup.visible = daisVis > 0.005;
      cylinderMat.opacity = 0.92 * daisVis;
      rimBevelMat.opacity = 0.50 * daisVis;

      // Shooting star 1 (periodic streaks upper left -> center, rare & realistic)
      const t1 = (time * 0.7) % 17.5;
      if (t1 < 0.80) {
        const p = t1 / 0.80;
        ssMesh1.position.set(-9.0 + p * 6.5, 6.8 - p * 3.4, -18.0);
        shootingStarMat1.opacity = Math.sin(p * Math.PI) * 0.85;
      } else {
        shootingStarMat1.opacity = 0;
      }

      // Shooting star 2 (periodic streaks right -> lower right, rare & realistic)
      const t2 = (time * 0.6 + 5.0) % 23.0;
      if (t2 < 0.85) {
        const p = t2 / 0.85;
        ssMesh2.position.set(5.5 + p * 5.0, 5.8 - p * 2.8, -16.0);
        shootingStarMat2.opacity = Math.sin(p * Math.PI) * 0.75;
      } else {
        shootingStarMat2.opacity = 0;
      }

      // Multi-layer Perspective Parallax across Scroll
      // 1. Galaxy backdrop subtle parallax
      galaxyMesh.position.x = -scrollRef.current * 0.8;
      galaxyMesh.position.y = 0.2 + scrollRef.current * 0.4;

      // 2. 3D Nebula Planes parallax
      cyanNebulaMesh.position.x = -4.2 + scrollRef.current * 1.2;
      cyanNebulaMesh.position.y = 1.8 - scrollRef.current * 0.4;

      magNebulaMesh.position.x = 3.8 - scrollRef.current * 1.3;
      magNebulaMesh.position.y = 1.2 - scrollRef.current * 0.3;

      // Low-lying valley mist parallax
      mistMesh.position.x = -scrollRef.current * 0.95;

      // 3. Stars travel with perspective depth
      starPoints.position.x = -scrollRef.current * 0.6;
      starPoints.position.y = scrollRef.current * 0.3;
      if (!prefersReducedMotion) {
        starPoints.rotation.z = time * 0.002;
      }

      dustParticles.rotation.y = time * 0.012;
      dustParticles.position.x = -scrollRef.current * 1.2;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchend', handlePointerUp);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="cinematic-canvas-viewport" />;
};
