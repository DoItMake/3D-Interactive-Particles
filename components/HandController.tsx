import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { GestureMode, InteractionState } from '../types';
import { LERP_FACTOR, ROTATION_SPEED, Z_ROTATION_SENSITIVITY } from '../constants';

interface HandControllerProps {
  onUpdate: (state: InteractionState) => void;
  debug?: boolean;
}

const HandController: React.FC<HandControllerProps> = ({ onUpdate, debug = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  
  // Internal state refs to avoid re-renders on high-frequency updates
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const previousAngleRef = useRef<number | null>(null);
  const previousTipRef = useRef<{x: number, y: number} | null>(null);
  
  // State Machine Locking Refs
  const modeFrameCountRef = useRef<number>(0);
  const pendingModeRef = useRef<GestureMode>(GestureMode.IDLE);
  const MODE_LOCK_THRESHOLD = 4; // Frames required to switch mode

  // The cumulative state maintained between frames
  const stateRef = useRef<InteractionState>({
    mode: GestureMode.IDLE,
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    isFist: false,
    handPresent: false,
    colorBurstTrigger: 0
  });

  const setupMediaPipe = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      
      setLoading(false);
      startVideo();
    } catch (error) {
      console.error("Error initializing MediaPipe:", error);
    }
  };

  const startVideo = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }
      } catch (err) {
        console.error(err);
        setPermissionError(true);
      }
    }
  };

  // Helper: Calculate angle between two points (for Z rotation)
  const calculateAngle = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  };

  // Helper: Detect extended fingers
  // Returns array of booleans [Thumb, Index, Middle, Ring, Pinky]
  const getExtendedFingers = (landmarks: any[]) => {
    const tips = [4, 8, 12, 16, 20];
    const dips = [3, 7, 11, 15, 19]; // PIP/DIP joints
    
    // Robust check: Compare tip distance to wrist vs PIP distance to wrist
    const wrist = landmarks[0];
    const result = [];
    
    for (let i = 0; i < 5; i++) {
      const tip = landmarks[tips[i]];
      const pip = landmarks[dips[i] - 1]; // MCP/PIP joint
      
      const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const pipDist = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
      
      // Finger is extended if tip is further from wrist than PIP
      // Using a slightly stricter multiplier to avoid false positives
      result.push(tipDist > pipDist * 1.2); 
    }
    return result;
  };

  const predictWebcam = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = handLandmarkerRef.current;

    if (!video || !canvas || !landmarker) return;

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      if (debug) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      let startTimeMs = performance.now();
      const results = landmarker.detectForVideo(video, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const fingers = getExtendedFingers(landmarks);
        
        const indexExtended = fingers[1];
        const middleExtended = fingers[2];
        const ringExtended = fingers[3];
        const pinkyExtended = fingers[4];
        
        const extendedCount = fingers.filter(f => f).length;
        
        // --- 1. Raw Mode Detection ---
        let detectedMode = GestureMode.IDLE;
        
        // Scale Mode: 5 fingers open OR Fist (0 fingers)
        if (extendedCount === 5 || extendedCount === 0) {
          detectedMode = GestureMode.SCALE;
        } 
        // Rotate Z (Plane Flip): Index + Middle (V-Sign)
        // Strict check: Index & Middle extended, others curled
        else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
          detectedMode = GestureMode.ROTATE_Z; 
        } 
        // Rotate XY (View Rotation): Index Only
        // Strict check: Index extended, others curled
        else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
          detectedMode = GestureMode.ROTATE_XY; 
        }

        // --- 2. State Machine Locking ---
        if (detectedMode !== stateRef.current.mode) {
           if (detectedMode === pendingModeRef.current) {
             modeFrameCountRef.current++;
             if (modeFrameCountRef.current > MODE_LOCK_THRESHOLD) {
                // Confirm Mode Switch
                stateRef.current.mode = detectedMode;
                modeFrameCountRef.current = 0;
                
                // Reset interaction cursors
                previousAngleRef.current = null;
                previousTipRef.current = null;
             }
           } else {
             // New potential mode detected
             pendingModeRef.current = detectedMode;
             modeFrameCountRef.current = 0;
           }
        } else {
           // Mode confirmed/stable
           modeFrameCountRef.current = 0;
           pendingModeRef.current = detectedMode;
        }

        stateRef.current.handPresent = true;

        // --- 3. Interaction Logic per Active Mode ---
        const currentMode = stateRef.current.mode;

        if (currentMode === GestureMode.SCALE) {
          // Inside SCALE mode, distinguish Open vs Fist instantly
          // 0 fingers = Fist (Contract), >2 fingers = Open (Expand) roughly
          const isFist = extendedCount <= 1; // Tolerance for thumb
          
          if (stateRef.current.isFist && !isFist) {
             stateRef.current.colorBurstTrigger += 1; // Fist -> Open trigger
          }
          
          stateRef.current.isFist = isFist;
          const targetScale = isFist ? 0.2 : 2.5;
          stateRef.current.scale += (targetScale - stateRef.current.scale) * LERP_FACTOR;
        } 
        else if (currentMode === GestureMode.ROTATE_XY) {
          const tip = landmarks[8]; // Index tip
          
          if (previousTipRef.current) {
            const dx = tip.x - previousTipRef.current.x;
            const dy = tip.y - previousTipRef.current.y;
            
            // Camera Coordinate System Control
            // Drag Right (dx > 0) -> Rotate around Y (yaw right)
            // Drag Down (dy > 0) -> Rotate around X (pitch down)
            stateRef.current.rotation.y += dx * ROTATION_SPEED; 
            stateRef.current.rotation.x += dy * ROTATION_SPEED;
          }
          previousTipRef.current = { x: tip.x, y: tip.y };
        } 
        else if (currentMode === GestureMode.ROTATE_Z) {
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          
          const angle = calculateAngle(indexTip, middleTip);
          
          if (previousAngleRef.current !== null) {
            let delta = angle - previousAngleRef.current;
            // Normalize angle jump
            if (delta > Math.PI) delta -= Math.PI * 2;
            if (delta < -Math.PI) delta += Math.PI * 2;
            
            // 1:1 Tracking for Z Rotation
            // Clockwise finger rotation increases angle in screen coords (y down)
            // ThreeJS rotation Z is CCW positive.
            // So we subtract delta to map.
            stateRef.current.rotation.z -= delta * Z_ROTATION_SENSITIVITY;
          }
          previousAngleRef.current = angle;
        }

        if (debug && canvasRef.current) {
            const drawingUtils = new DrawingUtils(canvasRef.current.getContext("2d")!);
            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {color: "#00FF00", lineWidth: 2});
            drawingUtils.drawLandmarks(landmarks, {color: "#FF0000", lineWidth: 1});
        }

      } else {
        stateRef.current.handPresent = false;
        previousAngleRef.current = null;
        previousTipRef.current = null;
        modeFrameCountRef.current = 0;
      }

      onUpdate({ ...stateRef.current });
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [debug, onUpdate]);

  useEffect(() => {
    setupMediaPipe();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className={`absolute bottom-4 right-4 z-50 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}>
       <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-white/20 bg-black/50 shadow-lg">
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
            autoPlay 
            playsInline 
            muted 
          />
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
          />
          {!stateRef.current.handPresent && !loading && (
             <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400 font-mono bg-black/60">
                NO HAND
             </div>
          )}
       </div>
       {permissionError && <div className="text-red-500 text-xs mt-1 bg-black p-1">Cam Blocked</div>}
       {loading && <div className="text-cyan-400 text-xs mt-1 animate-pulse">Initializing AI...</div>}
    </div>
  );
};

export default HandController;