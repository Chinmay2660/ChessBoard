/**
 * King piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial } from './BasePiece';

export function King({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  // Create low-poly king geometry - ensure it's closed
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8, 1, false), []);
  const crownGeometry = useMemo(() => new THREE.ConeGeometry(0.12, 0.15, 8), []);
  const crossGeometry = useMemo(() => new THREE.BoxGeometry(0.05, 0.1, 0.05), []);
  // Bottom cap to ensure piece is fully solid
  const bottomCapGeometry = useMemo(() => new THREE.CircleGeometry(0.15, 8), []);

  return (
    <group ref={groupRef} position={position} userData={{ square, pieceType: 'king', color }} renderOrder={2}>
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
        geometry={geometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.2, 0]} // Base height is 0.4, so center at 0.2
      />
      {/* Crown */}
      <mesh
        geometry={crownGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.475, 0]}
      />
      {/* Cross */}
      <mesh
        geometry={crossGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.55, 0]}
      />
    </group>
  );
}

