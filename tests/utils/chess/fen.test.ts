import { parseFEN, toFEN, getStartingPosition, Piece } from '@/utils/chess/fen';

describe('FEN utilities', () => {
  describe('parseFEN', () => {
    it('should parse standard starting position', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const position = parseFEN(fen);

      expect(position.pieces.size).toBe(32);
      expect(position.pieces.get('a1')?.type).toBe('rook');
      expect(position.pieces.get('a1')?.color).toBe('white');
      expect(position.pieces.get('a8')?.type).toBe('rook');
      expect(position.pieces.get('a8')?.color).toBe('black');
      expect(position.pieces.get('e1')?.type).toBe('king');
      expect(position.pieces.get('e1')?.color).toBe('white');
    });

    it('should parse empty board', () => {
      const fen = '8/8/8/8/8/8/8/8';
      const position = parseFEN(fen);

      expect(position.pieces.size).toBe(0);
    });

    it('should throw error for invalid FEN', () => {
      expect(() => parseFEN('invalid')).toThrow();
      expect(() => parseFEN('rnbqkbnr/pppppppp/8/8/8/8/8')).toThrow();
    });
  });

  describe('toFEN', () => {
    it('should convert position to FEN', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const position = parseFEN(fen);
      const converted = toFEN(position);

      expect(converted).toBe(fen);
    });

    it('should handle empty board', () => {
      const fen = '8/8/8/8/8/8/8/8';
      const position = parseFEN(fen);
      const converted = toFEN(position);

      expect(converted).toBe(fen);
    });
  });

  describe('getStartingPosition', () => {
    it('should return standard starting position for 8x8', () => {
      const fen = getStartingPosition(8);
      expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    });

    it('should return empty board for non-standard sizes', () => {
      const fen = getStartingPosition(6);
      expect(fen).toBe('6/6/6/6/6/6');
    });
  });
});

