/**
 * Piece promotion dialog component
 */

'use client';

import { useState, useEffect } from 'react';
import { PieceColor } from '@/utils/chess/fen';

export interface PromotionDialogProps {
  color: PieceColor;
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  visible: boolean;
}

const PIECES = [
  { type: 'q' as const, name: 'Queen', symbol: '♕' },
  { type: 'r' as const, name: 'Rook', symbol: '♖' },
  { type: 'b' as const, name: 'Bishop', symbol: '♗' },
  { type: 'n' as const, name: 'Knight', symbol: '♘' },
] as const;

export function PromotionDialog({ color, onSelect, visible }: PromotionDialogProps) {
  const [selected, setSelected] = useState<'q' | 'r' | 'b' | 'n' | null>(null);

  useEffect(() => {
    if (visible) {
      setSelected(null);
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor = color === 'white' ? 'bg-white' : 'bg-gray-800';
  const textColor = color === 'white' ? 'text-gray-900' : 'text-white';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${bgColor} ${textColor} p-6 rounded-lg shadow-xl`}>
        <h3 className="text-xl font-bold mb-4 text-center">Promote Pawn</h3>
        <div className="grid grid-cols-4 gap-4">
          {PIECES.map((piece) => (
            <button
              key={piece.type}
              onClick={() => {
                setSelected(piece.type);
                onSelect(piece.type);
              }}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${selected === piece.type
                  ? 'border-blue-500 bg-blue-100'
                  : 'border-gray-300 hover:border-blue-300'
                }
              `}
            >
              <div className="text-4xl mb-2">{piece.symbol}</div>
              <div className="text-sm">{piece.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

