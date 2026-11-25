/**
 * Bishop piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial, PIECE_SCALE, cachedGeometry } from './BasePiece';

export function Bishop({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  const baseGeometry = useMemo(() => cachedGeometry('Bishop-baseGeometry', () => new THREE.CylinderGeometry(0.12, 0.18, 0.3, 8, 1, false)), []);
  const bodyGeometry = useMemo(() => cachedGeometry('Bishop-bodyGeometry', () => new THREE.ConeGeometry(0.1, 0.25, 8)), []);
  const headGeometry = useMemo(() => cachedGeometry('Bishop-headGeometry', () => new THREE.SphereGeometry(0.08, 8, 8)), []);
  const cutGeometry = useMemo(() => cachedGeometry('Bishop-cutGeometry', () => new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8)), []);
  // Bottom cap to ensure piece is fully solid
  const bottomCapGeometry = useMemo(() => cachedGeometry('Bishop-bottomCapGeometry', () => new THREE.CircleGeometry(0.12, 8)), []);

  return (
    <group ref={groupRef} position={position} scale={PIECE_SCALE} userData={{ square, pieceType: 'bishop', color }} renderOrder={2}>
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
        position={[0, 0.15, 0]} // Base height is 0.3, so center at 0.15
      />
      {/* Body */}
      <mesh
        geometry={bodyGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.35, 0]}
      />
      {/* Head */}
      <mesh
        geometry={headGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.5, 0]}
      />
      {/* Cut in head */}
      <mesh
        geometry={cutGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.48, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

