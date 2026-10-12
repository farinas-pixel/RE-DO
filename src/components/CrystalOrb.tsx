/**
 * CrystalOrb — Signature Real 3D WebGL Liquid-Filled Crystal Glass Sphere
 *
 * Implements:
 * 1. Thick, polished refractive crystal glass outer shell:
 *    - Double-pass physical glass with high specular highlights, pink & lavender Fresnel optical rim.
 * 2. Realistic Water Droplets on outside glass surface:
 *    - Micro glass condensation droplets and teardrop trails anchored to the glass shell surface.
 *    - Reflective specular highlights on outer curvature.
 * 3. Real-time physically inspired internal liquid volume with clear liquid level:
 *    - Planar meniscus cut-off at liquid level (~55-65% full) so users can distinctly see liquid vs air space!
 *    - Slosh physics: angular acceleration generates dynamic liquid tilt & ripples with damped harmonic oscillation.
 *    - Inertia lag: fluid sloshes behind touch drag and device tilt.
 * 4. Touch drag & release rotation + DeviceOrientation tilt fallback.
 * 5. Floating cosmic star dust micro-particles.
 * 6. Audio-reactive pulse and mode state support.
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

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.6;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      container.appendChild(renderer.domElement);
    } catch {
      container.innerHTML = `
        <div style="width:${size}px; height:${size}px; border-radius:50%; background:radial-gradient(circle at 35% 35%, #f472b6, #c084fc, #1e1038); box-shadow:0 0 45px rgba(244,114,182,0.5);"></div>
      `;
      return;
    }

    // 2. Cinematic Lighting System (Pink & Lavender Glows + Specular Key Lights)
    const ambientLight = new THREE.AmbientLight(0x2d124d, 2.8 * intensity);
    scene.add(ambientLight);

    const pinkKeyLight = new THREE.PointLight(0xf472b6, 5.0 * intensity, 18);
    pinkKeyLight.position.set(3.5, 3.5, 4.2);
    scene.add(pinkKeyLight);

    const lavenderRimLight = new THREE.PointLight(0xa855f7, 5.5 * intensity, 18);
    lavenderRimLight.position.set(-3.5, -2.5, -2.5);
    scene.add(lavenderRimLight);

    const specularLight = new THREE.DirectionalLight(0xfff5fb, 2.6 * intensity);
    specularLight.position.set(0, 5.0, 3.5);
    scene.add(specularLight);

    // Group for entire sphere contents to rotate under interactive touch
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // 3. Internal Liquid Volume Shader
    // High-precision GLSL with distinct liquid surface plane (meniscus level), slosh tilt, and caustics
    const liquidUniforms = {
      uTime: { value: 0 },
      uSlosh: { value: new THREE.Vector2(0, 0) },
      uSloshVelocity: { value: 0 },
      uAudio: { value: 0 },
      uLiquidLevel: { value: 0.15 }, // Water line around 55% height
      uColorBottom: { value: new THREE.Color(0x8b2fc9) }, // Vibrant Crystal Violet
      uColorTop: { value: new THREE.Color(0xf472b6) },    // Luminous Dream Pink
      uColorSurface: { value: new THREE.Color(0xffe4f3) },// Frothy pearl meniscus foam
    };

    const liquidVertexShader = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uSlosh;
      uniform float uSloshVelocity;
      uniform float uAudio;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying float vWaveDisplacement;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position;

        // Slosh wave displacement along normal
        float tilt = dot(pos.xz, uSlosh) * 0.28;
        float ripple = sin(pos.x * 5.0 + uTime * 4.0) * cos(pos.z * 5.0 + uTime * 3.2) * (0.035 + uSloshVelocity * 0.07 + uAudio * 0.06);
        float micro = sin(pos.y * 9.0 + uTime * 7.0) * 0.015;
        float wave = tilt + ripple + micro;

        pos += normal * wave;
        vWaveDisplacement = wave;

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
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
      uniform vec3 uColorSurface;
      uniform float uLiquidLevel;
      uniform vec2 uSlosh;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying float vWaveDisplacement;

      void main() {
        // Calculate dynamic surface plane tilted by slosh
        float surfacePlane = vWorldPosition.y - (uLiquidLevel + dot(vWorldPosition.xz, uSlosh) * 0.35 + vWaveDisplacement);

        // Discard any fragment above the liquid meniscus level!
        if (surfacePlane > 0.08) {
          discard;
        }

        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.2);

        // Vertical gradient inside liquid body
        float bodyGrad = clamp((vWorldPosition.y + 1.1) / 1.5, 0.0, 1.0);
        vec3 col = mix(uColorBottom, uColorTop, bodyGrad);

        // Internal caustic light refractions
        float caustic = sin(vUv.x * 14.0 + uTime * 2.2) * cos(vUv.y * 14.0 - uTime * 2.8);
        caustic = pow(clamp(caustic * 0.5 + 0.5, 0.0, 1.0), 3.0) * 0.42;
        col += vec3(caustic * 0.9, caustic * 0.65, caustic * 0.95);

        // Meniscus surface foam highlight right at the top water cut-off line
        if (surfacePlane > -0.07) {
          float surfaceFactor = smoothstep(-0.07, 0.05, surfacePlane);
          col = mix(col, uColorSurface, surfaceFactor * 0.85);
        }

        // Rim highlight
        col += uColorTop * (fresnel * 0.55);

        gl_FragColor = vec4(col, 0.92);
      }
    `;

    const liquidGeo = new THREE.SphereGeometry(1.08, 48, 48);
    const liquidMat = new THREE.ShaderMaterial({
      uniforms: liquidUniforms,
      vertexShader: liquidVertexShader,
      fragmentShader: liquidFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.renderOrder = 0;
    orbGroup.add(liquidMesh);

    // 4. Outer Crystal Glass Shell
    // High-refraction transparent glass with pink-lavender specular highlights
    const glassGeo = new THREE.SphereGeometry(1.30, 64, 64);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x3b0764,
      emissiveIntensity: 0.12 * intensity,
      roughness: 0.05,
      metalness: 0.08,
      transmission: 0.88,
      thickness: 1.2,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.renderOrder = 1;
    orbGroup.add(glassMesh);

    // 5. Water Droplets on Outside Glass Surface
    // Realistic micro-spheres and teardrop beads clinging to outer glass shell
    const dropletsGroup = new THREE.Group();
    const dropletMat = new THREE.MeshPhysicalMaterial({
      color: 0xfff0f8,
      roughness: 0.03,
      metalness: 0.02,
      transmission: 0.92,
      ior: 1.333, // Water refractive index
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.9,
    });

    // Seed realistic droplet coordinates spread over glass shell (radius = 1.30)
    const dropletR = 1.30;
    const dropletCoords = [
      { lat: 0.25, lon: 0.4, scale: 0.055 },
      { lat: 0.35, lon: 0.42, scale: 0.038 }, // Trail bead
      { lat: 0.48, lon: 0.44, scale: 0.025 }, // Trail bead
      { lat: -0.15, lon: 1.2, scale: 0.065 },
      { lat: -0.28, lon: 1.22, scale: 0.042 },
      { lat: 0.55, lon: -0.8, scale: 0.06 },
      { lat: -0.4, lon: -1.5, scale: 0.07 },
      { lat: -0.52, lon: -1.48, scale: 0.035 },
      { lat: 0.1, lon: -2.1, scale: 0.05 },
      { lat: 0.6, lon: 2.2, scale: 0.065 },
      { lat: 0.72, lon: 2.25, scale: 0.03 },
      { lat: -0.3, lon: 2.8, scale: 0.055 },
      { lat: 0.4, lon: -2.8, scale: 0.048 },
      { lat: -0.6, lon: 0.8, scale: 0.06 },
      { lat: 0.15, lon: 1.8, scale: 0.052 },
    ];

    const dropletGeometries: THREE.SphereGeometry[] = [];
    dropletCoords.forEach((d) => {
      const geo = new THREE.SphereGeometry(d.scale, 16, 16);
      dropletGeometries.push(geo);
      const mesh = new THREE.Mesh(geo, dropletMat);

      // Position on the outer surface of glass shell
      const phi = Math.PI / 2 - d.lat;
      const theta = d.lon;
      mesh.position.set(
        dropletR * Math.sin(phi) * Math.cos(theta),
        dropletR * Math.cos(phi),
        dropletR * Math.sin(phi) * Math.sin(theta)
      );
      // Slightly flatten droplet against glass surface for natural surface tension
      mesh.lookAt(0, 0, 0);
      mesh.scale.set(1.0, 1.0, 0.55);
      dropletsGroup.add(mesh);
    });
    dropletsGroup.renderOrder = 2;
    orbGroup.add(dropletsGroup);

    // 6. Gyroscopic Crystalline Orbital Rings
    const ringGeo1 = new THREE.TorusGeometry(1.85, 0.016, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.85,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 3;
    scene.add(ringMesh1);

    const ringGeo2 = new THREE.TorusGeometry(2.05, 0.014, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.85,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.y = Math.PI / 4;
    scene.add(ringMesh2);

    // 7. Floating Star Dust Micro-Particles
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 1.9 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfce7f3,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 8. Interactive Multi-Touch & Slosh Physics Engine
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

        // Slosh angular acceleration (liquid pushes opposite to drag direction)
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

    // Device orientation tilt sensor for mobile devices
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const tiltX = (e.gamma / 45) * 0.5; // left-right tilt
        const tiltY = ((e.beta - 45) / 45) * 0.5; // front-back tilt
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

      // Liquid harmonic oscillation & viscosity damping
      const springK = 16.0;   // Restoring force
      const dampingC = 3.6;   // Viscous damping
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

      // Mode-specific color aura
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
        liquidUniforms.uColorBottom.value.setHex(0x8b2fc9);
      }

      if (!prefersReducedMotion) {
        // Continuous organic rotation of outer shell & droplets
        glassMesh.rotation.y += delta * 0.42;
        dropletsGroup.rotation.y += delta * 0.42;

        // Liquid volume rotates with independent inertia lag
        liquidMesh.rotation.y += delta * 0.32;
        liquidMesh.rotation.x = slosh.y * 0.35;
        liquidMesh.rotation.z = -slosh.x * 0.35;

        // Gyroscopic ring motion
        ringMesh1.rotation.z += delta * 0.7;
        ringMesh1.rotation.x = Math.PI / 3 + Math.sin(time * 1.1) * 0.12;

        ringMesh2.rotation.z -= delta * 0.6;
        ringMesh2.rotation.y = Math.PI / 4 + Math.cos(time * 0.85) * 0.12;

        // Floating particles
        particles.rotation.y += delta * 0.1;
        particles.rotation.x += delta * 0.05;

        // Breathing pulse & audio expansion
        const breathe = 1.0 + Math.sin(time * 2.0) * 0.025 + (audioLevelRef.current || 0) * 0.32;
        orbGroup.scale.set(breathe, breathe, breathe);

        // Smooth interactive parallax interpolation
        currentRotX += (targetRotX - currentRotX) * 0.08;
        currentRotY += (targetRotY - currentRotY) * 0.08;
        orbGroup.rotation.x = currentRotX;
        orbGroup.rotation.y = currentRotY;

        // Spring-back to center when not dragging
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
