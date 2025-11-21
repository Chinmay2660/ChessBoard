/**
 * Move preview overlay - shows valid move destinations
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { algebraicToIndex } from '@/utils/chess/coordinates';

export interface MovePreviewProps {
  validSquares?: Set<string>;
  squareSize?: number;
  visible?: boolean;
}

export function MovePreview({ validSquares = new Set(), squareSize = 1, visible = true }: MovePreviewProps) {
  const previewData = useMemo(() => {
    if (!visible || validSquares.size === 0) return [];

    return Array.from(validSquares).map((square) => {
      const index = algebraicToIndex(square);
      const position: [number, number, number] = [
        index.col * squareSize + squareSize / 2,
        0.02,
        index.row * squareSize + squareSize / 2,
      ];
      return { square, position };
    });
  }, [validSquares, squareSize, visible]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        opacity: 0.4,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    []
  );

  const geometry = useMemo(() => new THREE.RingGeometry(squareSize * 0.3, squareSize * 0.4, 16), [squareSize]);

  if (!visible || previewData.length === 0) return null;

  return (
    <group>
      {previewData.map(({ square, position }) => (
        <mesh
          key={`preview-${square}`}
          geometry={geometry}
          material={material}
          rotation={[-Math.PI / 2, 0, 0]}
          position={position}
          userData={{ square }}
        />
      ))}
    </group>
  );
}

