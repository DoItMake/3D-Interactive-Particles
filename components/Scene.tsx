import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import ChristmasTree from './Particles';
import { InteractionState } from '../types';
import { CAMERA_POSITION, COLORS } from '../constants';

interface SceneProps {
  interaction: InteractionState;
}

const Scene: React.FC<SceneProps> = ({ interaction }) => {
  return (
    <Canvas camera={{ position: [...CAMERA_POSITION], fov: 60 }} dpr={[1, 2]}>
      <color attach="background" args={[COLORS.background]} />
      
      {/* Ambient environment */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={500} scale={[20, 20, 20]} size={2} speed={0.3} opacity={0.5} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <spotLight position={[0, 20, 0]} angle={0.5} penumbra={1} intensity={1} color="#ffaa00" />
      <pointLight position={[-10, -5, 10]} intensity={0.5} color="#0000ff" />

      {/* The Christmas Tree System */}
      <ChristmasTree interaction={interaction} />
      
    </Canvas>
  );
};

export default Scene;