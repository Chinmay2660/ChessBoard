/**
 * Camera controls component using OrbitControls from drei
 */

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export interface CameraControlsProps {
  boardSize?: number;
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
  onReset?: () => void;
}

export function CameraControls({
  boardSize = 8,
  enableRotate = true,
  enableZoom = true,
  enablePan = true,
  minDistance = boardSize * 0.5,
  maxDistance = boardSize * 3,
  onReset,
}: CameraControlsProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Reset camera position
  useEffect(() => {
    if (onReset && controlsRef.current) {
      const reset = () => {
        camera.position.set(boardSize / 2, boardSize * 1.1, boardSize * 1.55);
        camera.lookAt(boardSize / 2, 0, boardSize / 2);
        controlsRef.current?.reset();
      };
      // Expose reset function
      if (controlsRef.current) {
        controlsRef.current.resetView = reset;
      }
    }
  }, [camera, boardSize, onReset]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableRotate={enableRotate}
      enableZoom={enableZoom}
      enablePan={enablePan}
      maxPolarAngle={Math.PI / 2.2}
      minPolarAngle={0.2}
      enableDamping
      minDistance={minDistance}
      maxDistance={maxDistance}
      target={[boardSize / 2, 0, boardSize / 2]}
      makeDefault
    />
  );
}

