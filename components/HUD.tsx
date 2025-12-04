import React from 'react';
import { GestureMode, InteractionState } from '../types';
import { MousePointer2, Move3d, Gift, RotateCw } from 'lucide-react';
import clsx from 'clsx';

interface HUDProps {
  state: InteractionState;
}

const ModeIndicator = ({ active, label, icon: Icon, description }: { active: boolean, label: string, icon: any, description: string }) => (
  <div className={clsx(
    "flex items-center gap-3 p-3 rounded-lg border backdrop-blur-md transition-all duration-300",
    active 
      ? "bg-green-500/20 border-green-400 text-green-100 shadow-[0_0_15px_rgba(74,222,128,0.3)] scale-105" 
      : "bg-black/40 border-white/10 text-gray-400 scale-100"
  )}>
    <div className={clsx("p-2 rounded-md", active ? "bg-green-500/20" : "bg-white/5")}>
      <Icon size={20} className={active ? "text-green-300" : "text-gray-500"} />
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
            <span className="w-2 h-6 bg-red-500 block"></span>
            MERRY<span className="font-light text-green-400">XMAS</span>
          </h1>
          <p className="text-xs text-green-500/60 font-mono mt-1 ml-4 tracking-widest">HOLIDAY MODE // v2.0</p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={clsx("w-2 h-2 rounded-full animate-pulse", state.handPresent ? "bg-green-500" : "bg-red-500")}></div>
          <span className="text-xs font-mono text-white/50">{state.handPresent ? "SIGNAL LOCKED" : "SEARCHING..."}</span>
        </div>
      </div>

      {/* Mode Selectors (Left Side) */}
      <div className="absolute top-1/3 left-6 flex flex-col gap-4">
        <ModeIndicator 
          active={state.mode === GestureMode.SCALE && !state.isFist} 
          label="选择礼物 (SELECT)" 
          icon={MousePointer2}
          description="五指张开移动光标"
        />
        <ModeIndicator 
          active={state.mode === GestureMode.SCALE && state.isFist} 
          label="打开礼物 (OPEN)" 
          icon={Gift}
          description="握拳打开选中礼物"
        />
        <ModeIndicator 
          active={state.mode === GestureMode.ROTATE_XY} 
          label="旋转视角 (VIEW)" 
          icon={Move3d}
          description="食指控制 XY 轴"
        />
      </div>

      {/* Instructions (Center Bottom) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
         <div className="text-white/80 text-sm font-medium bg-black/50 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
            {state.mode === GestureMode.SCALE 
              ? (state.isFist ? "Opening..." : "Hover over a gift and make a FIST to open!")
              : "Use open hand to select gifts"}
         </div>
      </div>

      {/* Dynamic Data (Bottom Right) */}
      <div className="flex justify-end items-end border-t border-white/10 pt-4 bg-gradient-to-t from-black/80 to-transparent">
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