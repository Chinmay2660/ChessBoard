/**
 * King piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial } from './BasePiece';

export function King({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  // Create low-poly king geometry
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8), []);
  const crownGeometry = useMemo(() => new THREE.ConeGeometry(0.12, 0.15, 8), []);
  const crossGeometry = useMemo(() => new THREE.BoxGeometry(0.05, 0.1, 0.05), []);

  return (
    <group ref={groupRef} position={position} userData={{ square, pieceType: 'king', color }}>
      {/* Base */}
      <mesh
        geometry={geometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.2, 0]}
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

