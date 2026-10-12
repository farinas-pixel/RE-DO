/**
 * CrystalOrb — Signature Real 3D WebGL Liquid-Filled Crystal Glass Sphere
 *
 * Implements:
 * 1. Thick, polished refractive crystal glass outer shell using MeshPhysicalMaterial:
 *    - Physical transmission (0.92), thickness (1.4), IOR (1.52), low roughness, clearcoat (1.0).
 * 2. Real-time physically inspired liquid volume inside:
 *    - Dual-frequency wave simulation with inertia lag (velocity lag behind outer shell rotation).
 *    - Slosh physics: angular acceleration generates dynamic liquid tilt & ripples with damped harmonic oscillation.
 *    - Custom GLSL vertex & fragment shader with moving meniscus curve, internal light caustics,
 *      depth absorption gradient (Dream Pink #f472b6 to Crystal Lavender #c084fc), and iridescent specular glints.
 * 3. Mobile-first touch & drag physics:
 *    - Dragging the sphere creates fluid velocity forces that slosh and ripple the liquid.
 *    - On release, the outer shell springs back while the internal liquid continues oscillating with natural damping.
 * 4. Micro-particle star dust field suspended around the sphere.
 * 5. Audio-reactive pulse and mode state support.
 * 6. WebGL cleanup and reduced-motion fallback.
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
      renderer.toneMappingExposure = 1.25;
      container.appendChild(renderer.domElement);
    } catch {
      container.innerHTML = `
        <div style="width:${size}px; height:${size}px; border-radius:50%; background:radial-gradient(circle at 35% 35%, #f472b6, #c084fc, #1e1038); box-shadow:0 0 45px rgba(244,114,182,0.5);"></div>
      `;
      return;
    }

    // 2. Cinematic Lighting System
    const ambientLight = new THREE.AmbientLight(0x2d124d, 2.6 * intensity);
    scene.add(ambientLight);

    // Dream Pink Key Light
    const pinkKeyLight = new THREE.PointLight(0xf472b6, 4.5 * intensity, 16);
    pinkKeyLight.position.set(3.5, 3.5, 4.2);
    scene.add(pinkKeyLight);

    // Crystal Lavender Rim Light
    const lavenderRimLight = new THREE.PointLight(0xa855f7, 5.0 * intensity, 16);
    lavenderRimLight.position.set(-3.5, -2.5, -2.5);
    scene.add(lavenderRimLight);

    // Pearl-White Specular Highlight
    const specularLight = new THREE.DirectionalLight(0xfff5fb, 2.2 * intensity);
    specularLight.position.set(0, 5.0, 3.5);
    scene.add(specularLight);

    // 3. Internal Liquid Volume (Custom Shader with Inertial Slosh & Wave Physics)
    const liquidUniforms = {
      uTime: { value: 0 },
      uSlosh: { value: new THREE.Vector2(0, 0) },
      uSloshVelocity: { value: 0 },
      uAudio: { value: 0 },
      uColorBottom: { value: new THREE.Color(0xa855f7) }, // Deep Crystal Lavender
      uColorTop: { value: new THREE.Color(0xf472b6) },    // Dream Pink
      uColorFoam: { value: new THREE.Color(0xfff0f7) },   // Iridescent Pearl
      uLightPos: { value: new THREE.Vector3(3.5, 3.5, 4.2) },
    };

    const liquidVertexShader = `
      uniform float uTime;
      uniform vec2 uSlosh;
      uniform float uSloshVelocity;
      uniform float uAudio;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vWaveHeight;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position;

        // Slosh plane tilt driven by inertia
        float tilt = dot(pos.xz, uSlosh) * 0.35;

        // Dynamic surface ripples responding to slosh velocity and audio
        float ripple = sin(pos.x * 4.0 + uTime * 3.5) * cos(pos.z * 4.0 + uTime * 2.8) * (0.04 + uSloshVelocity * 0.08 + uAudio * 0.05);
        float microRipple = sin(pos.y * 8.0 + uTime * 6.0) * 0.015;

        // Displace liquid along normal
        float wave = tilt + ripple + microRipple;
        pos += normal * wave;
        vWaveHeight = wave;
        vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const liquidFragmentShader = `
      uniform float uTime;
      uniform vec3 uColorBottom;
      uniform vec3 uColorTop;
      uniform vec3 uColorFoam;
      uniform vec3 uLightPos;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vWaveHeight;

      void main() {
        // Fresnel rim highlighting the internal liquid curvature
        vec3 viewDir = normalize(-vPosition);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

        // Fluid vertical gradient from deep lavender to luminous dream pink
        float verticalGrad = clamp(vUv.y + vWaveHeight * 1.5, 0.0, 1.0);
        vec3 liquidColor = mix(uColorBottom, uColorTop, verticalGrad);

        // Animated caustic light refractions inside the liquid volume
        float caustic = sin(vUv.x * 12.0 + uTime * 2.0) * cos(vUv.y * 12.0 - uTime * 2.5);
        caustic = pow(clamp(caustic * 0.5 + 0.5, 0.0, 1.0), 3.0) * 0.35;

        // Iridescent meniscus foam highlight
        vec3 finalColor = liquidColor + vec3(caustic) + uColorFoam * (fresnel * 0.65);

        gl_FragColor = vec4(finalColor, 0.88);
      }
    `;

    const liquidGeo = new THREE.SphereGeometry(1.02, 48, 48);
    const liquidMat = new THREE.ShaderMaterial({
      uniforms: liquidUniforms,
      vertexShader: liquidVertexShader,
      fragmentShader: liquidFragmentShader,
      transparent: true,
      depthWrite: false,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    scene.add(liquidMesh);

    // 4. Outer Crystal Glass Shell (MeshPhysicalMaterial with Optical Transmission)
    const glassGeo = new THREE.SphereGeometry(1.32, 64, 64);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x3b0764,
      emissiveIntensity: 0.15 * intensity,
      roughness: 0.04,
      metalness: 0.05,
      transmission: 0.92, // Optical clarity & refraction
      thickness: 1.4,
      ior: 1.52,          // Crown glass optical index
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.88,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    scene.add(glassMesh);

    // 5. Gyroscopic Crystalline Orbitals (Two fine luminous orbital rings)
    const ringGeo1 = new THREE.TorusGeometry(1.85, 0.016, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.8,
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
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.85,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.y = Math.PI / 4;
    scene.add(ringMesh2);

    // 6. Floating Star Dust Micro-Particles
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
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Interactive Physics & Fluid Slosh Engine
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    // Liquid inertia and harmonic slosh oscillation variables
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

        // Apply angular acceleration to fluid slosh (liquid lags behind shell)
        sloshVel.x -= deltaX * 0.04;
        sloshVel.y -= deltaY * 0.04;

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

    if (interactive) {
      container.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Liquid Physics Integration (Damped Harmonic Oscillator)
      // F = -k * x - c * v
      const springK = 18.0;   // Restoring force
      const dampingC = 3.8;   // Viscous damping
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
        liquidUniforms.uColorTop.value.setHex(0x38bdf8); // Sky blue
        liquidUniforms.uColorBottom.value.setHex(0x0284c7);
      } else if (currentMode === 'processing') {
        liquidUniforms.uColorTop.value.setHex(0xa855f7); // Violet thinking
        liquidUniforms.uColorBottom.value.setHex(0x581c87);
      } else if (currentMode === 'responding') {
        liquidUniforms.uColorTop.value.setHex(0xf472b6); // Dream pink responding
        liquidUniforms.uColorBottom.value.setHex(0x9d174d);
      } else if (currentMode === 'success') {
        liquidUniforms.uColorTop.value.setHex(0x34d399); // Emerald success
        liquidUniforms.uColorBottom.value.setHex(0x065f46);
      } else if (currentMode === 'failure') {
        liquidUniforms.uColorTop.value.setHex(0xf87171); // Red failure
        liquidUniforms.uColorBottom.value.setHex(0x991b1b);
      } else {
        liquidUniforms.uColorTop.value.setHex(0xf472b6); // Dream pink
        liquidUniforms.uColorBottom.value.setHex(0xa855f7); // Crystal lavender
      }

      if (!prefersReducedMotion) {
        // Continuous organic rotation of outer shell
        glassMesh.rotation.y += delta * 0.45;
        glassMesh.rotation.x += delta * 0.22;

        // Liquid volume rotates independently with inertia lag
        liquidMesh.rotation.y += delta * 0.35;
        liquidMesh.rotation.x += delta * 0.18;

        // Gyroscopic ring motion
        ringMesh1.rotation.z += delta * 0.7;
        ringMesh1.rotation.x = Math.PI / 3 + Math.sin(time * 1.1) * 0.12;

        ringMesh2.rotation.z -= delta * 0.6;
        ringMesh2.rotation.y = Math.PI / 4 + Math.cos(time * 0.85) * 0.12;

        // Floating particles
        particles.rotation.y += delta * 0.1;
        particles.rotation.x += delta * 0.05;

        // Breathing pulse & audio expansion
        const breathe = 1.0 + Math.sin(time * 2.0) * 0.03 + (audioLevelRef.current || 0) * 0.35;
        glassMesh.scale.set(breathe, breathe, breathe);
        liquidMesh.scale.set(breathe, breathe, breathe);

        // Smooth interactive parallax interpolation
        currentRotX += (targetRotX - currentRotX) * 0.08;
        currentRotY += (targetRotY - currentRotY) * 0.08;
        scene.rotation.x = currentRotX;
        scene.rotation.y = currentRotY;

        // Smooth spring-back to center when not dragging
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
