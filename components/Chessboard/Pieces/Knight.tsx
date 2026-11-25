/**
 * Knight piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial, PIECE_SCALE, cachedGeometry } from './BasePiece';

export function Knight({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  const baseGeometry = useMemo(() => cachedGeometry('Knight-baseGeometry', () => new THREE.CylinderGeometry(0.12, 0.18, 0.25, 8, 1, false)), []);
  const bodyGeometry = useMemo(() => cachedGeometry('Knight-bodyGeometry', () => new THREE.BoxGeometry(0.15, 0.2, 0.12)), []);
  const headGeometry = useMemo(() => cachedGeometry('Knight-headGeometry', () => new THREE.BoxGeometry(0.1, 0.15, 0.08)), []);
  // Bottom cap to ensure piece is fully solid
  const bottomCapGeometry = useMemo(() => cachedGeometry('Knight-bottomCapGeometry', () => new THREE.CircleGeometry(0.12, 8)), []);

  return (
    <group ref={groupRef} position={position} scale={PIECE_SCALE} userData={{ square, pieceType: 'knight', color }} renderOrder={2}>
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
        position={[0, 0.275, 0]}
      />
      {/* Head (tilted) */}
      <mesh
        geometry={headGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0.03, 0.4, 0]}
        rotation={[0, 0, -0.3]}
      />
    </group>
  );
}

