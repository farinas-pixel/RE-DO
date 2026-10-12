/**
 * CrystalOrb — Signature Real 3D WebGL Holographic Crystal Orb
 * Reference Fidelity: Dream Pink ambient glow, Crystal Violet refraction,
 * Frosted Glass transmission, floating orbital rings, and genuine interactive pointer parallax.
 *
 * Performance-conscious: Gracefully falls back to 2D canvas if WebGL is unavailable.
 * Respects prefers-reduced-motion. Proper WebGL cleanup & geometry disposal on unmount.
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
}

export const CrystalOrb: React.FC<CrystalOrbProps> = ({
  size = 280,
  interactive = true,
  intensity = 1.0,
  mode = 'idle',
  audioLevel = 0,
  className = '',
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

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5.2;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      // Graceful fallback for non-WebGL environments
      container.innerHTML = `
        <div style="width:${size}px; height:${size}px; border-radius:50%; background:radial-gradient(circle at 35% 35%, #f472b6, #8b5cf6, #1e1b4b); box-shadow:0 0 35px rgba(244,114,182,0.4);"></div>
      `;
      return;
    }

    // 2. Lighting System (Dream Pink & Crystal Violet accents)
    const ambientLight = new THREE.AmbientLight(0x2a1645, 2.5 * intensity);
    scene.add(ambientLight);

    const pinkKeyLight = new THREE.PointLight(0xf472b6, 3.5 * intensity, 15);
    pinkKeyLight.position.set(3, 3, 4);
    scene.add(pinkKeyLight);

    const violetRimLight = new THREE.PointLight(0xa855f7, 4.0 * intensity, 15);
    violetRimLight.position.set(-3.5, -2, -2);
    scene.add(violetRimLight);

    const topSpecularLight = new THREE.DirectionalLight(0xffffff, 1.2 * intensity);
    topSpecularLight.position.set(0, 5, 2);
    scene.add(topSpecularLight);

    // 3. Central Holographic Crystal Geometry (Icosahedron / Diamond lattice)
    const coreGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xec4899,
      emissive: 0x6b21a8,
      emissiveIntensity: 0.45 * intensity,
      roughness: 0.1,
      metalness: 0.15,
      transmission: 0.75, // Frosted glass transmission
      ior: 1.52,          // Realistic optical index
      transparent: true,
      opacity: 0.88,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // 4. Outer Crystalline Facet Shell (Wireframe overlay for holographic depth)
    const wireGeo = new THREE.IcosahedronGeometry(1.48, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xfbcfe8,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    // 5. Crystalline Orbital Rings (Gyroscopic 3D Rings)
    const ringGeo1 = new THREE.TorusGeometry(1.95, 0.022, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 3;
    scene.add(ringMesh1);

    const ringGeo2 = new THREE.TorusGeometry(2.18, 0.016, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.y = Math.PI / 4;
    scene.add(ringMesh2);

    // 6. Volumetric Star Dust / Floating Nano-Particles
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.0 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfbcfe8,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Pointer Interactivity (Parallax tilt)
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.75;
      targetRotX = -y * 0.75;
    };

    if (interactive) {
      window.addEventListener('pointermove', handlePointerMove);
    }

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // State-specific color & dynamic pulse
      const currentMode = modeRef.current;
      const rawAudio = audioLevelRef.current || 0;
      const audioPulse = THREE.MathUtils.clamp(rawAudio, 0, 1) * 0.45;

      let speedMult = 1.0;
      if (currentMode === 'listening') {
        speedMult = 1.5;
        coreMat.emissive.setHex(0x38bdf8); // Sky blue listening pulse
        coreMat.color.setHex(0x0284c7);
      } else if (currentMode === 'processing') {
        speedMult = 2.4;
        coreMat.emissive.setHex(0xa855f7); // Violet thinking
        coreMat.color.setHex(0x7e22ce);
      } else if (currentMode === 'responding') {
        speedMult = 1.8;
        coreMat.emissive.setHex(0xf472b6); // Dream pink responding
        coreMat.color.setHex(0xec4899);
      } else if (currentMode === 'success') {
        coreMat.emissive.setHex(0x10b981); // Emerald success
      } else if (currentMode === 'failure') {
        coreMat.emissive.setHex(0xef4444); // Amber/red error
      } else {
        // Idle Dream Pink & Violet
        coreMat.emissive.setHex(0x6b21a8);
        coreMat.color.setHex(0xec4899);
      }

      if (!prefersReducedMotion) {
        // Core rotation
        coreMesh.rotation.y += delta * 0.6 * speedMult;
        coreMesh.rotation.x += delta * 0.3 * speedMult;

        wireMesh.rotation.y -= delta * 0.4 * speedMult;
        wireMesh.rotation.z += delta * 0.25 * speedMult;

        // Orbital rings gyroscopic rotation
        ringMesh1.rotation.z += delta * 0.8 * speedMult;
        ringMesh1.rotation.x = Math.PI / 3 + Math.sin(time * 1.2) * 0.15;

        ringMesh2.rotation.z -= delta * 0.7 * speedMult;
        ringMesh2.rotation.y = Math.PI / 4 + Math.cos(time * 0.9) * 0.15;

        // Particles floating
        particles.rotation.y += delta * 0.15;

        // Audio reactive scale & breathing
        const breathe = 1 + Math.sin(time * 2) * 0.03 + audioPulse;
        coreMesh.scale.set(breathe, breathe, breathe);
        wireMesh.scale.set(breathe * 1.05, breathe * 1.05, breathe * 1.05);

        // Smooth interactive parallax interpolation
        currentRotX += (targetRotX - currentRotX) * 0.08;
        currentRotY += (targetRotY - currentRotY) * 0.08;
        scene.rotation.x = currentRotX;
        scene.rotation.y = currentRotY;
      }

      renderer?.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (interactive) {
        window.removeEventListener('pointermove', handlePointerMove);
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
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
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  );
};
