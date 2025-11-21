/**
 * Bishop piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial } from './BasePiece';

export function Bishop({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  const baseGeometry = useMemo(() => new THREE.CylinderGeometry(0.12, 0.18, 0.3, 8), []);
  const bodyGeometry = useMemo(() => new THREE.ConeGeometry(0.1, 0.25, 8), []);
  const headGeometry = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);
  const cutGeometry = useMemo(() => new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), []);

  return (
    <group ref={groupRef} position={position} userData={{ square, pieceType: 'bishop', color }}>
      {/* Base */}
      <mesh
        geometry={baseGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.15, 0]}
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

