/**
 * Knight piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial } from './BasePiece';

export function Knight({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  const baseGeometry = useMemo(() => new THREE.CylinderGeometry(0.12, 0.18, 0.25, 8), []);
  const bodyGeometry = useMemo(() => new THREE.BoxGeometry(0.15, 0.2, 0.12), []);
  const headGeometry = useMemo(() => new THREE.BoxGeometry(0.1, 0.15, 0.08), []);

  return (
    <group ref={groupRef} position={position} userData={{ square, pieceType: 'knight', color }}>
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

