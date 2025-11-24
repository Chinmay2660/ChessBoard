/**
 * Main Chessboard component - renders a 3D chessboard with Three.js
 * 
 * @example
 * ```tsx
 * <Chessboard
 *   size={8}
 *   theme="classic"
 *   onPieceMove={(from, to) => console.log(`Move from ${from} to ${to}`)}
 *   enableAnimations={true}
 * />
 * ```
 */

'use client';

import { Suspense, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { BoardMesh } from './BoardMesh';
import { CameraControls } from './controls/CameraControls';
import { MovePreview } from './controls/MovePreview';
import { King, Queen, Rook, Bishop, Knight, Pawn } from './Pieces';
import { useSceneSetup, usePointerEvents, usePieceAnimations } from '@/lib/three-hooks';
import { parseFEN, getStartingPosition, Piece, PieceType } from '@/utils/chess';
import { algebraicToIndex, indexToAlgebraic } from '@/utils/chess/coordinates';

export interface ChessboardProps {
  /** Board dimension in world units (fixed: 8) */
  size?: number;
  /** Size of one square (default: 1) */
  squareSize?: number;
  /** Board color theme */
  theme?: 'classic' | 'dark' | 'high-contrast' | { light: string; dark: string };
  /** Initial position as FEN string */
  initialPosition?: string;
  /** Show coordinate labels */
  showCoordinates?: boolean;
  /** Callback when a piece is moved */
  onPieceMove?: (from: string, to: string) => void;
  /** Enable piece animations */
  enableAnimations?: boolean;
  /** Show shadows */
  showShadows?: boolean;
  /** Device performance preset */
  devicePerformance?: 'low' | 'medium' | 'high';
  /** Highlighted squares (legal moves) */
  highlightedSquares?: Set<string>;
  /** Selected square */
  selectedSquare?: string | null;
  /** Hovered squares (from hover) */
  hoveredSquares?: string[];
  /** Capture squares (different highlight) */
  captureSquares?: Set<string>;
  /** Square hover callback */
  onSquareHover?: (square: string | null) => void;
  /** Square click callback */
  onSquareClick?: (square: string) => void;
}

interface PiecePosition {
  piece: Piece;
  square: string;
}

function ChessboardScene({
  size = 8,
  squareSize = 1,
  theme = 'classic',
  initialPosition,
  showCoordinates = false,
  onPieceMove,
  enableAnimations = true,
  showShadows = true,
  devicePerformance = 'high',
  highlightedSquares = new Set(),
  selectedSquare = null,
  hoveredSquares = [],
  captureSquares = new Set(),
  onSquareHover,
  onSquareClick,
}: ChessboardProps) {
  const [internalSelectedSquare, setInternalSelectedSquare] = useState<string | null>(null);
  const [internalHighlightedSquares, setInternalHighlightedSquares] = useState<Set<string>>(new Set());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [validMoves, setValidMoves] = useState<Set<string>>(new Set());
  const pieceRefs = useRef<Map<string, THREE.Group>>(new Map());
  const { scene } = useThree();
  
  // Use props if provided, otherwise use internal state
  const currentSelectedSquare = selectedSquare !== undefined ? selectedSquare : internalSelectedSquare;
  const currentHighlightedSquares = highlightedSquares.size > 0 ? highlightedSquares : internalHighlightedSquares;
  
  const BOARD_SIZE = 8; // Fixed 8x8 board

  // Get pieces from FEN - always sync with game state
  const pieces = useMemo(() => {
    if (initialPosition) {
      try {
        const position = parseFEN(initialPosition, BOARD_SIZE);
        return position.pieces;
      } catch (error) {
        console.error('Failed to parse FEN:', error);
        return new Map<string, Piece>();
      }
    } else {
      // Default starting position
      const fen = getStartingPosition(BOARD_SIZE);
      try {
        const position = parseFEN(fen, BOARD_SIZE);
        return position.pieces;
      } catch (error) {
        console.error('Failed to parse FEN:', error);
        return new Map<string, Piece>();
      }
    }
  }, [initialPosition]);

  // Set up scene
  useSceneSetup({ showShadows, devicePerformance, boardSize: BOARD_SIZE });

  // Helper to find piece in scene by square - memoize the getter function
  const pieceGetter = useMemo(
    () => ({
      get: (square: string): THREE.Group | null => {
        let found: THREE.Group | null = null;
        scene.traverse((child) => {
          if (child instanceof THREE.Group && child.userData.square === square && child.userData.pieceType) {
            found = child;
          }
        });
        return found || pieceRefs.current.get(square) || null;
      },
    }),
    [scene]
  );

  // Animation hook - use scene traversal instead of refs map
  const { animate, isAnimating } = usePieceAnimations(
    pieceGetter as Map<string, THREE.Group>,
    squareSize,
    {
      duration: enableAnimations ? 500 : 0,
    }
  );
  
  // Use props for selected/highlighted if provided
  const effectiveSelectedSquare = selectedSquare !== undefined ? selectedSquare : currentSelectedSquare;
  const effectiveHighlightedSquares = highlightedSquares.size > 0 ? highlightedSquares : currentHighlightedSquares;

  // Handle square click - this is only used if onSquareClick prop is not provided
  const handleSquareClick = useCallback(
    (square: string) => {
      if (isAnimating()) return;

      // If onSquareClick is provided, it handles everything via game logic
      if (onSquareClick) {
        onSquareClick(square);
        return;
      }

      // Fallback internal handler (for standalone chessboard without game logic)
      if (effectiveSelectedSquare) {
        // Try to move piece
        if (square !== effectiveSelectedSquare && validMoves.has(square)) {
          const piece = pieces.get(effectiveSelectedSquare);
          if (piece) {
            // Animate move
            if (enableAnimations) {
              animate(effectiveSelectedSquare, square, () => {
                onPieceMove?.(effectiveSelectedSquare, square);
                setLastMove({ from: effectiveSelectedSquare, to: square });
              });
            } else {
              onPieceMove?.(effectiveSelectedSquare, square);
              setLastMove({ from: effectiveSelectedSquare, to: square });
            }

            if (selectedSquare === undefined) {
              setInternalSelectedSquare(null);
            }
            setValidMoves(new Set());
            if (highlightedSquares.size === 0) {
              setInternalHighlightedSquares(new Set());
            }
          }
        } else {
          // Deselect
          if (selectedSquare === undefined) {
            setInternalSelectedSquare(null);
          }
          setValidMoves(new Set());
          if (highlightedSquares.size === 0) {
            setInternalHighlightedSquares(new Set());
          }
        }
      } else {
        // Select piece
        if (pieces.has(square)) {
          if (selectedSquare === undefined) {
            setInternalSelectedSquare(square);
            setInternalHighlightedSquares(new Set([square]));
          }
        }
      }
    },
    [effectiveSelectedSquare, pieces, validMoves, enableAnimations, animate, isAnimating, onPieceMove, onSquareClick, selectedSquare, highlightedSquares]
  );

  // Handle piece drag
  const handlePieceDragStart = useCallback(
    (square: string) => {
      if (pieces.has(square)) {
        if (selectedSquare === undefined) {
          setInternalSelectedSquare(square);
          setInternalHighlightedSquares(new Set([square]));
        }
      }
    },
    [pieces, selectedSquare]
  );

  const handlePieceDragEnd = useCallback(
    (square: string | null) => {
      if (effectiveSelectedSquare && square && square !== effectiveSelectedSquare) {
        handleSquareClick(square);
      }
    },
    [effectiveSelectedSquare, handleSquareClick]
  );

  // Enhanced pointer event handlers with hover support
  const { handlePointerDown, handlePointerMove, handlePointerUp } = usePointerEvents(
    {
      onSquareClick: (square: string) => {
        // Always use the provided onSquareClick if available (from game logic)
        // Otherwise fall back to internal handler
        if (onSquareClick) {
          onSquareClick(square);
        } else {
          handleSquareClick(square);
        }
      },
      onSquareHover: (square: string | null) => {
        // Always call the hover handler to show legal moves
        if (onSquareHover) {
          onSquareHover(square);
        }
      },
      onPieceDragStart: handlePieceDragStart,
      onPieceDragEnd: handlePieceDragEnd,
    },
    BOARD_SIZE,
    squareSize
  );

  // Attach event listeners - use refs to avoid re-attaching on every handler change
  const handlersRef = useRef({ handlePointerDown, handlePointerMove, handlePointerUp });
  useEffect(() => {
    handlersRef.current = { handlePointerDown, handlePointerMove, handlePointerUp };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const wrappedDown = (e: MouseEvent | TouchEvent) => handlersRef.current.handlePointerDown(e);
    const wrappedMove = (e: MouseEvent | TouchEvent) => handlersRef.current.handlePointerMove(e);
    const wrappedUp = (e: MouseEvent | TouchEvent) => handlersRef.current.handlePointerUp(e);

    canvas.addEventListener('mousedown', wrappedDown);
    canvas.addEventListener('mousemove', wrappedMove);
    canvas.addEventListener('mouseup', wrappedUp);
    canvas.addEventListener('touchstart', wrappedDown);
    canvas.addEventListener('touchmove', wrappedMove);
    canvas.addEventListener('touchend', wrappedUp);

    return () => {
      canvas.removeEventListener('mousedown', wrappedDown);
      canvas.removeEventListener('mousemove', wrappedMove);
      canvas.removeEventListener('mouseup', wrappedUp);
      canvas.removeEventListener('touchstart', wrappedDown);
      canvas.removeEventListener('touchmove', wrappedMove);
      canvas.removeEventListener('touchend', wrappedUp);
    };
  }, []); // Empty deps - handlers accessed via ref

  // Render pieces - sync with game state if provided via initialPosition
  const pieceComponents = useMemo(() => {
    const components: JSX.Element[] = [];

    // Use pieces from state (synced with FEN)
    pieces.forEach((piece, square) => {
      const index = algebraicToIndex(square);
      // Position pieces so their base sits on the board (y=0)
      // Each piece has its base at different heights, so we position the group
      // such that the base touches the board
      const position: [number, number, number] = [
        index.col * squareSize + squareSize / 2,
        0, // Board is at y=0, pieces will be positioned relative to this
        index.row * squareSize + squareSize / 2,
      ];

      const pieceProps = {
        color: piece.color,
        position,
        square,
        castShadow: showShadows && devicePerformance !== 'low',
        receiveShadow: showShadows && devicePerformance !== 'low',
      };
      
      // Set render order so pieces render after board for proper depth
      const renderOrder = 2;

      let PieceComponent;
      switch (piece.type) {
        case 'king':
          PieceComponent = King;
          break;
        case 'queen':
          PieceComponent = Queen;
          break;
        case 'rook':
          PieceComponent = Rook;
          break;
        case 'bishop':
          PieceComponent = Bishop;
          break;
        case 'knight':
          PieceComponent = Knight;
          break;
        case 'pawn':
          PieceComponent = Pawn;
          break;
        default:
          return;
      }

      // Pieces render after board - depth testing will occlude them if behind board
      components.push(
        <group key={square} renderOrder={1}>
          <PieceComponent {...pieceProps} />
        </group>
      );
    });

    return components;
  }, [pieces, squareSize, showShadows, devicePerformance]);

  return (
    <>
      {/* No background color - transparent for 3D effect */}
      <ambientLight intensity={0.6} />
      {/* Render board first so it properly occludes pieces behind it */}
      <BoardMesh
        boardSize={BOARD_SIZE}
        squareSize={squareSize}
        theme={theme}
        showCoordinates={showCoordinates}
        highlightedSquares={effectiveHighlightedSquares}
        selectedSquare={effectiveSelectedSquare}
        hoveredSquares={hoveredSquares}
        captureSquares={captureSquares}
        lastMove={lastMove}
      />
      {/* Pieces render after board - depth testing occludes them if behind board */}
      {pieceComponents}
      <MovePreview validSquares={validMoves} squareSize={squareSize} visible={!!effectiveSelectedSquare} />
      <CameraControls boardSize={BOARD_SIZE} />
    </>
  );
}

export function Chessboard(props: ChessboardProps) {
  const { size = 8, devicePerformance = 'high' } = props;
  const BOARD_SIZE = 8; // Fixed 8x8 board

  // Performance-based pixel ratio - check for window (SSR safety)
  const pixelRatio = useMemo(() => {
    if (typeof window === 'undefined') return 1; // SSR fallback
    if (devicePerformance === 'low') return 1;
    if (devicePerformance === 'medium') return Math.min(window.devicePixelRatio, 1.5);
    return Math.min(window.devicePixelRatio, 2);
  }, [devicePerformance]);

  return (
    <div className="w-full h-full relative" role="application" aria-label="3D Chessboard" style={{ background: 'transparent' }}>
      <Canvas
        gl={{
          antialias: devicePerformance !== 'low',
          alpha: true, // Enable alpha for transparency
          powerPreference: devicePerformance === 'high' ? 'high-performance' : 'default',
          preserveDrawingBuffer: false,
          depth: true, // Enable depth buffer
          stencil: false,
          logarithmicDepthBuffer: false,
        }}
        dpr={pixelRatio}
        camera={{ position: [BOARD_SIZE * 0.6, BOARD_SIZE * 0.8, BOARD_SIZE * 0.6], fov: 50 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        onCreated={({ gl }) => {
          // Set clear color to transparent
          gl.setClearColor(0x000000, 0);
          // Depth testing is enabled by default in Three.js renderer
          // The renderer automatically handles depth buffer
        }}
      >
        <Suspense fallback={null}>
          <ChessboardScene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}

