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
  onCancel?: () => void;
}

const PIECES = [
  { type: 'q' as const, name: 'Queen', symbol: '♕' },
  { type: 'r' as const, name: 'Rook', symbol: '♖' },
  { type: 'b' as const, name: 'Bishop', symbol: '♗' },
  { type: 'n' as const, name: 'Knight', symbol: '♘' },
] as const;

export function PromotionDialog({ color, onSelect, visible, onCancel }: PromotionDialogProps) {
  const [selected, setSelected] = useState<'q' | 'r' | 'b' | 'n' | null>(null);

  useEffect(() => {
    if (visible) {
      setSelected(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !onCancel) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onCancel]);

  if (!visible) return null;

  const bgColor = color === "white" ? "bg-white" : "bg-slate-800";
  const textColor = color === 'white' ? 'text-gray-900' : 'text-white';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Promote pawn"
    >
      <div className={`${bgColor} ${textColor} p-6 rounded-lg shadow-xl`} onClick={(e) => e.stopPropagation()}>
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
              <div className="text-4xl mb-2">{color === 'white' ? piece.symbol : piece.symbol.replace("♕","♛").replace("♖","♜").replace("♗","♝").replace("♘","♞")}</div>
              <div className="text-sm">{piece.name}</div>
            </button>
          ))}
        </div>
        {onCancel && <p className="text-xs text-center mt-3 opacity-60">Esc or click outside to cancel</p>}
      </div>
    </div>
  );
}

