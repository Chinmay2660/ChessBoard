/**
 * Player card with clock. Presentational: ChessGame owns the time state,
 * ticking and increment so there is a single source of truth.
 */

'use client';

import { useEffect, useState } from 'react';

export interface ChessClockProps {
  color: 'white' | 'black';
  timeRemaining: number; // ms
  isActive: boolean;
  label?: string;
  /** Glyphs of pieces this player has captured */
  captured?: string[];
  /** Material lead in pawns (only shown when > 0) */
  advantage?: number;
  /** Increment just awarded; shows a brief +Ns badge (id changes per award) */
  bonus?: { id: number; seconds: number } | null;
}

export function formatClock(ms: number): string {
  if (!Number.isFinite(ms)) return '--:--';
  if (ms < 10_000) return (Math.max(0, ms) / 1000).toFixed(1);
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${ss}` : `${minutes}:${ss}`;
}

export function ChessClock({ color, timeRemaining, isActive, label, captured = [], advantage = 0, bonus = null }: ChessClockProps) {
  // The badge shows for each newly awarded bonus until its own timer hides it
  const [hiddenId, setHiddenId] = useState<number | null>(null);
  const bonusId = bonus?.id ?? null;
  const bonusSeconds = bonus?.seconds ?? 0;
  useEffect(() => {
    if (bonusId === null || bonusSeconds <= 0) return;
    const t = setTimeout(() => setHiddenId(bonusId), 1500);
    return () => clearTimeout(t);
  }, [bonusId, bonusSeconds]);
  const showBonus = bonusId !== null && bonusId !== hiddenId;

  const isLowTime = timeRemaining < 30_000 && timeRemaining > 0;
  const isWhite = color === 'white';

  return (
    <div
      aria-label={`${color} player`}
      className={`flex items-center gap-2 rounded-lg border p-2 shadow-sm transition-all duration-200
        bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800
        ${isActive ? 'ring-2 ring-amber-400 shadow-amber-400/20 shadow-lg' : ''}`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base
          ${isWhite ? 'bg-stone-100 text-stone-900 border border-stone-300' : 'bg-stone-900 text-stone-100 border border-stone-700'}`}
      >
        {isWhite ? '♔' : '♚'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs font-semibold capitalize">
          {label ?? color}
          {isActive && <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" aria-label="to move" />}
        </div>
        <div className="flex h-4 items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate tracking-tighter">{captured.join('')}</span>
          {advantage > 0 && <span className="ml-1 text-xs font-semibold">+{advantage}</span>}
        </div>
      </div>
      <div className="relative">
        {showBonus && bonus && (
          <span className="pointer-events-none absolute -top-3 right-0 animate-bounce text-[11px] font-bold text-emerald-500">
            +{bonus.seconds}s
          </span>
        )}
      <div
        className={`rounded-lg px-2 py-0.5 font-mono text-base font-bold tabular-nums
          ${isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}
          ${isLowTime ? '!bg-red-500 !text-white animate-pulse' : ''}`}
      >
        {formatClock(timeRemaining)}
      </div>
      </div>
    </div>
  );
}
