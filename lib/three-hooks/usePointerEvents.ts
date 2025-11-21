/**
 * Hook for handling pointer events (mouse/touch) on the chessboard
 */

import { useThree } from '@react-three/fiber';
import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { algebraicToIndex, indexToAlgebraic, isValidIndex } from '@/utils/chess/coordinates';

export interface PointerEventHandlers {
  onSquareClick?: (square: string) => void;
  onSquareHover?: (square: string | null) => void;
  onPieceDragStart?: (square: string) => void;
  onPieceDrag?: (square: string | null) => void;
  onPieceDragEnd?: (square: string | null) => void;
}

export function usePointerEvents(
  handlers: PointerEventHandlers,
  boardSize: number = 8,
  squareSize: number = 1
) {
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster()).current;
  const isDragging = useRef(false);
  const dragStartSquare = useRef<string | null>(null);
  const hoveredSquare = useRef<string | null>(null);

  // Throttle hover events for performance
  const hoverThrottle = useRef(0);
  const HOVER_THROTTLE_MS = 16; // ~60fps

  const getSquareFromIntersection = useCallback(
    (intersection: THREE.Intersection): string | null => {
      if (!intersection.object.userData.square) {
        return null;
      }
      return intersection.object.userData.square as string;
    },
    []
  );

  const handlePointerDown = useCallback(
    (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      const mouse = new THREE.Vector2();
      mouse.x = (clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(clientY / gl.domElement.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const square = getSquareFromIntersection(intersects[0]);
        if (square) {
          isDragging.current = true;
          dragStartSquare.current = square;
          handlers.onPieceDragStart?.(square);
        }
      }
    },
    [raycaster, camera, gl, handlers, getSquareFromIntersection]
  );

  const handlePointerMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY;

      if (clientX === undefined || clientY === undefined) return;

      const mouse = new THREE.Vector2();
      mouse.x = (clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(clientY / gl.domElement.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      const now = Date.now();
      const square = intersects.length > 0 ? getSquareFromIntersection(intersects[0]) : null;

      if (isDragging.current) {
        handlers.onPieceDrag?.(square);
      } else {
        // Throttle hover events
        if (now - hoverThrottle.current > HOVER_THROTTLE_MS) {
          if (square !== hoveredSquare.current) {
            hoveredSquare.current = square;
            if (square) {
              handlers.onSquareHover?.(square);
            } else {
              handlers.onSquareHover?.(null);
            }
          }
          hoverThrottle.current = now;
        }
      }
    },
    [raycaster, camera, gl, handlers, getSquareFromIntersection]
  );

  const handlePointerUp = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;

      const clientX = 'touches' in event ? event.changedTouches[0]?.clientX ?? event.clientX : event.clientX;
      const clientY = 'touches' in event ? event.changedTouches[0]?.clientY ?? event.clientY : event.clientY;

      const mouse = new THREE.Vector2();
      mouse.x = (clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(clientY / gl.domElement.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      const square = intersects.length > 0 ? getSquareFromIntersection(intersects[0]) : null;
      
      handlers.onPieceDragEnd?.(square);
      
      if (square && dragStartSquare.current && square !== dragStartSquare.current) {
        handlers.onSquareClick?.(square);
      }

      isDragging.current = false;
      dragStartSquare.current = null;
    },
    [raycaster, camera, gl, handlers, getSquareFromIntersection]
  );

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}

