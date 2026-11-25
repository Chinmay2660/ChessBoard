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

/** Models are ~0.4 units tall; scale so they read well on 1-unit squares */
export const PIECE_SCALE = 1.7;

// Shared caches: all 16 pieces of a colour reuse one material, and every piece
// of a type reuses the same geometries (instead of allocating per instance).
const materialCache = new Map<PieceColor, THREE.MeshStandardMaterial>();
const geometryCache = new Map<string, THREE.BufferGeometry>();

export function cachedGeometry<T extends THREE.BufferGeometry>(key: string, factory: () => T): T {
  let g = geometryCache.get(key);
  if (!g) {
    g = factory();
    geometryCache.set(key, g);
  }
  return g as T;
}

export function usePieceMaterial(color: PieceColor) {
  return useMemo(() => {
    let m = materialCache.get(color);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color: color === 'white' ? 0xf4efe4 : 0x2e2a28,
        metalness: 0.05,
        roughness: 0.45,
      });
      materialCache.set(color, m);
    }
    return m;
  }, [color]);
}
