/**
 * Hook for managing piece animations (move, capture, etc.)
 */

import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { algebraicToIndex } from '@/utils/chess/coordinates';

export interface AnimationState {
  isAnimating: boolean;
  fromSquare: string | null;
  toSquare: string | null;
  progress: number;
}

export interface AnimationOptions {
  duration?: number; // in milliseconds
  easing?: (t: number) => number;
  height?: number; // lift height during move
}

const DEFAULT_EASING = (t: number) => t * (2 - t); // ease-out

export function usePieceAnimations(
  pieceRefs: Map<string, THREE.Group> | { get: (square: string) => THREE.Group | null },
  squareSize: number = 1,
  options: AnimationOptions = {}
) {
  const animationState = useRef<AnimationState>({
    isAnimating: false,
    fromSquare: null,
    toSquare: null,
    progress: 0,
  });

  const animationFrame = useRef<number | null>(null);
  const startTime = useRef<number>(0);

  const {
    duration = 500,
    easing = DEFAULT_EASING,
    height = 0.3,
  } = options;

  const animate = useCallback(
    (fromSquare: string, toSquare: string, onComplete?: () => void) => {
      const fromPiece = pieceRefs.get(fromSquare);
      if (!fromPiece) {
        console.warn(`Piece not found at square: ${fromSquare}`);
        return;
      }

      const fromIndex = algebraicToIndex(fromSquare);
      const toIndex = algebraicToIndex(toSquare);

      const fromPos = new THREE.Vector3(
        fromIndex.col * squareSize + squareSize / 2,
        0,
        fromIndex.row * squareSize + squareSize / 2
      );
      const toPos = new THREE.Vector3(
        toIndex.col * squareSize + squareSize / 2,
        0,
        toIndex.row * squareSize + squareSize / 2
      );

      animationState.current = {
        isAnimating: true,
        fromSquare,
        toSquare,
        progress: 0,
      };

      startTime.current = performance.now();

      const animateFrame = (currentTime: number) => {
        const elapsed = currentTime - startTime.current;
        const t = Math.min(elapsed / duration, 1);
        const easedT = easing(t);

        // Calculate position with arc
        const currentPos = fromPos.clone().lerp(toPos, easedT);
        const lift = Math.sin(easedT * Math.PI) * height;
        currentPos.y = lift;

        fromPiece.position.copy(currentPos);

        animationState.current.progress = t;

        if (t < 1) {
          animationFrame.current = requestAnimationFrame(animateFrame);
        } else {
          animationState.current.isAnimating = false;
          animationState.current.fromSquare = null;
          animationState.current.toSquare = null;
          onComplete?.();
        }
      };

      animationFrame.current = requestAnimationFrame(animateFrame);
    },
    [pieceRefs, squareSize, duration, easing, height]
  );

  const stopAnimation = useCallback(() => {
    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    animationState.current.isAnimating = false;
  }, []);

  return {
    animate,
    stopAnimation,
    isAnimating: () => animationState.current.isAnimating,
    getAnimationState: () => animationState.current,
  };
}

