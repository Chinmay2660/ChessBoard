/**
 * Queen piece component - low-poly 3D model
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { BasePieceProps, usePieceMaterial, PIECE_SCALE, cachedGeometry } from './BasePiece';

export function Queen({ color, position, square, castShadow = true, receiveShadow = true }: BasePieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = usePieceMaterial(color);

  const baseGeometry = useMemo(() => cachedGeometry('Queen-baseGeometry', () => new THREE.CylinderGeometry(0.15, 0.2, 0.35, 8, 1, false)), []);
  const crownGeometry = useMemo(() => cachedGeometry('Queen-crownGeometry', () => new THREE.SphereGeometry(0.1, 8, 8)), []);
  const spikeGeometry = useMemo(() => cachedGeometry('Queen-spikeGeometry', () => new THREE.ConeGeometry(0.03, 0.08, 6)), []);

  // Bottom cap to ensure piece is fully solid
  const bottomCapGeometry = useMemo(() => cachedGeometry('Queen-bottomCapGeometry', () => new THREE.CircleGeometry(0.15, 8)), []);

  return (
    <group ref={groupRef} position={position} scale={PIECE_SCALE} userData={{ square, pieceType: 'queen', color }} renderOrder={2}>
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
        position={[0, 0.175, 0]} // Base height is 0.35, so center at 0.175
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

