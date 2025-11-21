import {
  algebraicToIndex,
  indexToAlgebraic,
  isValidSquare,
  isValidIndex,
  getAllSquares,
} from '@/utils/chess/coordinates';

describe('Coordinate utilities', () => {
  describe('algebraicToIndex', () => {
    it('should convert algebraic notation to board indices', () => {
      expect(algebraicToIndex('a1')).toEqual({ row: 7, col: 0 });
      expect(algebraicToIndex('h8')).toEqual({ row: 0, col: 7 });
      expect(algebraicToIndex('e4')).toEqual({ row: 4, col: 4 });
      expect(algebraicToIndex('d5')).toEqual({ row: 3, col: 3 });
    });

    it('should throw error for invalid notation', () => {
      expect(() => algebraicToIndex('invalid')).toThrow();
      expect(() => algebraicToIndex('a')).toThrow();
      expect(() => algebraicToIndex('a12')).toThrow();
    });
  });

  describe('indexToAlgebraic', () => {
    it('should convert board indices to algebraic notation', () => {
      expect(indexToAlgebraic({ row: 7, col: 0 })).toBe('a1');
      expect(indexToAlgebraic({ row: 0, col: 7 })).toBe('h8');
      expect(indexToAlgebraic({ row: 4, col: 4 })).toBe('e4');
      expect(indexToAlgebraic({ row: 3, col: 3 })).toBe('d5');
    });
  });

  describe('isValidSquare', () => {
    it('should validate squares correctly', () => {
      expect(isValidSquare('a1')).toBe(true);
      expect(isValidSquare('h8')).toBe(true);
      expect(isValidSquare('e4')).toBe(true);
      expect(isValidSquare('z9')).toBe(false);
      expect(isValidSquare('a0')).toBe(false);
      expect(isValidSquare('i1')).toBe(false);
    });

    it('should validate squares for custom board sizes', () => {
      expect(isValidSquare('a1', 6)).toBe(true);
      expect(isValidSquare('f6', 6)).toBe(true);
      expect(isValidSquare('g7', 6)).toBe(false);
    });
  });

  describe('isValidIndex', () => {
    it('should validate indices correctly', () => {
      expect(isValidIndex({ row: 0, col: 0 })).toBe(true);
      expect(isValidIndex({ row: 7, col: 7 })).toBe(true);
      expect(isValidIndex({ row: 4, col: 4 })).toBe(true);
      expect(isValidIndex({ row: -1, col: 0 })).toBe(false);
      expect(isValidIndex({ row: 8, col: 0 })).toBe(false);
      expect(isValidIndex({ row: 0, col: 8 })).toBe(false);
    });
  });

  describe('getAllSquares', () => {
    it('should return all squares for 8x8 board', () => {
      const squares = getAllSquares(8);
      expect(squares).toHaveLength(64);
      expect(squares[0]).toBe('a8');
      expect(squares[63]).toBe('h1');
    });

    it('should return all squares for custom board size', () => {
      const squares = getAllSquares(6);
      expect(squares).toHaveLength(36);
      expect(squares[0]).toBe('a6');
      expect(squares[35]).toBe('f1');
    });
  });
});

