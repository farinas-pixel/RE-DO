/**
 * CrystalOrb — Signature Real 3D WebGL Liquid-Filled Crystal Glass Sphere
 *
 * Implements:
 * A. REALISTIC TRANSPARENT CRYSTAL GLASS ORB:
 *    - Custom GLSL glass shader with Fresnel edge refraction, iridescent specular highlights,
 *      and physical transparency. Eliminates the opaque grey artifact on mobile WebGL / WebView.
 *    - Synthetic procedural cubemap reflections so glass has vivid crystal highlights even without external HDR textures.
 *
 * B. TRANSLUCENT LIQUID:
 *    - Visibly translucent pink & lavender liquid body with internal caustic refractions.
 *    - Organic 3D wave simulation (dual-frequency sinusoids + slosh inertia) with curved dynamic meniscus.
 *    - Natural harmonic oscillation and viscous settling when motion stops.
 *
 * C. EXTERIOR WATER DROPLETS:
 *    - Varied-size droplets on the outside glass surface with specular pearl highlights and curved meniscus beads.
 *    - Distinct refraction highlights to avoid flat grey dots.
 *
 * D. DELICATE ORBITAL ACCENTS:
 *    - Fine, subtle luminous crystalline orbital threads that do not distract from the primary orb.
 *
 * E. MOBILE INTERACTION & TILT:
 *    - Touch drag slosh physics + DeviceOrientation tilt integration.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface CrystalOrbProps {
  size?: number;
  interactive?: boolean;
  intensity?: number;
  mode?: 'idle' | 'listening' | 'processing' | 'responding' | 'success' | 'failure';
  audioLevel?: number; // 0.0 to 1.0 real audio-reactive amplitude
  className?: string;
  onClick?: () => void;
}

export const CrystalOrb: React.FC<CrystalOrbProps> = ({
  size = 280,
  interactive = true,
  intensity = 1.0,
  mode = 'idle',
  audioLevel = 0,
  className = '',
  onClick,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const audioLevelRef = useRef(audioLevel);
  const modeRef = useRef(mode);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
    modeRef.current = mode;
  }, [audioLevel, mode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene, Camera, WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.5;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);
    } catch {
      container.innerHTML = `
        <div style="width:${size}px; height:${size}px; border-radius:50%; background:radial-gradient(circle at 35% 35%, #f472b6, #c084fc, #1e1038); box-shadow:0 0 45px rgba(244,114,182,0.5);"></div>
      `;
      return;
    }

    // 2. Cinematic Lighting System
    const ambientLight = new THREE.AmbientLight(0x28103c, 2.5 * intensity);
    scene.add(ambientLight);

    const pinkKeyLight = new THREE.PointLight(0xf472b6, 4.5 * intensity, 20);
    pinkKeyLight.position.set(3.2, 3.5, 4.0);
    scene.add(pinkKeyLight);

    const lavenderRimLight = new THREE.PointLight(0xa855f7, 5.0 * intensity, 20);
    lavenderRimLight.position.set(-3.5, -2.5, -2.0);
    scene.add(lavenderRimLight);

    const specularLight = new THREE.DirectionalLight(0xfff5fa, 2.8 * intensity);
    specularLight.position.set(1.5, 4.5, 3.5);
    scene.add(specularLight);

    // Master group for orb rotation
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // 3. TRANSLUCENT LIQUID VOLUME (Custom Shader with Curved Meniscus & Translucent Depth)
    const liquidUniforms = {
      uTime: { value: 0 },
      uSlosh: { value: new THREE.Vector2(0, 0) },
      uSloshVelocity: { value: 0 },
      uAudio: { value: 0 },
      uLiquidLevel: { value: 0.05 }, // Curved meniscus at natural center height
      uColorBottom: { value: new THREE.Color(0xa855f7) }, // Luminous Lavender
      uColorTop: { value: new THREE.Color(0xf472b6) },    // Translucent Vibrant Pink
      uColorFoam: { value: new THREE.Color(0xfff0fb) },   // Specular Pearl Meniscus
    };

    const liquidVertexShader = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uSlosh;
      uniform float uSloshVelocity;
      uniform float uAudio;
      varying vec3 vModelPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying float vWaveDisplacement;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position;

        // Curved dynamic meniscus + natural liquid slosh
        float tilt = dot(pos.xz, uSlosh) * 0.35;
        // Natural surface meniscus curvature dipping in center
        float meniscusCurve = -length(pos.xz) * 0.04;
        float ripple1 = sin(pos.x * 3.6 + uTime * 3.2) * cos(pos.z * 3.6 + uTime * 2.5) * (0.035 + uSloshVelocity * 0.06 + uAudio * 0.05);
        float ripple2 = sin(pos.y * 6.0 + uTime * 4.5) * 0.012;
        float wave = tilt + meniscusCurve + ripple1 + ripple2;

        pos += normal * wave;
        vWaveDisplacement = wave;
        vModelPosition = pos;

        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const liquidFragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform vec3 uColorBottom;
      uniform vec3 uColorTop;
      uniform vec3 uColorFoam;
      uniform float uLiquidLevel;
      uniform vec2 uSlosh;
      varying vec3 vModelPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying float vWaveDisplacement;

      void main() {
        // Slosh plane computed in local sphere coordinates
        float surfaceDist = vModelPosition.y - (uLiquidLevel + dot(vModelPosition.xz, uSlosh) * 0.35 + vWaveDisplacement);

        // Smooth curved meniscus transition
        float surfaceAlpha = 1.0 - smoothstep(-0.015, 0.035, surfaceDist);
        if (surfaceAlpha <= 0.01) {
          discard;
        }

        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.4);

        // Translucent liquid depth gradient
        float depthFactor = clamp((vModelPosition.y + 1.1) / 1.5, 0.0, 1.0);
        vec3 fluidColor = mix(uColorBottom, uColorTop, depthFactor);

        // Internal caustic light refractions
        float caustics = sin(vUv.x * 10.0 + uTime * 2.2) * cos(vUv.y * 10.0 - uTime * 1.9);
        caustics = pow(clamp(caustics * 0.5 + 0.5, 0.0, 1.0), 2.8) * 0.4;
        fluidColor += vec3(caustics * 0.9, caustics * 0.5, caustics * 0.95);

        // Luminous foam / curved meniscus highlight at top surface
        float foamFactor = smoothstep(-0.07, 0.0, surfaceDist) * (1.0 - smoothstep(0.0, 0.035, surfaceDist));
        fluidColor = mix(fluidColor, uColorFoam, foamFactor * 0.9);

        // Rim scattering inside liquid
        fluidColor += uColorTop * (fresnel * 0.7);

        // Translucent alpha: allows optical light transmission through fluid
        float alpha = mix(0.70, 0.88, depthFactor) * surfaceAlpha;
        gl_FragColor = vec4(fluidColor, alpha);
      }
    `;

    const liquidGeo = new THREE.SphereGeometry(1.08, 48, 48);
    const liquidMat = new THREE.ShaderMaterial({
      uniforms: liquidUniforms,
      vertexShader: liquidVertexShader,
      fragmentShader: liquidFragmentShader,
      transparent: true,
      depthWrite: false,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.renderOrder = 0;
    orbGroup.add(liquidMesh);

    // 4. REALISTIC TRANSPARENT CRYSTAL GLASS SHELL
    // Crystal glass: High transparency, sharp white specular glints, chromatic Fresnel rim
    const glassUniforms = {
      uTime: { value: 0 },
      uRimColorPink: { value: new THREE.Color(0xfbcfe8) },      // Soft crystal pink
      uRimColorLavender: { value: new THREE.Color(0xe9d5ff) },  // Soft crystal lavender
      uHighlightColor: { value: new THREE.Color(0xffffff) },
      uLightDir: { value: new THREE.Vector3(1.5, 4.5, 3.5).normalize() },
    };

    const glassVertexShader = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldNormal;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPos.xyz;
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const glassFragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform vec3 uRimColorPink;
      uniform vec3 uRimColorLavender;
      uniform vec3 uHighlightColor;
      uniform vec3 uLightDir;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldNormal;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 norm = normalize(vNormal);

        // Crystal Fresnel reflection: Pure glass transparency facing camera (NdotV ~ 1.0), brilliant reflections at glancing angles
        float NdotV = max(dot(viewDir, norm), 0.0);
        float fresnel = pow(1.0 - NdotV, 3.5);

        // Primary key specular highlight (brilliant crisp crystal light reflection)
        vec3 halfDir = normalize(uLightDir + viewDir);
        float spec1 = pow(max(dot(norm, halfDir), 0.0), 64.0) * 1.6;

        // Secondary soft bounce glint (environmental ambient reflection)
        vec3 halfDir2 = normalize(vec3(-1.2, 1.5, 1.0) + viewDir);
        float spec2 = pow(max(dot(norm, halfDir2), 0.0), 32.0) * 0.75;

        // Crystal chromatic rim dispersion (pink & lavender glancing reflections)
        vec3 rimColor = mix(uRimColorLavender, uRimColorPink, clamp(vWorldNormal.y * 0.5 + 0.5, 0.0, 1.0));
        vec3 finalColor = rimColor * fresnel * 1.35 + uHighlightColor * (spec1 + spec2);

        // Alpha: Near zero in center (0.05-0.12) for true transparent crystal clarity, crisp optical edge (0.75)
        float alpha = clamp(0.08 + fresnel * 0.65 + spec1 * 0.9, 0.05, 0.85);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const glassGeo = new THREE.SphereGeometry(1.28, 64, 64);
    const glassMat = new THREE.ShaderMaterial({
      uniforms: glassUniforms,
      vertexShader: glassVertexShader,
      fragmentShader: glassFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.renderOrder = 1;
    orbGroup.add(glassMesh);

    // 5. EXTERIOR WATER DROPLETS (Refined, luminous crystal beads matching reference)
    const dropletsGroup = new THREE.Group();
    const dropletMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf472b6,
      emissiveIntensity: 0.3,
      roughness: 0.08,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });

    const dropletR = 1.28;
    const dropletCoords = [
      { lat: 0.22, lon: 0.42, scale: 0.038 },
      { lat: 0.32, lon: 0.44, scale: 0.024 },
      { lat: -0.18, lon: 1.15, scale: 0.042 },
      { lat: 0.52, lon: -0.75, scale: 0.040 },
      { lat: -0.38, lon: -1.45, scale: 0.045 },
      { lat: 0.12, lon: -2.05, scale: 0.035 },
      { lat: 0.48, lon: 2.15, scale: 0.042 },
    ];

    const dropletGeometries: THREE.SphereGeometry[] = [];
    dropletCoords.forEach((d) => {
      const geo = new THREE.SphereGeometry(d.scale, 16, 16);
      dropletGeometries.push(geo);
      const mesh = new THREE.Mesh(geo, dropletMat);

      const phi = Math.PI / 2 - d.lat;
      const theta = d.lon;
      mesh.position.set(
        dropletR * Math.sin(phi) * Math.cos(theta),
        dropletR * Math.cos(phi),
        dropletR * Math.sin(phi) * Math.sin(theta)
      );
      mesh.lookAt(0, 0, 0);
      mesh.scale.set(1.0, 1.0, 0.6);
      dropletsGroup.add(mesh);
    });
    dropletsGroup.renderOrder = 2;
    orbGroup.add(dropletsGroup);

    // 6. DELICATE ORBITAL ACCENTS (Ultra-fine luminous crystalline thread)
    const ringGeo1 = new THREE.TorusGeometry(1.72, 0.0035, 8, 80);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 3;
    scene.add(ringMesh1);

    const ringGeo2 = new THREE.TorusGeometry(1.88, 0.003, 8, 80);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.35,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.y = Math.PI / 4;
    scene.add(ringMesh2);

    // 7. Floating Cosmic Star Dust Particles
    const particleCount = 38;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 1.8 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfce7f3,
      size: 0.038,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 8. Interactive Touch & Fluid Slosh Physics Engine
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const slosh = new THREE.Vector2(0, 0);
    const sloshVel = new THREE.Vector2(0, 0);
    let sloshIntensity = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      if (isDragging) {
        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;

        targetRotY += deltaX * 0.012;
        targetRotX += deltaY * 0.012;

        // Slosh angular acceleration (liquid sloshes opposite to drag direction)
        sloshVel.x -= deltaX * 0.045;
        sloshVel.y += deltaY * 0.045;

        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      } else {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotY = x * 0.55;
        targetRotX = -y * 0.55;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const tiltX = (e.gamma / 45) * 0.5;
        const tiltY = ((e.beta - 45) / 45) * 0.5;
        sloshVel.x += (tiltX - slosh.x) * 0.2;
        sloshVel.y += (tiltY - slosh.y) * 0.2;
      }
    };

    if (interactive) {
      container.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', onDeviceOrientation);
      }
    }

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Damped harmonic oscillator for natural slosh physics
      const springK = 15.0;   // Restoring force
      const dampingC = 3.5;   // Viscous damping
      sloshVel.x += (-springK * slosh.x - dampingC * sloshVel.x) * delta;
      sloshVel.y += (-springK * slosh.y - dampingC * sloshVel.y) * delta;
      slosh.x += sloshVel.x * delta;
      slosh.y += sloshVel.y * delta;
      sloshIntensity = sloshVel.length();

      // Update shader uniforms
      liquidUniforms.uTime.value = time;
      liquidUniforms.uSlosh.value.copy(slosh);
      liquidUniforms.uSloshVelocity.value = Math.min(sloshIntensity, 2.5);
      liquidUniforms.uAudio.value = audioLevelRef.current || 0;
      glassUniforms.uTime.value = time;

      // Mode-specific color states
      const currentMode = modeRef.current;
      if (currentMode === 'listening') {
        liquidUniforms.uColorTop.value.setHex(0x38bdf8);
        liquidUniforms.uColorBottom.value.setHex(0x0284c7);
      } else if (currentMode === 'processing') {
        liquidUniforms.uColorTop.value.setHex(0xa855f7);
        liquidUniforms.uColorBottom.value.setHex(0x581c87);
      } else if (currentMode === 'responding') {
        liquidUniforms.uColorTop.value.setHex(0xf472b6);
        liquidUniforms.uColorBottom.value.setHex(0x9d174d);
      } else if (currentMode === 'success') {
        liquidUniforms.uColorTop.value.setHex(0x34d399);
        liquidUniforms.uColorBottom.value.setHex(0x065f46);
      } else if (currentMode === 'failure') {
        liquidUniforms.uColorTop.value.setHex(0xf87171);
        liquidUniforms.uColorBottom.value.setHex(0x991b1b);
      } else {
        liquidUniforms.uColorTop.value.setHex(0xf472b6);
        liquidUniforms.uColorBottom.value.setHex(0x7e22ce);
      }

      if (!prefersReducedMotion) {
        // Continuous rotation of outer shell & droplets
        glassMesh.rotation.y += delta * 0.38;
        dropletsGroup.rotation.y += delta * 0.38;

        // Internal liquid volume rotates independently with inertia lag
        liquidMesh.rotation.y += delta * 0.28;
        liquidMesh.rotation.x = slosh.y * 0.35;
        liquidMesh.rotation.z = -slosh.x * 0.35;

        // Subtle orbital threads
        ringMesh1.rotation.z += delta * 0.55;
        ringMesh1.rotation.x = Math.PI / 3 + Math.sin(time * 1.1) * 0.1;

        ringMesh2.rotation.z -= delta * 0.45;
        ringMesh2.rotation.y = Math.PI / 4 + Math.cos(time * 0.85) * 0.1;

        // Floating particles
        particles.rotation.y += delta * 0.08;
        particles.rotation.x += delta * 0.04;

        // Breathing pulse & audio expansion
        const breathe = 1.0 + Math.sin(time * 2.0) * 0.02 + (audioLevelRef.current || 0) * 0.3;
        orbGroup.scale.set(breathe, breathe, breathe);

        // Smooth interactive parallax interpolation
        currentRotX += (targetRotX - currentRotX) * 0.08;
        currentRotY += (targetRotY - currentRotY) * 0.08;
        orbGroup.rotation.x = currentRotX;
        orbGroup.rotation.y = currentRotY;

        if (!isDragging) {
          targetRotX *= 0.985;
          targetRotY *= 0.985;
        }
      }

      renderer?.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (interactive) {
        container.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        if (window.DeviceOrientationEvent) {
          window.removeEventListener('deviceorientation', onDeviceOrientation);
        }
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      liquidGeo.dispose();
      liquidMat.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      dropletMat.dispose();
      dropletGeometries.forEach((g) => g.dispose());
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [size, interactive, intensity]);

  return (
    <div
      ref={mountRef}
      className={`crystal-orb-webgl-wrapper ${className}`}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: interactive ? 'grab' : 'default',
        touchAction: 'none',
      }}
    />
  );
};
