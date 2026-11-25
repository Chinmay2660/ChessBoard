/**
 * Utility functions for converting between algebraic notation and board indices
 */

export type Square = string; // e.g., "e4", "a1"
export type BoardIndex = { row: number; col: number }; // 0-based indices

/**
 * Converts algebraic notation (e.g., "e4") to board indices
 * @param square - Algebraic notation square (e.g., "e4")
 * @returns Board indices { row, col } where row and col are 0-based
 */
export function algebraicToIndex(square: Square, boardSize: number = 8): BoardIndex {
  if (square.length !== 2) {
    throw new Error(`Invalid square notation: ${square}`);
  }
  const col = square.charCodeAt(0) - 97; // 'a' = 97, so 'a' -> 0
  const row = boardSize - parseInt(square[1], 10);
  return { row, col };
}

/**
 * Converts board indices to algebraic notation
 * @param index - Board indices { row, col } (0-based)
 * @returns Algebraic notation square (e.g., "e4")
 */
export function indexToAlgebraic(index: BoardIndex, boardSize: number = 8): Square {
  const col = String.fromCharCode(97 + index.col); // 0 -> 'a'
  const row = boardSize - index.row;
  return `${col}${row}` as Square;
}

/**
 * Validates if a square is within board bounds
 * @param square - Algebraic notation square
 * @param boardSize - Size of the board (default 8)
 * @returns True if square is valid
 */
export function isValidSquare(square: Square, boardSize: number = 8): boolean {
  try {
    const index = algebraicToIndex(square, boardSize);
    return (
      index.row >= 0 &&
      index.row < boardSize &&
      index.col >= 0 &&
      index.col < boardSize
    );
  } catch {
    return false;
  }
}

/**
 * Validates if board indices are within bounds
 * @param index - Board indices
 * @param boardSize - Size of the board (default 8)
 * @returns True if indices are valid
 */
export function isValidIndex(index: BoardIndex, boardSize: number = 8): boolean {
  return (
    index.row >= 0 &&
    index.row < boardSize &&
    index.col >= 0 &&
    index.col < boardSize
  );
}

/**
 * Gets all squares on the board
 * @param boardSize - Size of the board (default 8)
 * @returns Array of all square notations
 */
export function getAllSquares(boardSize: number = 8): Square[] {
  const squares: Square[] = [];
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      squares.push(indexToAlgebraic({ row, col }, boardSize));
    }
  }
  return squares;
}

