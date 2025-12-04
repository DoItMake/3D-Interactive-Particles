import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Particles from './Particles';
import { InteractionState } from '../types';
import { CAMERA_POSITION } from '../constants';

interface SceneProps {
  interaction: InteractionState;
}

const Scene: React.FC<SceneProps> = ({ interaction }) => {
  return (
    <Canvas camera={{ position: [...CAMERA_POSITION], fov: 60 }} dpr={[1, 2]}>
      <color attach="background" args={['#050505']} />
      
      {/* Ambient environment */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00f2ff" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#ff0055" />

      {/* The Particle System */}
      <Particles interaction={interaction} />
      
      {/* Optional fallback controls if hand is lost, though hand is primary */}
      {/* <OrbitControls enableZoom={false} enablePan={false} autoRotate={!interaction.handPresent} autoRotateSpeed={0.5} /> */}
    </Canvas>
  );
};

export default Scene;
