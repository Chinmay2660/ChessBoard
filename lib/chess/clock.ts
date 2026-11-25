/**
 * Clock rules that don't depend on React.
 */

export type Side = 'white' | 'black';

interface BoardPiece {
  type: string;
  color: 'w' | 'b';
}

/**
 * Can `side` possibly deliver checkmate? Used when the opponent's flag falls:
 * under FIDE rules the game is drawn (not won) if the side with time left
 * cannot checkmate by any series of legal moves. Mirrors chess.js's
 * "insufficient material" notion: a lone king, or king + one minor piece
 * against a lone king.
 */
export function canSideMate(board: (BoardPiece | null)[][], side: Side): boolean {
  const mine = side === 'white' ? 'w' : 'b';
  let minors = 0;
  let others = 0; // pawns, rooks, queens
  let opponentHasMore = false;

  for (const row of board) {
    for (const sq of row) {
      if (!sq || sq.type === 'k') continue;
      if (sq.color !== mine) {
        opponentHasMore = true;
        continue;
      }
      if (sq.type === 'n' || sq.type === 'b') minors++;
      else others++;
    }
  }

  if (others > 0 || minors >= 2) return true;
  if (minors === 0) return false; // bare king
  // King + single minor piece: can only mate with the opponent's help,
  // which is impossible when the opponent has a bare king.
  return opponentHasMore;
}

/** Result when `loser` runs out of time. */
export function timeoutOutcome(
  board: (BoardPiece | null)[][],
  loser: Side
): { result: 'win' | 'draw'; winner: Side } {
  const winner: Side = loser === 'white' ? 'black' : 'white';
  return { result: canSideMate(board, winner) ? 'win' : 'draw', winner };
}
