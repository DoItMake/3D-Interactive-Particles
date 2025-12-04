import React from 'react';
import { GestureMode, InteractionState } from '../types';
import { MousePointer2, Move3d, Maximize2, RotateCw } from 'lucide-react';
import clsx from 'clsx';

interface HUDProps {
  state: InteractionState;
}

const ModeIndicator = ({ active, label, icon: Icon, description }: { active: boolean, label: string, icon: any, description: string }) => (
  <div className={clsx(
    "flex items-center gap-3 p-3 rounded-lg border backdrop-blur-md transition-all duration-300",
    active 
      ? "bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105" 
      : "bg-black/40 border-white/10 text-gray-400 scale-100"
  )}>
    <div className={clsx("p-2 rounded-md", active ? "bg-cyan-500/20" : "bg-white/5")}>
      <Icon size={20} className={active ? "text-cyan-300" : "text-gray-500"} />
    </div>
    <div>
      <div className="text-xs font-bold tracking-wider uppercase">{label}</div>
      <div className="text-[10px] opacity-70 font-mono">{description}</div>
    </div>
  </div>
);

const HUD: React.FC<HUDProps> = ({ state }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tighter flex items-center gap-2">
            <span className="w-2 h-6 bg-cyan-500 block"></span>
            NEBULA<span className="font-light text-cyan-400">CONTROL</span>
          </h1>
          <p className="text-xs text-cyan-500/60 font-mono mt-1 ml-4 tracking-widest">SYSTEM ONLINE // v1.0.4</p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={clsx("w-2 h-2 rounded-full animate-pulse", state.handPresent ? "bg-green-500" : "bg-red-500")}></div>
          <span className="text-xs font-mono text-white/50">{state.handPresent ? "SIGNAL LOCKED" : "SEARCHING..."}</span>
        </div>
      </div>

      {/* Crosshair Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full flex items-center justify-center opacity-20">
         <div className="w-1 h-1 bg-white rounded-full"></div>
      </div>

      {/* Mode Selectors (Left Side) */}
      <div className="absolute top-1/3 left-6 flex flex-col gap-4">
        <ModeIndicator 
          active={state.mode === GestureMode.SCALE} 
          label="缩放模式 (SCALE)" 
          icon={Maximize2}
          description="五指张开 / 握拳"
        />
        <ModeIndicator 
          active={state.mode === GestureMode.ROTATE_XY} 
          label="视角旋转 (VIEW)" 
          icon={Move3d}
          description="食指控制 XY 轴"
        />
        <ModeIndicator 
          active={state.mode === GestureMode.ROTATE_Z} 
          label="平面翻转 (FLIP)" 
          icon={RotateCw}
          description="双指旋转 Z 轴"
        />
      </div>

      {/* Dynamic Data (Bottom) */}
      <div className="flex justify-between items-end border-t border-white/10 pt-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex gap-8 font-mono text-xs text-white/60">
           <div>
             <span className="text-cyan-500">ROT.X:</span> {state.rotation.x.toFixed(2)}
           </div>
           <div>
             <span className="text-cyan-500">ROT.Y:</span> {state.rotation.y.toFixed(2)}
           </div>
           <div>
             <span className="text-cyan-500">ROT.Z:</span> {state.rotation.z.toFixed(2)}
           </div>
           <div>
             <span className="text-pink-500">SCALE:</span> {state.scale.toFixed(2)}
           </div>
        </div>
        
        <div className="text-right">
             <div className="text-[10px] text-white/30 mb-1">GESTURE ENGINE</div>
             <div className={clsx("text-lg font-bold", state.handPresent ? "text-white" : "text-red-500")}>
                {state.handPresent ? state.mode : "NO INPUT"}
             </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;