import { Chess } from 'chess.js';
import { canSideMate, timeoutOutcome } from '@/lib/chess/clock';

const board = (fen: string) => new Chess(fen).board();

describe('timeout outcome', () => {
  it('is a win when the opponent has mating material', () => {
    expect(timeoutOutcome(board('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1'), 'black')).toEqual({ result: 'win', winner: 'white' });
    expect(timeoutOutcome(board('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'), 'white').result).toBe('win');
  });

  it('is a draw when the opponent has a bare king', () => {
    expect(timeoutOutcome(board('4k3/8/8/8/8/8/8/4K2R w - - 0 1'), 'white')).toEqual({ result: 'draw', winner: 'black' });
  });

  it('is a draw for king + minor vs bare king', () => {
    expect(canSideMate(board('4k3/8/8/8/8/8/8/3BK3 w - - 0 1'), 'white')).toBe(false);
    expect(canSideMate(board('4k3/8/8/8/8/8/8/3NK3 w - - 0 1'), 'white')).toBe(false);
  });

  it('is a win for king + minor when the loser still has pieces to be mated with', () => {
    expect(canSideMate(board('4k3/p7/8/8/8/8/8/3BK3 w - - 0 1'), 'white')).toBe(true);
  });

  it('counts two minors or any pawn/rook/queen as mating material', () => {
    expect(canSideMate(board('4k3/8/8/8/8/8/8/2NNK3 w - - 0 1'), 'white')).toBe(true);
    expect(canSideMate(board('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'), 'white')).toBe(true);
  });
});
