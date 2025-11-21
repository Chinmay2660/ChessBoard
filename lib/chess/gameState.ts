/**
 * Chess game state management using chess.js
 */

import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import { PieceColor } from '@/utils/chess/fen';

export type GameMode = 'local' | 'online';
export type GameStatus = 'waiting' | 'active' | 'paused' | 'finished';
export type GameResult = 'white-wins' | 'black-wins' | 'draw' | null;

export interface GameState {
  chess: Chess;
  currentTurn: 'white' | 'black';
  status: GameStatus;
  result: GameResult;
  moveHistory: Move[];
  selectedSquare: Square | null;
  legalMoves: Move[];
  lastMove: Move | null;
}

export interface GameConfig {
  mode: GameMode;
  timeControl?: TimeControl;
  playerColor?: PieceColor;
}

export interface TimeControl {
  initialMinutes: number;
  incrementSeconds: number;
}

export const TIME_CONTROLS = {
  classical: { initialMinutes: 90, incrementSeconds: 30 },
  rapid: { initialMinutes: 15, incrementSeconds: 10 },
  blitz: { initialMinutes: 3, incrementSeconds: 2 },
} as const;

export class ChessGame {
  private chess: Chess;
  private state: GameState;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
    this.state = this.createState();
  }

  private createState(): GameState {
    return {
      chess: this.chess,
      currentTurn: this.chess.turn() === 'w' ? 'white' : 'black',
      status: 'active',
      result: null,
      moveHistory: this.chess.history({ verbose: true }),
      selectedSquare: null,
      legalMoves: [],
      lastMove: this.chess.history({ verbose: true }).slice(-1)[0] || null,
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  getFEN(): string {
    return this.chess.fen();
  }

  getPieces(): Map<string, { type: string; color: PieceColor }> {
    const pieces = new Map();
    const board = this.chess.board();
    
    // Fixed 8x8 board
    const BOARD_SIZE = 8;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (piece) {
          const square = String.fromCharCode(97 + col) + (BOARD_SIZE - row);
          pieces.set(square, {
            type: piece.type,
            color: piece.color === 'w' ? 'white' : 'black',
          });
        }
      }
    }
    
    return pieces;
  }

  selectSquare(square: Square | null): void {
    this.state.selectedSquare = square;
    if (square) {
      this.state.legalMoves = this.chess
        .moves({ square, verbose: true })
        .filter((move) => {
          // Test if move is legal
          const testChess = new Chess(this.chess.fen());
          try {
            testChess.move(move);
            return true;
          } catch {
            return false;
          }
        });
    } else {
      this.state.legalMoves = [];
    }
  }

  getLegalMovesForSquare(square: Square): Move[] {
    return this.chess.moves({ square, verbose: true });
  }

  getAllLegalMoves(): Move[] {
    return this.chess.moves({ verbose: true });
  }

  makeMove(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n'): boolean {
    try {
      const move = this.chess.move({
        from,
        to,
        promotion: promotion || 'q',
      });

      if (move) {
        this.updateState();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  }

  private updateState(): void {
    this.state.currentTurn = this.chess.turn() === 'w' ? 'white' : 'black';
    this.state.moveHistory = this.chess.history({ verbose: true });
    this.state.lastMove = this.state.moveHistory.slice(-1)[0] || null;
    this.state.selectedSquare = null;
    this.state.legalMoves = [];

    // Check game status
    if (this.chess.isCheckmate()) {
      this.state.status = 'finished';
      this.state.result = this.chess.turn() === 'w' ? 'black-wins' : 'white-wins';
    } else if (this.chess.isDraw()) {
      this.state.status = 'finished';
      this.state.result = 'draw';
    } else if (this.chess.isStalemate()) {
      this.state.status = 'finished';
      this.state.result = 'draw';
    } else if (this.chess.isThreefoldRepetition()) {
      this.state.status = 'finished';
      this.state.result = 'draw';
    } else if (this.chess.isInsufficientMaterial()) {
      this.state.status = 'finished';
      this.state.result = 'draw';
    }
  }

  isCheck(): boolean {
    return this.chess.isCheck();
  }

  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  isDraw(): boolean {
    return this.chess.isDraw();
  }

  reset(): void {
    this.chess.reset();
    this.state = this.createState();
  }

  loadFEN(fen: string): boolean {
    try {
      this.chess.load(fen);
      this.state = this.createState();
      return true;
    } catch {
      return false;
    }
  }
}

