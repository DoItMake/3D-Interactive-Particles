import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { InteractionState, GestureMode } from '../types';
import { MAX_PARTICLES, COLORS, LERP_FACTOR } from '../constants';

interface ParticlesProps {
  interaction: InteractionState;
}

const Particles: React.FC<ParticlesProps> = ({ interaction }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const geomRef = useRef<THREE.BufferGeometry>(null);
  
  // Create particle data
  const { positions, colors, initialPositions } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const initialPositions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    
    const color1 = new THREE.Color(COLORS.primary);
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      // Sphere distribution
      const r = 5 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;
      
      colors[i * 3] = color1.r;
      colors[i * 3 + 1] = color1.g;
      colors[i * 3 + 2] = color1.b;
    }
    
    return { positions, colors, initialPositions };
  }, []);

  // Track previous burst count to detect changes
  const prevBurstRef = useRef(0);
  const timeRef = useRef(0);

  // Animation Loop
  useFrame((state, delta) => {
    if (!pointsRef.current || !geomRef.current) return;
    
    timeRef.current += delta;
    const positionsAttribute = geomRef.current.attributes.position;
    const colorsAttribute = geomRef.current.attributes.color;
    
    // --- 1. Handle Rotations ---
    // We smooth rotation using the interaction state directly (which is already smoothed or incremental)
    // Actually, interaction state rotation accumulates. We simply apply it.
    // However, for smoother visual, let's lerp the mesh rotation to the state rotation
    // Note: state.rotation is cumulative Euler angles.
    
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, interaction.rotation.x, 0.1);
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, interaction.rotation.y, 0.1);
    pointsRef.current.rotation.z = THREE.MathUtils.lerp(pointsRef.current.rotation.z, interaction.rotation.z, 0.1);

    // --- 2. Handle Scale (Expansion/Contraction) ---
    // Interaction.scale moves between ~0.2 (fist) and ~2.5 (open)
    const currentScale = interaction.scale;

    // --- 3. Handle Color Burst ---
    if (interaction.colorBurstTrigger > prevBurstRef.current) {
        // Trigger Burst: Randomize colors towards secondary
        const targetColor = new THREE.Color(Math.random() > 0.5 ? COLORS.secondary : COLORS.warning);
        const baseColor = new THREE.Color(COLORS.primary);
        
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const mix = Math.random();
            colorsAttribute.setXYZ(
                i, 
                baseColor.r * (1-mix) + targetColor.r * mix,
                baseColor.g * (1-mix) + targetColor.g * mix,
                baseColor.b * (1-mix) + targetColor.b * mix
            );
        }
        colorsAttribute.needsUpdate = true;
        prevBurstRef.current = interaction.colorBurstTrigger;
    }

    // --- 4. Particle Movement Logic ---
    for (let i = 0; i < MAX_PARTICLES; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        const originalX = initialPositions[ix];
        const originalY = initialPositions[iy];
        const originalZ = initialPositions[iz];

        // Apply breathing/scaling effect based on interaction.scale
        // We modulate the radius from center
        
        // Add some noise movement
        const noiseScale = 0.5;
        const noiseX = Math.sin(timeRef.current * 0.5 + originalY * noiseScale) * 0.1;
        const noiseY = Math.cos(timeRef.current * 0.3 + originalX * noiseScale) * 0.1;
        const noiseZ = Math.sin(timeRef.current * 0.4 + originalZ * noiseScale) * 0.1;

        let targetX = originalX * currentScale + noiseX;
        let targetY = originalY * currentScale + noiseY;
        let targetZ = originalZ * currentScale + noiseZ;

        // If in Fist mode, add strong gravitational pull to center + jitter
        if (interaction.isFist && interaction.mode === GestureMode.SCALE) {
             const jitter = 0.2;
             targetX += (Math.random() - 0.5) * jitter;
             targetY += (Math.random() - 0.5) * jitter;
             targetZ += (Math.random() - 0.5) * jitter;
        }

        // Direct update (soft lerp handled by variable `currentScale` in HandController, 
        // but we add per-particle lag for organic feel)
        
        const lerp = 0.1 + (Math.random() * 0.05); // vary speed slightly
        
        positionsAttribute.setX(i, THREE.MathUtils.lerp(positionsAttribute.getX(i), targetX, lerp));
        positionsAttribute.setY(i, THREE.MathUtils.lerp(positionsAttribute.getY(i), targetY, lerp));
        positionsAttribute.setZ(i, THREE.MathUtils.lerp(positionsAttribute.getZ(i), targetZ, lerp));
    }
    
    positionsAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default Particles;
