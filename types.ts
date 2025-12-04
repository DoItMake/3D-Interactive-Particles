export enum GestureMode {
  IDLE = 'IDLE',
  SCALE = 'SCALE',         // 5 fingers open (Cursor) or Fist (Click)
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
  isFist: boolean; // True if fist (Action), False if open palm (Cursor)
  handPresent: boolean;
  colorBurstTrigger: number;
  cursor: { x: number; y: number }; // Normalized Screen Coordinates (-1 to 1)
}

export interface ParticleConfig {
  count: number;
  colorA: string;
  colorB: string;
}