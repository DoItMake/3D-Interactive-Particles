import React, { useState, useCallback } from 'react';
import Scene from './components/Scene';
import HandController from './components/HandController';
import HUD from './components/HUD';
import { InteractionState, GestureMode } from './types';

const App: React.FC = () => {
  // Central State
  const [interactionState, setInteractionState] = useState<InteractionState>({
    mode: GestureMode.IDLE,
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    isFist: false,
    handPresent: false,
    colorBurstTrigger: 0
  });

  const handleUpdate = useCallback((newState: InteractionState) => {
    // We update state here to trigger React renders for UI
    // The Particle system receives this state via props. 
    // Optimization: In a super heavy app, we might use a ref/store (Zustand) to avoid re-rendering App 
    // every frame, but for this structure, React's diffing is fast enough for the HUD updates.
    setInteractionState(prev => ({
        ...newState,
        // Preserve some derived state if needed, or just overwrite
    }));
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden selection:bg-cyan-500/30">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene interaction={interactionState} />
      </div>

      {/* UI Overlay Layer */}
      <HUD state={interactionState} />

      {/* Logic Layer (Invisible/Small) */}
      <HandController onUpdate={handleUpdate} debug={true} />
      
    </div>
  );
};

export default App;
