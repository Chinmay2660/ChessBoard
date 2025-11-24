/**
 * Pawn piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial } from './BasePiece';

export function Pawn({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  // Create closed cylinder geometry so bottom is not visible
  // CylinderGeometry is closed by default (openEnded: false)
  const baseGeometry = useMemo(() => new THREE.CylinderGeometry(0.12, 0.16, 0.25, 8, 1, false), []);
  const bodyGeometry = useMemo(() => new THREE.SphereGeometry(0.1, 8, 8), []);
  const headGeometry = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);
  // Bottom cap to ensure piece is fully solid
  const bottomCapGeometry = useMemo(() => new THREE.CircleGeometry(0.12, 8), []);

  return (
    <group ref={groupRef} position={position} userData={{ square, pieceType: 'pawn', color }} renderOrder={2}>
      {/* Bottom cap - only visible from top, occluded by board from bottom */}
      <mesh
        geometry={bottomCapGeometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]} // Slightly above board to ensure proper depth
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        renderOrder={2}
      />
      {/* Base - positioned so bottom touches board (y=0) */}
      <mesh
        geometry={baseGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.125, 0]} // Base height is 0.25, so center at 0.125
      />
      {/* Body */}
      <mesh
        geometry={bodyGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.3, 0]}
      />
      {/* Head */}
      <mesh
        geometry={headGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.42, 0]}
      />
    </group>
  );
}

