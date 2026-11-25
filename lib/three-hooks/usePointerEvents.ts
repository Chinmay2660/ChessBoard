/**
 * Hook for handling pointer events (mouse/touch) on the chessboard.
 * A "click" is a press+release that moved less than CLICK_TOLERANCE px, so
 * orbiting the camera never selects or moves pieces.
 */

import { useThree } from '@react-three/fiber';
import { useCallback, useRef } from 'react';
import * as THREE from 'three';

export interface PointerEventHandlers {
  onSquareClick?: (square: string) => void;
  onSquareHover?: (square: string | null) => void;
}

const CLICK_TOLERANCE = 6; // px
const HOVER_THROTTLE_MS = 16;

type PointerLike = MouseEvent | TouchEvent;

function getPoint(event: PointerLike, useChanged = false): { x: number; y: number } | null {
  if ('touches' in event) {
    const t = (useChanged ? event.changedTouches : event.touches)[0];
    return t ? { x: t.clientX, y: t.clientY } : null;
  }
  return { x: event.clientX, y: event.clientY };
}

export function usePointerEvents(
  handlers: PointerEventHandlers,
  _boardSize: number = 8,
  _squareSize: number = 1
) {
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster()).current;
  const downPoint = useRef<{ x: number; y: number } | null>(null);
  const hoveredSquare = useRef<string | null>(null);
  const hoverThrottle = useRef(0);

  const pickSquare = useCallback(
    (point: { x: number; y: number }): string | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((point.x - rect.left) / rect.width) * 2 - 1,
        -((point.y - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(scene.children, true);

      // Walk up from the hit mesh so clicking any part of a piece resolves
      // to that piece's square (the square lives on the piece's group).
      let boardSquare: string | null = null;
      for (const hit of hits) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj.userData.pieceType && obj.userData.square) return obj.userData.square as string;
          obj = obj.parent;
        }
        if (!boardSquare && hit.object.userData.isBoardSquare) {
          boardSquare = hit.object.userData.square as string;
        }
      }
      return boardSquare;
    },
    [camera, gl, scene, raycaster]
  );

  const handlePointerDown = useCallback((event: PointerLike) => {
    downPoint.current = getPoint(event);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerLike) => {
      const now = Date.now();
      if (now - hoverThrottle.current < HOVER_THROTTLE_MS) return;
      hoverThrottle.current = now;
      const p = getPoint(event);
      if (!p) return;
      const square = pickSquare(p);
      if (square !== hoveredSquare.current) {
        hoveredSquare.current = square;
        handlers.onSquareHover?.(square);
      }
    },
    [handlers, pickSquare]
  );

  const handlePointerUp = useCallback(
    (event: PointerLike) => {
      const start = downPoint.current;
      downPoint.current = null;
      const end = getPoint(event, true);
      if (!start || !end) return;
      if (Math.hypot(end.x - start.x, end.y - start.y) > CLICK_TOLERANCE) return; // was a camera drag
      const square = pickSquare(end);
      if (square) handlers.onSquareClick?.(square);
    },
    [handlers, pickSquare]
  );

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}
