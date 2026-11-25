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
  /** Frame (border) colour as a CSS hex string */
  frameColor?: string;
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

const labelCache = new Map<string, THREE.CanvasTexture>();

function makeLabelTexture(text: string) {
  const hit = labelCache.get(text);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = '#e8dcc0';
    g.font = 'bold 84px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 64, 68);
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  labelCache.set(text, t);
  return t;
}

const EMPTY_SET = new Set<string>();

export function BoardMesh({
  boardSize = 8, // Fixed 8x8 board
  squareSize = 1,
  theme = 'classic',
  showCoordinates = false,
  frameColor = '#3b2414',
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

  // Create materials - double-sided and fully opaque so board occludes pieces from behind
  const lightMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ 
      color: colors.light, 
      roughness: 0.8,
      side: THREE.DoubleSide, // Visible from both sides
      transparent: false, // Fully opaque
      opacity: 1.0,
      depthWrite: true, // Write to depth buffer
      depthTest: true, // Test depth
    }),
    [colors.light]
  );
  const darkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ 
      color: colors.dark, 
      roughness: 0.8,
      side: THREE.DoubleSide, // Visible from both sides
      transparent: false, // Fully opaque
      opacity: 1.0,
      depthWrite: true, // Write to depth buffer
      depthTest: true, // Test depth
    }),
    [colors.dark]
  );
  const flat = (color: number, opacity: number) =>
    new THREE.MeshBasicMaterial({ color, opacity, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  // Legal-move dot, capture ring, selected square and last-move tint
  const highlightMaterial = useMemo(() => flat(0x1f2937, 0.38), []);
  const captureMaterial = useMemo(() => flat(0xe11d48, 0.75), []);
  const hoverMaterial = useMemo(() => flat(0x1f2937, 0.25), []);
  const selectedMaterial = useMemo(() => flat(0xfbbf24, 0.55), []);
  const lastMoveMaterial = useMemo(() => flat(0xfbbf24, 0.3), []);

  // Create square geometries (reused for performance)
  const squareGeometry = useMemo(() => new THREE.PlaneGeometry(squareSize, squareSize), [squareSize]);
  const highlightGeometry = useMemo(() => new THREE.PlaneGeometry(squareSize, squareSize), [squareSize]);
  const dotGeometry = useMemo(() => new THREE.CircleGeometry(squareSize * 0.17, 32), [squareSize]);
  const ringGeometry = useMemo(() => new THREE.RingGeometry(squareSize * 0.38, squareSize * 0.48, 40), [squareSize]);

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

  const labels = useMemo(() => {
    if (!showCoordinates || typeof document === 'undefined') return [];
    const out: Array<{ key: string; texture: THREE.Texture; position: [number, number, number] }> = [];
    const off = squareSize * 0.3; // centre of the frame margin
    for (let i = 0; i < boardSize; i++) {
      const file = String.fromCharCode(97 + i);
      const rank = String(boardSize - i);
      out.push({ key: `f-${file}`, texture: makeLabelTexture(file), position: [i * squareSize + squareSize / 2, 0.02, boardSize * squareSize + off] });
      out.push({ key: `r-${rank}`, texture: makeLabelTexture(rank), position: [-off, 0.02, i * squareSize + squareSize / 2] });
    }
    return out;
  }, [showCoordinates, boardSize, squareSize]);

  const frameSize = boardSize * squareSize + squareSize * 1.2;

  return (
    <group ref={boardRef}>
      {/* Wooden frame under and around the board */}
      <mesh position={[(boardSize * squareSize) / 2, -0.11, (boardSize * squareSize) / 2]} receiveShadow>
        <boxGeometry args={[frameSize, 0.2, frameSize]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} />
      </mesh>
      {labels.map(({ key, texture, position }) => (
        <mesh key={key} position={position} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[squareSize * 0.4, squareSize * 0.4]} />
          <meshBasicMaterial map={texture} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
      ))}
      {/* Board squares - fully opaque to occlude pieces behind them */}
      {squares.map(({ square, isLight, position }) => (
        <mesh
          key={square}
          geometry={squareGeometry}
          material={isLight ? lightMaterial : darkMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={position}
          receiveShadow
          userData={{ square, isBoardSquare: true }}
          renderOrder={0} // Render board first
          frustumCulled={false} // Always render for proper occlusion
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
          geometry={isCapture ? ringGeometry : dotGeometry}
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
          geometry={dotGeometry}
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

