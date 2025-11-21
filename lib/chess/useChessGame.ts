/**
 * React hook for managing chess game state
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChessGame, GameConfig, TimeControl } from './gameState';
import type { Square } from 'chess.js';

export function useChessGame(config: GameConfig) {
  const gameRef = useRef<ChessGame>(new ChessGame());
  const [gameState, setGameState] = useState(() => gameRef.current.getState());
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);
  const [hoveredLegalMoves, setHoveredLegalMoves] = useState<Square[]>([]);

  const updateState = useCallback(() => {
    setGameState(gameRef.current.getState());
  }, []);

  const selectSquare = useCallback(
    (square: Square | null) => {
      gameRef.current.selectSquare(square);
      updateState();
    },
    [updateState]
  );

  const makeMove = useCallback(
    (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => {
      const success = gameRef.current.makeMove(from, to, promotion);
      if (success) {
        updateState();
        return true;
      }
      return false;
    },
    [updateState]
  );

  const handleSquareHover = useCallback(
    (square: Square | null) => {
      setHoveredSquare(square);
      if (square) {
        // If hovering over a piece, show its legal moves (only if it's current player's turn)
        const pieces = gameRef.current.getPieces();
        const piece = pieces.get(square);
        
        if (piece && piece.color === gameState.currentTurn) {
          // Only show hover moves if no piece is currently selected
          // If a piece is selected, don't show hover moves to avoid confusion
          if (!gameState.selectedSquare) {
            const moves = gameRef.current.getLegalMovesForSquare(square);
            setHoveredLegalMoves(moves.map((m) => m.to));
          } else {
            setHoveredLegalMoves([]);
          }
        } else {
          setHoveredLegalMoves([]);
        }
      } else {
        setHoveredLegalMoves([]);
      }
    },
    [gameState.currentTurn, gameState.selectedSquare]
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      const pieces = gameRef.current.getPieces();
      const piece = pieces.get(square);

      // If a square is already selected
      if (gameState.selectedSquare) {
        // Check if clicking on a legal move destination
        const isLegalMove = gameState.legalMoves.some((m) => m.to === square);
        
        if (isLegalMove) {
          // Make the move
          const move = gameState.legalMoves.find((m) => m.to === square);
          if (move) {
            makeMove(move.from, move.to);
            // Clear selection after move
            selectSquare(null);
          }
        } else if (piece && piece.color === gameState.currentTurn) {
          // Clicking on a different piece of same color - select that piece instead
          selectSquare(square);
        } else {
          // Clicking on empty square or opponent's piece - deselect
          selectSquare(null);
        }
      } else {
        // No selection - select piece if it's current player's turn
        if (piece && piece.color === gameState.currentTurn) {
          selectSquare(square);
        }
      }
    },
    [gameState.selectedSquare, gameState.legalMoves, gameState.currentTurn, makeMove, selectSquare]
  );

  const resetGame = useCallback(() => {
    gameRef.current.reset();
    updateState();
    setHoveredSquare(null);
    setHoveredLegalMoves([]);
  }, [updateState]);

  return {
    gameState,
    hoveredSquare,
    hoveredLegalMoves,
    selectSquare,
    makeMove,
    handleSquareHover,
    handleSquareClick,
    resetGame,
    getPieces: () => gameRef.current.getPieces(),
    getFEN: () => gameRef.current.getFEN(),
  };
}

