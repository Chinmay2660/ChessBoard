/**
 * Full-screen, game-style loading screen.
 * Progress eases towards 90% while the 3D scene boots, then completes once
 * `ready` is true (after a short minimum display time so it never just flashes),
 * and finally fades out and unmounts.
 */

'use client';

import { useEffect, useState } from 'react';

export interface LoadingScreenProps {
  /** True once the 3D scene has rendered its first frames */
  ready: boolean;
  /** Minimum time (ms) the screen stays up */
  minDuration?: number;
}

const TIPS = [
  'Click a piece to see every legal move.',
  'Drag to orbit the board and scroll to zoom.',
  'Control the centre early - e4, d4, e5 and d5 matter.',
  'Knights before bishops, castle before move ten.',
  'Every move earns the increment - spend it wisely.',
  'Switch board themes with the dots at the top right.',
];

const FADE_MS = 600;

export function LoadingScreen({ ready, minDuration = 1800 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [minElapsed, setMinElapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [tip, setTip] = useState(0);

  // Minimum display time
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), minDuration);
    return () => clearTimeout(t);
  }, [minDuration]);

  const done = ready && minElapsed;

  // Progress: ease towards 90% while loading, jump to 100% when done
  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setProgress(100), 0);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.08 + 0.4));
    }, 80);
    return () => clearInterval(id);
  }, [done]);

  // Rotate tips
  useEffect(() => {
    const id = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 2600);
    return () => clearInterval(id);
  }, []);

  // Fade out once the bar has filled
  useEffect(() => {
    if (progress < 100) return;
    const t1 = setTimeout(() => setLeaving(true), 350);
    const t2 = setTimeout(() => setGone(true), 350 + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [progress]);

  // Block page scroll while visible
  useEffect(() => {
    if (gone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [gone]);

  if (gone) return null;

  const pct = Math.min(100, Math.round(progress));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!done}
      aria-label="Loading game"
      style={{ transitionDuration: `${FADE_MS}ms` }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-100 transition-opacity ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Faint chequered backdrop with a vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'conic-gradient(#fff 25%, transparent 0 50%, #fff 0 75%, transparent 0)',
          backgroundSize: '96px 96px',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(251,191,36,0.10) 0%, rgba(2,6,23,0.85) 55%, #020617 100%)',
        }}
      />

      <div className="relative flex w-full max-w-md flex-col items-center px-6">
        {/* Logo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-3xl bg-amber-400/20" aria-hidden="true" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 to-amber-500 text-6xl text-slate-900 shadow-2xl shadow-amber-500/30">
            <span className="animate-bounce" style={{ animationDuration: '1.6s' }}>
              ♞
            </span>
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-[0.3em] text-white">3D CHESS</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.35em] text-amber-300/80">Set up the board</p>

        {/* Progress bar */}
        <div className="mt-10 w-full">
          <div
            className="h-3 w-full overflow-hidden rounded-full border border-slate-700 bg-slate-900"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-400 transition-[width] duration-200 ease-out"
              style={{ width: `${pct}%` }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-xs text-slate-400">
            <span>{pct < 100 ? 'Loading...' : 'Ready'}</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
        </div>

        {/* Tips */}
        <p key={tip} className="mt-8 h-10 animate-pulse text-center text-sm text-slate-400">
          <span className="mr-1 font-semibold text-amber-300">Tip:</span>
          {TIPS[tip]}
        </p>
      </div>
    </div>
  );
}
