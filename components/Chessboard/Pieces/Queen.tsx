/**
 * Queen piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial } from './BasePiece';

export function Queen({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  const baseGeometry = useMemo(() => new THREE.CylinderGeometry(0.15, 0.2, 0.35, 8), []);
  const crownGeometry = useMemo(() => new THREE.SphereGeometry(0.1, 8, 8), []);
  const spikeGeometry = useMemo(() => new THREE.ConeGeometry(0.03, 0.08, 6), []);

  return (
    <group ref={groupRef} position={position} userData={{ square, pieceType: 'queen', color }}>
      {/* Base */}
      <mesh
        geometry={baseGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.175, 0]}
      />
      {/* Crown sphere */}
      <mesh
        geometry={crownGeometry}
        material={material}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        position={[0, 0.4, 0]}
      />
      {/* Crown spikes */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            geometry={spikeGeometry}
            material={material}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
            position={[Math.cos(angle) * 0.08, 0.48, Math.sin(angle) * 0.08]}
          />
        );
      })}
    </group>
  );
}

