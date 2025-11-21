/**
 * Pawn piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial } from './BasePiece';

export function Pawn({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  const baseGeometry = useMemo(() => new THREE.CylinderGeometry(0.12, 0.16, 0.25, 8), []);
  const bodyGeometry = useMemo(() => new THREE.SphereGeometry(0.1, 8, 8), []);
  const headGeometry = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);

  return (
    <group ref={groupRef} position={position} userData={{ square, pieceType: 'pawn', color }}>
      {/* Base */}
      <mesh
        geometry={baseGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.125, 0]}
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

