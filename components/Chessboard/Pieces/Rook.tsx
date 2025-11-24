/**
 * Rook piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial } from './BasePiece';

export function Rook({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  const baseGeometry = useMemo(() => new THREE.CylinderGeometry(0.15, 0.18, 0.3, 8, 1, false), []);
  const topGeometry = useMemo(() => new THREE.BoxGeometry(0.2, 0.15, 0.2), []);
  const cornerGeometry = useMemo(() => new THREE.BoxGeometry(0.06, 0.08, 0.06), []);
  // Bottom cap to ensure piece is fully solid
  const bottomCapGeometry = useMemo(() => new THREE.CircleGeometry(0.15, 8), []);

  return (
    <group ref={groupRef} position={position} userData={{ square, pieceType: 'rook', color }} renderOrder={2}>
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
      {/* Top platform */}
      <mesh
        geometry={topGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.375, 0]}
      />
      {/* Corner towers */}
      {[
        [-0.07, 0.42, -0.07],
        [0.07, 0.42, -0.07],
        [-0.07, 0.42, 0.07],
        [0.07, 0.42, 0.07],
      ].map((pos, i) => (
        <mesh
          key={i}
          geometry={cornerGeometry}
          material={material}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          position={pos}
        />
      ))}
    </group>
  );
}

