import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { InteractionState, GestureMode } from '../types';
import { MAX_PARTICLES, COLORS, GIFT_COLORS } from '../constants';
import { Float, Sparkles } from '@react-three/drei';

interface ParticlesProps {
  interaction: InteractionState;
}

interface GiftData {
  id: number;
  position: THREE.Vector3;
  color: string;
  opened: boolean;
  scale: number;
  rotationSpeed: number;
  type: number; // 0: box, 1: cylinder, 2: cone
}

const ChristmasTree: React.FC<ParticlesProps> = ({ interaction }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const cursorRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const { camera, raycaster } = useThree();
  
  // -- Tree Particle Data --
  const { positions, colors, initialPositions } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const initialPositions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    
    const baseColor = new THREE.Color(COLORS.treeBase);
    const highlightColor = new THREE.Color(COLORS.treeHighlight);
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      // Cone Distribution
      // h: height (0 to 10)
      // r: radius at height h. Cone formula r = (1 - h/H) * R_base
      const height = Math.random() * 12; // Tree height 12
      const relativeHeight = height / 12;
      const maxRadius = (1 - relativeHeight) * 5; // Base radius 5
      
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * maxRadius;
      
      // Add some noise to make it fluffy
      const x = radius * Math.cos(angle);
      const y = height - 6; // Center vertically around 0
      const z = radius * Math.sin(angle);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;
      
      // Color logic: mostly green, some lights
      const isLight = Math.random() > 0.95;
      let c = baseColor.clone().lerp(highlightColor, Math.random() * 0.5);
      
      if (isLight) {
        c = new THREE.Color(COLORS.lights[Math.floor(Math.random() * COLORS.lights.length)]);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    
    return { positions, colors, initialPositions };
  }, []);

  // -- Gift Data --
  const [gifts, setGifts] = useState<GiftData[]>([]);

  // Initialize Gifts Once
  useMemo(() => {
    const newGifts: GiftData[] = [];
    for (let i = 0; i < 15; i++) {
        const height = Math.random() * 8; // Gifts mostly on lower/mid branches
        const relativeHeight = height / 12;
        const radius = (1 - relativeHeight) * 4.5; // Slightly inside the edge
        const angle = Math.random() * Math.PI * 2;
        
        const x = radius * Math.cos(angle);
        const y = height - 5.5;
        const z = radius * Math.sin(angle);

        newGifts.push({
            id: i,
            position: new THREE.Vector3(x, y, z),
            color: GIFT_COLORS[Math.floor(Math.random() * GIFT_COLORS.length)],
            opened: false,
            scale: 0, // Start hidden, animate in
            rotationSpeed: (Math.random() - 0.5) * 2,
            type: Math.floor(Math.random() * 3)
        });
    }
    setGifts(newGifts);
  }, []);

  // Animate Gifts Appearance
  useEffect(() => {
     const t = setTimeout(() => {
         setGifts(prev => prev.map(g => ({ ...g, scale: 1 })));
     }, 1000);
     return () => clearTimeout(t);
  }, []);

  // -- Interaction Logic --
  const [hoveredGiftId, setHoveredGiftId] = useState<number | null>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    // 1. Group Rotation (User Control)
    if (groupRef.current) {
        // Apply smooth rotation based on interaction state
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, interaction.rotation.x, 0.1);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, interaction.rotation.y, 0.1);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, interaction.rotation.z, 0.1);
    }

    // 2. Cursor Logic (Raycasting)
    if (cursorRef.current && groupRef.current) {
        // Map normalized cursor (-1 to 1) to world camera plane roughly or use unproject
        const cursor = interaction.cursor || { x: 0, y: 0 };
        const vec = new THREE.Vector3(cursor.x, cursor.y, 0.5);
        vec.unproject(camera);
        const dir = vec.sub(camera.position).normalize();
        const distance = 15; // Arbitrary distance from camera
        const targetPos = camera.position.clone().add(dir.multiplyScalar(distance));
        
        cursorRef.current.position.lerp(targetPos, 0.2);
        cursorRef.current.lookAt(camera.position);

        // Raycasting against gifts
        let foundHover = null;
        
        // Only allow picking in Scale (Cursor) mode
        if (interaction.mode === GestureMode.SCALE) {
             for (const gift of gifts) {
                if (gift.opened) continue;

                // Simple World Position Calculation for the gift
                // We must apply the group rotation to the gift's local position
                const giftWorldPos = gift.position.clone();
                giftWorldPos.applyEuler(groupRef.current.rotation);
                // Assume group is at 0,0,0
                
                const dist = giftWorldPos.distanceTo(cursorRef.current.position);
                if (dist < 1.2) { // Hit radius
                    foundHover = gift.id;
                    break;
                }
            }
        }
        setHoveredGiftId(foundHover);
        
        // Trigger Open
        if (foundHover !== null && interaction.isFist) {
             setGifts(prev => prev.map(g => {
                 if (g.id === foundHover && !g.opened) {
                     return { ...g, opened: true };
                 }
                 return g;
             }));
        }
    }

    // 3. Particle Animation (Twinkle)
    if (geomRef.current) {
        const colorsAttr = geomRef.current.attributes.color;
        // Blink lights
        for(let i=0; i<MAX_PARTICLES; i++) {
           // simple probability check to save perf, usually done in shader
           if (Math.random() > 0.999) {
               // Only blink non-green particles ideally, but random is okay for sparkly effect
           }
        }
        geomRef.current.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <group ref={groupRef}>
        {/* The Tree Particles */}
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
            size={0.12}
            vertexColors
            transparent
            opacity={0.9}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* The Gifts */}
        {gifts.map(gift => !gift.opened ? (
            <Float key={gift.id} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh 
                    position={gift.position} 
                    scale={hoveredGiftId === gift.id ? 1.2 : 1.0}
                    onClick={(e) => { e.stopPropagation(); }} // Block generic clicks
                >
                    <boxGeometry args={[0.8, 0.8, 0.8]} />
                    <meshStandardMaterial 
                        color={gift.color} 
                        emissive={hoveredGiftId === gift.id ? '#555' : '#000'}
                        roughness={0.3}
                        metalness={0.6}
                    />
                    {/* Ribbon */}
                    <mesh position={[0, 0, 0]}>
                       <boxGeometry args={[0.85, 0.85, 0.2]} />
                       <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <mesh position={[0, 0, 0]}>
                       <boxGeometry args={[0.2, 0.85, 0.85]} />
                       <meshBasicMaterial color="#ffffff" />
                    </mesh>
                </mesh>
            </Float>
        ) : (
            // Opened Surprise (Simple Particles/Shape)
            <group key={gift.id} position={gift.position}>
                 <Sparkles count={20} scale={3} size={2} speed={0.4} opacity={1} color={gift.color} />
                 <Float speed={5} rotationIntensity={2} floatIntensity={1}>
                    <mesh>
                        {gift.type === 0 && <torusKnotGeometry args={[0.4, 0.15, 64, 8]} />}
                        {gift.type === 1 && <icosahedronGeometry args={[0.5]} />}
                        {gift.type === 2 && <octahedronGeometry args={[0.5]} />}
                        <meshStandardMaterial color={gift.color} emissive={gift.color} emissiveIntensity={2} />
                    </mesh>
                 </Float>
            </group>
        ))}

        {/* Top Star */}
        <mesh position={[0, 6.5, 0]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={COLORS.star} />
            <Sparkles count={10} scale={2} size={5} speed={0.2} opacity={0.7} color="#ffff00" />
        </mesh>

      </group>

      {/* 3D Cursor */}
      <mesh ref={cursorRef} visible={interaction.mode === GestureMode.SCALE}>
          <ringGeometry args={[0.15, 0.2, 32]} />
          <meshBasicMaterial color={interaction.isFist ? "#ff0000" : "#00ffff"} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
    </>
  );
};

export default ChristmasTree;