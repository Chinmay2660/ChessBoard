/**
 * FEN (Forsyth-Edwards Notation) parser and serializer
 * https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
 */

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface BoardPosition {
  pieces: Map<string, Piece>; // Map of square (e.g., "e4") to Piece
  boardSize: number;
}

const FEN_PIECE_MAP: Record<string, Piece> = {
  'K': { type: 'king', color: 'white' },
  'Q': { type: 'queen', color: 'white' },
  'R': { type: 'rook', color: 'white' },
  'B': { type: 'bishop', color: 'white' },
  'N': { type: 'knight', color: 'white' },
  'P': { type: 'pawn', color: 'white' },
  'k': { type: 'king', color: 'black' },
  'q': { type: 'queen', color: 'black' },
  'r': { type: 'rook', color: 'black' },
  'b': { type: 'bishop', color: 'black' },
  'n': { type: 'knight', color: 'black' },
  'p': { type: 'pawn', color: 'black' },
};

const PIECE_TO_FEN: Map<string, string> = new Map([
  ['white-king', 'K'],
  ['white-queen', 'Q'],
  ['white-rook', 'R'],
  ['white-bishop', 'B'],
  ['white-knight', 'N'],
  ['white-pawn', 'P'],
  ['black-king', 'k'],
  ['black-queen', 'q'],
  ['black-rook', 'r'],
  ['black-bishop', 'b'],
  ['black-knight', 'n'],
  ['black-pawn', 'p'],
]);

/**
 * Parses a FEN string into a board position
 * @param fen - FEN string (only the piece placement part, e.g., "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
 * @param boardSize - Size of the board (default 8)
 * @returns Board position with pieces mapped to squares
 */
export function parseFEN(fen: string, boardSize: number = 8): BoardPosition {
  const pieces = new Map<string, Piece>();
  const rows = fen.split('/');

  if (rows.length !== boardSize) {
    throw new Error(`FEN has ${rows.length} rows, expected ${boardSize}`);
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    let colIndex = 0;

    for (const char of row) {
      if (colIndex >= boardSize) break;

      if (char >= '1' && char <= '9') {
        // Empty squares
        colIndex += parseInt(char, 10);
      } else if (FEN_PIECE_MAP[char]) {
        // Piece
        const square = indexToAlgebraic({ row: rowIndex, col: colIndex });
        pieces.set(square, FEN_PIECE_MAP[char]);
        colIndex++;
      } else {
        throw new Error(`Invalid FEN character: ${char}`);
      }
    }
  }

  return { pieces, boardSize };
}

/**
 * Converts a board position to FEN string
 * @param position - Board position
 * @returns FEN string (piece placement part only)
 */
export function toFEN(position: BoardPosition): string {
  const rows: string[] = [];

  for (let row = 0; row < position.boardSize; row++) {
    let fenRow = '';
    let emptyCount = 0;

    for (let col = 0; col < position.boardSize; col++) {
      const square = indexToAlgebraic({ row, col });
      const piece = position.pieces.get(square);

      if (piece) {
        if (emptyCount > 0) {
          fenRow += emptyCount;
          emptyCount = 0;
        }
        const key = `${piece.color}-${piece.type}`;
        fenRow += PIECE_TO_FEN.get(key) || '';
      } else {
        emptyCount++;
      }
    }

    if (emptyCount > 0) {
      fenRow += emptyCount;
    }

    rows.push(fenRow);
  }

  return rows.join('/');
}

/**
 * Gets the standard starting position FEN
 * @param boardSize - Size of the board (default 8)
 * @returns FEN string for starting position
 */
export function getStartingPosition(boardSize: number = 8): string {
  if (boardSize === 8) {
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  }
  // For non-standard sizes, return empty board
  return Array(boardSize).fill(String(boardSize)).join('/');
}

// Import helper from coordinates
import { indexToAlgebraic } from './coordinates';

