/**
 * Base piece component with shared functionality
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PieceColor } from '@/utils/chess/fen';

export interface BasePieceProps {
  color: PieceColor;
  position: [number, number, number];
  square: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function usePieceMaterial(color: PieceColor) {
  return useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: color === 'white' ? 0xffffff : 0x2a2a2a, // Lighter black for better visibility
      metalness: 0.3,
      roughness: 0.7,
      emissive: color === 'black' ? 0x111111 : 0x000000, // Slight emissive for black pieces
      emissiveIntensity: color === 'black' ? 0.1 : 0,
      transparent: false, // Fully opaque
      opacity: 1.0,
      side: THREE.DoubleSide, // Visible from both sides but opaque
      depthWrite: true, // Write to depth buffer
      depthTest: true, // Test depth - pieces behind board will be occluded
    });
    return material;
  }, [color]);
}

