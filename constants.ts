export const LERP_FACTOR = 0.1;
export const ROTATION_SPEED = 3.5;
export const Z_ROTATION_SENSITIVITY = 1.0;
export const MAX_PARTICLES = 8000; // Slightly reduced for performance with extra meshes

// Camera constraints
export const CAMERA_POSITION = [0, 0, 18] as const;

// Colors
export const COLORS = {
  treeBase: '#0f5c28',   // Dark Green
  treeHighlight: '#4ade80', // Light Green
  lights: ['#ef4444', '#eab308', '#3b82f6', '#ffffff'], // Red, Gold, Blue, White
  star: '#fbbf24',       // Gold
  background: '#020617'  // Night Blue/Black
};

export const GIFT_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#eab308', // Gold
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];