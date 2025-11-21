/**
 * BoardMesh component - renders the 3D chessboard with squares
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { indexToAlgebraic, algebraicToIndex } from '@/utils/chess/coordinates';

export interface BoardMeshProps {
  boardSize?: number; // Fixed to 8
  squareSize?: number;
  theme?: 'classic' | 'dark' | 'high-contrast' | { light: string; dark: string };
  showCoordinates?: boolean;
  highlightedSquares?: Set<string>;
  selectedSquare?: string | null;
  hoveredSquares?: string[];
  captureSquares?: Set<string>;
  lastMove?: { from: string; to: string } | null;
}

const THEME_COLORS = {
  classic: { light: 0xf0d9b5, dark: 0xb58863 },
  dark: { light: 0x769656, dark: 0xeeeed2 },
  'high-contrast': { light: 0xffffff, dark: 0x333333 }, // Changed from pure black to dark gray for better contrast
};

const EMPTY_SET = new Set<string>();

export function BoardMesh({
  boardSize = 8, // Fixed 8x8 board
  squareSize = 1,
  theme = 'classic',
  showCoordinates = false,
  highlightedSquares = EMPTY_SET,
  selectedSquare = null,
  hoveredSquares = [],
  captureSquares = new Set(),
  lastMove = null,
}: BoardMeshProps) {
  const boardRef = useRef<THREE.Group>(null);

  // Get colors from theme
  const colors = useMemo(() => {
    if (typeof theme === 'object') {
      return {
        light: parseInt(theme.light.replace('#', ''), 16),
        dark: parseInt(theme.dark.replace('#', ''), 16),
      };
    }
    return THEME_COLORS[theme];
  }, [theme]);

  // Create materials
  const lightMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: colors.light, roughness: 0.8 }),
    [colors.light]
  );
  const darkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: colors.dark, roughness: 0.8 }),
    [colors.dark]
  );
  const highlightMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xffff00, opacity: 0.5, transparent: true }),
    []
  );
  const captureMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xff4444, opacity: 0.6, transparent: true }),
    []
  );
  const hoverMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x44ff44, opacity: 0.4, transparent: true }),
    []
  );
  const selectedMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x4488ff, opacity: 0.5, transparent: true }),
    []
  );
  const lastMoveMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x00ff00, opacity: 0.3, transparent: true }),
    []
  );

  // Create square geometries (reused for performance)
  const squareGeometry = useMemo(() => new THREE.PlaneGeometry(squareSize, squareSize), [squareSize]);
  const highlightGeometry = useMemo(() => new THREE.PlaneGeometry(squareSize, squareSize), [squareSize]);

  // Create squares data
  const squares = useMemo(() => {
    const squares: Array<{
      square: string;
      isLight: boolean;
      position: [number, number, number];
    }> = [];

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const isLight = (row + col) % 2 === 0;
        const square = indexToAlgebraic({ row, col });
        const position: [number, number, number] = [
          col * squareSize + squareSize / 2,
          0,
          row * squareSize + squareSize / 2,
        ];

        squares.push({ square, isLight, position });
      }
    }

    return squares;
  }, [boardSize, squareSize]);

  // Create highlight overlays data (legal moves)
  const highlights = useMemo(() => {
    const highlights: Array<{ square: string; position: [number, number, number]; isCapture: boolean }> = [];

    highlightedSquares.forEach((square) => {
      const isCapture = captureSquares.has(square);
      const index = algebraicToIndex(square);
      const position: [number, number, number] = [
        index.col * squareSize + squareSize / 2,
        0.01, // Slightly above board
        index.row * squareSize + squareSize / 2,
      ];
      highlights.push({ square, position, isCapture });
    });

    return highlights;
  }, [highlightedSquares, captureSquares, squareSize]);

  // Create hover highlights
  const hoverHighlights = useMemo(() => {
    const highlights: Array<{ square: string; position: [number, number, number] }> = [];

    hoveredSquares.forEach((square) => {
      if (!highlightedSquares.has(square)) {
        const index = algebraicToIndex(square);
        const position: [number, number, number] = [
          index.col * squareSize + squareSize / 2,
          0.015, // Slightly above other highlights
          index.row * squareSize + squareSize / 2,
        ];
        highlights.push({ square, position });
      }
    });

    return highlights;
  }, [hoveredSquares, highlightedSquares, squareSize]);

  // Selected square highlight
  const selectedHighlight = useMemo(() => {
    if (!selectedSquare) return null;
    const index = algebraicToIndex(selectedSquare);
    return {
      square: selectedSquare,
      position: [
        index.col * squareSize + squareSize / 2,
        0.02,
        index.row * squareSize + squareSize / 2,
      ] as [number, number, number],
    };
  }, [selectedSquare, squareSize]);

  // Create last move indicators data
  const lastMoveIndicators = useMemo(() => {
    if (!lastMove) return [];

    const indicators: Array<{ square: string; position: [number, number, number] }> = [];

    [lastMove.from, lastMove.to].forEach((square) => {
      const index = algebraicToIndex(square);
      const position: [number, number, number] = [
        index.col * squareSize + squareSize / 2,
        0.01,
        index.row * squareSize + squareSize / 2,
      ];
      indicators.push({ square, position });
    });

    return indicators;
  }, [lastMove, squareSize]);

  // Memoize highlighted squares array for comparison
  const highlightedArray = useMemo(() => Array.from(highlightedSquares), [highlightedSquares]);
  
  useFrame(() => {
    if (boardRef.current && highlightedSquares.size > 0) {
      // Update highlights dynamically only if there are highlights
      boardRef.current.children.forEach((child) => {
        if (child.userData.isHighlight) {
          const square = child.userData.square;
          child.visible = highlightedSquares.has(square);
        }
      });
    }
  });

  return (
    <group ref={boardRef}>
      {/* Board squares */}
      {squares.map(({ square, isLight, position }) => (
        <mesh
          key={square}
          geometry={squareGeometry}
          material={isLight ? lightMaterial : darkMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={position}
          receiveShadow
          userData={{ square }}
        />
      ))}
      {/* Selected square highlight */}
      {selectedHighlight && (
        <mesh
          key={`selected-${selectedHighlight.square}`}
          geometry={highlightGeometry}
          material={selectedMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={selectedHighlight.position}
          userData={{ square: selectedHighlight.square, isSelected: true }}
        />
      )}
      {/* Legal move highlights */}
      {highlights.map(({ square, position, isCapture }) => (
        <mesh
          key={`highlight-${square}`}
          geometry={highlightGeometry}
          material={isCapture ? captureMaterial : highlightMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={position}
          userData={{ square, isHighlight: true, isCapture }}
        />
      ))}
      {/* Hover highlights */}
      {hoverHighlights.map(({ square, position }) => (
        <mesh
          key={`hover-${square}`}
          geometry={highlightGeometry}
          material={hoverMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={position}
          userData={{ square, isHover: true }}
        />
      ))}
      {/* Last move indicators */}
      {lastMoveIndicators.map(({ square, position }) => (
        <mesh
          key={`lastmove-${square}`}
          geometry={highlightGeometry}
          material={lastMoveMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={position}
          userData={{ square }}
        />
      ))}
    </group>
  );
}

