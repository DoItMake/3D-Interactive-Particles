export enum GestureMode {
  IDLE = 'IDLE',
  SCALE = 'SCALE',         // 5 fingers open or Fist
  ROTATE_XY = 'ROTATE_XY', // Index finger only
  ROTATE_Z = 'ROTATE_Z'    // Index + Middle (V sign)
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface InteractionState {
  mode: GestureMode;
  rotation: { x: number; y: number; z: number };
  scale: number;
  isFist: boolean; // True if fist, False if open palm (within SCALE mode)
  handPresent: boolean;
  colorBurstTrigger: number; // Increment to trigger burst
}

export interface ParticleConfig {
  count: number;
  colorA: string;
  colorB: string;
}