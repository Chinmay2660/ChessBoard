/**
 * Utility to export the current board state as an image
 * This can be used for reporting or sharing board positions
 */

import { ChessboardProps } from '@/components/Chessboard/Chessboard';
import { toFEN, parseFEN, getStartingPosition } from '@/utils/chess';

export interface BoardSnapshot {
  fen: string;
  boardSize: number;
  timestamp: string;
  moveCount?: number;
}

/**
 * Creates a snapshot of the current board state
 * @param props - Chessboard props
 * @param moveHistory - Optional move history
 * @returns Board snapshot object
 */
export function createBoardSnapshot(
  props: ChessboardProps,
  moveHistory?: Array<{ from: string; to: string }>
): BoardSnapshot {
  const { initialPosition, size = 8 } = props;
  const fen = initialPosition || getStartingPosition(size);

  return {
    fen,
    boardSize: size,
    timestamp: new Date().toISOString(),
    moveCount: moveHistory?.length || 0,
  };
}

/**
 * Exports board snapshot as JSON string
 * @param snapshot - Board snapshot
 * @returns JSON string
 */
export function exportSnapshotAsJSON(snapshot: BoardSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Exports board snapshot as FEN string
 * @param snapshot - Board snapshot
 * @returns FEN string
 */
export function exportSnapshotAsFEN(snapshot: BoardSnapshot): string {
  return snapshot.fen;
}

/**
 * Note: To export as an actual image, you would need to:
 * 1. Use html2canvas or similar library
 * 2. Capture the canvas element from Three.js
 * 3. Convert to image format
 * 
 * Example implementation would require additional dependencies:
 * 
 * ```typescript
 * import html2canvas from 'html2canvas';
 * 
 * export async function exportBoardAsImage(
 *   canvasElement: HTMLCanvasElement
 * ): Promise<Blob> {
 *   const canvas = await html2canvas(canvasElement);
 *   return new Promise((resolve) => {
 *     canvas.toBlob((blob) => {
 *       if (blob) resolve(blob);
 *     }, 'image/png');
 *   });
 * }
 * ```
 */

