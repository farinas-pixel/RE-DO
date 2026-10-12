/**
 * CrystalBall — Small Selectable 3D Liquid Crystal Sphere Component
 *
 * Implemented for Scenario Universe, Quick Actions, and Multi-Ball environments:
 * - Independent real-time 3D WebGL liquid sphere rendering.
 * - Distinct 3D orbit, scale, and touch hit-detection.
 * - Meaningful navigation or action when tapped.
 * - Interactive hover & press feedback with visual selection aura.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface CrystalBallProps {
  id: string;
  label: string;
  size?: number;
  colorTop?: string;
  colorBottom?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

export const CrystalBall: React.FC<CrystalBallProps> = ({
  id,
  label,
  size = 76,
  colorTop = '#f472b6',
  colorBottom = '#a855f7',
  selected = false,
  onSelect,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selected);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.z = 3.6;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      container.innerHTML = `
        <div style="width:${size}px; height:${size}px; border-radius:50%; background:radial-gradient(circle, ${colorTop}, ${colorBottom});"></div>
      `;
      return;
    }

    const ambientLight = new THREE.AmbientLight(0x2d124d, 2.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(new THREE.Color(colorTop), 3.5, 10);
    pointLight.position.set(2, 2, 2.5);
    scene.add(pointLight);

    // Inner Liquid Volume
    const innerGeo = new THREE.SphereGeometry(0.85, 24, 24);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colorTop),
      emissive: new THREE.Color(colorBottom),
      emissiveIntensity: selected ? 0.8 : 0.4,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      thickness: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Outer Glass Shell
    const shellGeo = new THREE.SphereGeometry(1.05, 32, 32);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.05,
      transmission: 0.9,
      thickness: 1.0,
      ior: 1.5,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.85,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shellMesh);

    // Single delicate orbital ring
    const ringGeo = new THREE.TorusGeometry(1.35, 0.015, 12, 60);
    const ringMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorTop),
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    scene.add(ringMesh);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      shellMesh.rotation.y += delta * 0.6;
      innerMesh.rotation.y += delta * 0.45;
      ringMesh.rotation.z += delta * 0.8;

      const scale = selectedRef.current ? 1.08 + Math.sin(time * 3) * 0.04 : 1.0;
      shellMesh.scale.set(scale, scale, scale);
      innerMesh.scale.set(scale, scale, scale);

      renderer?.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      innerGeo.dispose();
      innerMat.dispose();
      shellGeo.dispose();
      shellMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    };
  }, [size, colorTop, colorBottom, selected]);

  return (
    <button
      type="button"
      className={`crystal-ball-item ${selected ? 'selected' : ''} ${className}`}
      onClick={() => onSelect?.(id)}
      title={label}
      aria-label={label}
    >
      <div ref={mountRef} className="crystal-ball-canvas-box" />
      <span className="crystal-ball-label">{label}</span>
    </button>
  );
};
