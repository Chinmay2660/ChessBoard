/**
 * Main Chess Game component - integrates chessboard, clocks, and game logic
 */

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Chessboard } from '@/components/Chessboard/Chessboard';
import { ChessClock, TimeControlSelector } from '@/components/ChessClock';
import { LoadingScreen } from '@/components/LoadingScreen/LoadingScreen';
import { PromotionDialog } from '@/components/PromotionDialog/PromotionDialog';
import { useChessGame } from '@/lib/chess/useChessGame';
import { timeoutOutcome } from '@/lib/chess/clock';
import { GameConfig, TimeControl, TIME_CONTROLS } from '@/lib/chess/gameState';
import { BOARD_THEMES, BOARD_THEME_KEY, UI_MODE_KEY, applyUIMode, type UIMode } from '@/lib/theme';
import type { Square } from 'chess.js';

type Side = 'white' | 'black';

const toMs = (tc: TimeControl) => tc.initialMinutes * 60 * 1000;

const GLYPHS = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' },
} as const;
const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 } as const;
const START_COUNTS = { p: 8, n: 2, b: 2, r: 2, q: 1 } as const;
const ORDER = ['q', 'r', 'b', 'n', 'p'] as const;

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) - preference just won't persist */
  }
}

export function ChessGame() {
  const [timeControl, setTimeControl] = useState<TimeControl>(TIME_CONTROLS.rapid);
  const [gameStarted, setGameStarted] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ from: Square; to: Square } | null>(null);
  const [clocks, setClocks] = useState<Record<Side, number>>({
    white: toMs(TIME_CONTROLS.rapid),
    black: toMs(TIME_CONTROLS.rapid),
  });
  const [timeoutLoser, setTimeoutLoser] = useState<Side | null>(null);
  const [resigned, setResigned] = useState<Side | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [bonus, setBonus] = useState<{ side: Side; id: number } | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<UIMode>('dark');
  const [boardThemeId, setBoardThemeId] = useState(BOARD_THEMES[0].id);

  // Restore saved preferences after mount (keeps SSR markup stable). Reading
  // localStorage during render would cause a hydration mismatch.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMode(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    const saved = readStorage(BOARD_THEME_KEY);
    if (saved && BOARD_THEMES.some((t) => t.id === saved)) setBoardThemeId(saved);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next: UIMode = prev === 'dark' ? 'light' : 'dark';
      applyUIMode(next);
      writeStorage(UI_MODE_KEY, next);
      return next;
    });
  }, []);

  const chooseBoardTheme = useCallback((id: string) => {
    setBoardThemeId(id);
    writeStorage(BOARD_THEME_KEY, id);
  }, []);

  const boardTheme = BOARD_THEMES.find((t) => t.id === boardThemeId) ?? BOARD_THEMES[0];

  const config: GameConfig = { mode: 'local', timeControl };

  const {
    gameState,
    hoveredLegalMoves,
    handleSquareHover,
    handleSquareClick,
    makeMove,
    selectSquare,
    resetGame,
    getPieces,
    getKingSquareInCheck,
  } = useChessGame(config);

  const turn = gameState.currentTurn;
  const gameOver = gameState.status === 'finished' || timeoutLoser !== null || resigned !== null;
  // The promotion choice is part of the move, so the clock keeps running while it is open
  const clockRunning = gameStarted && !gameOver;

  // Result text
  const resultText = useMemo(() => {
    if (timeoutLoser) {
      const out = timeoutOutcome(gameState.chess.board(), timeoutLoser);
      return out.result === 'draw'
        ? 'Draw - time ran out but the opponent cannot checkmate'
        : `${out.winner === 'white' ? 'White' : 'Black'} wins on time`;
    }
    if (resigned) return `${resigned === 'white' ? 'Black' : 'White'} wins by resignation`;
    if (gameState.chess.isCheckmate()) return `Checkmate - ${turn === 'white' ? 'Black' : 'White'} wins`;
    if (gameState.chess.isStalemate()) return 'Draw by stalemate';
    if (gameState.chess.isInsufficientMaterial()) return 'Draw - insufficient material';
    if (gameState.chess.isThreefoldRepetition()) return 'Draw by repetition';
    if (gameState.status === 'finished') return 'Draw';
    return null;
  }, [timeoutLoser, resigned, gameState, turn]);

  // Single authoritative clock ticker for the side to move
  useEffect(() => {
    if (!clockRunning) return;
    let last = Date.now();
    const side = turn;
    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = now - last;
      last = now;
      setClocks((prev) => {
        const next = Math.max(0, prev[turn] - elapsed);
        if (next === 0) setTimeout(() => setTimeoutLoser(turn), 0);
        return { ...prev, [turn]: next };
      });
    }, 100);
    return () => {
      clearInterval(id);
      // Charge the time elapsed since the last tick so no fraction of a second is free
      const rest = Date.now() - last;
      if (rest > 0) setClocks((prev) => ({ ...prev, [side]: Math.max(0, prev[side] - rest) }));
    };
  }, [clockRunning, turn]);

  // Changing the time control (only possible before the game starts) resets the clocks
  const changeTimeControl = useCallback((tc: TimeControl) => {
    setTimeControl(tc);
    setClocks({ white: toMs(tc), black: toMs(tc) });
  }, []);

  // Keep latest move in view
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [gameState.moveHistory.length]);

  // Play a move and award the increment to the player who made it
  const playMove = useCallback(
    (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => {
      const mover = turn;
      if (makeMove(from, to, promotion)) {
        setClocks((prev) => ({ ...prev, [mover]: prev[mover] + timeControl.incrementSeconds * 1000 }));
        setBonus({ side: mover, id: Date.now() });
        return true;
      }
      return false;
    },
    [makeMove, turn, timeControl.incrementSeconds]
  );

  const needsPromotion = useCallback(
    (from: Square, to: Square): boolean => {
      const piece = getPieces().get(from);
      if (piece?.type !== 'p') return false;
      const rank = parseInt(to[1], 10);
      return (piece.color === 'white' && rank === 8) || (piece.color === 'black' && rank === 1);
    },
    [getPieces]
  );

  const handlePromotion = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (!pendingMove) return;
      playMove(pendingMove.from, pendingMove.to, piece);
      setPendingMove(null);
    },
    [pendingMove, playMove]
  );

  const cancelPromotion = useCallback(() => {
    setPendingMove(null);
    selectSquare(null);
  }, [selectSquare]);

  const onSquareClick = useCallback(
    (square: string) => {
      if (!gameStarted || gameOver || pendingMove) return;
      const sq = square as Square;
      const legalMove = gameState.selectedSquare
        ? gameState.legalMoves.find((m) => m.to === sq)
        : undefined;
      if (legalMove) {
        if (needsPromotion(legalMove.from, legalMove.to)) {
          setPendingMove({ from: legalMove.from, to: legalMove.to });
        } else {
          playMove(legalMove.from, legalMove.to);
        }
      } else if (gameState.selectedSquare === sq) {
        selectSquare(null); // click the selected piece again to deselect
      } else {
        handleSquareClick(sq);
      }
    },
    [gameStarted, gameOver, pendingMove, gameState.selectedSquare, gameState.legalMoves, needsPromotion, playMove, selectSquare, handleSquareClick]
  );

  const onSquareHover = useCallback(
    (square: string | null) => {
      if (!gameStarted || gameOver) {
        handleSquareHover(null);
        return;
      }
      handleSquareHover(square as Square | null);
    },
    [handleSquareHover, gameStarted, gameOver]
  );

  const newGame = useCallback(
    (start: boolean) => {
      resetGame();
      setPendingMove(null);
      setTimeoutLoser(null);
      setResigned(null);
      setBonus(null);
      setClocks({ white: toMs(timeControl), black: toMs(timeControl) });
      setGameStarted(start);
    },
    [resetGame, timeControl]
  );

  // Squares: selected/hovered legal moves, plus the checked king
  const kingInCheck = gameState.inCheck ? getKingSquareInCheck() : null;

  const highlightedSquares = useMemo(() => {
    const squares = new Set<string>();
    const source: string[] = gameState.selectedSquare
      ? gameState.legalMoves.map((m) => m.to as string)
      : hoveredLegalMoves;
    source.forEach((s) => squares.add(s));
    if (kingInCheck) squares.add(kingInCheck);
    return squares;
  }, [gameState.selectedSquare, gameState.legalMoves, hoveredLegalMoves, kingInCheck]);

  const captureSquares = useMemo(() => {
    const squares = new Set<string>();
    const pieces = getPieces();
    highlightedSquares.forEach((s) => pieces.has(s) && squares.add(s));
    return squares;
    // gameState changes whenever the position does
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedSquares, gameState]);

  const lastMove = useMemo(
    () => (gameState.lastMove ? { from: gameState.lastMove.from, to: gameState.lastMove.to } : null),
    [gameState.lastMove]
  );

  // Move list grouped in pairs: 1. e4 e5
  const movePairs = useMemo(() => {
    const pairs: Array<{ n: number; white: string; black?: string }> = [];
    gameState.moveHistory.forEach((m, i) => {
      if (i % 2 === 0) pairs.push({ n: i / 2 + 1, white: m.san });
      else pairs[pairs.length - 1].black = m.san;
    });
    return pairs;
  }, [gameState.moveHistory]);

  // Captured pieces + material balance, derived from the position
  const material = useMemo(() => {
    const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
    for (const row of gameState.chess.board()) {
      for (const sq of row) {
        if (sq && sq.type !== 'k') counts[sq.color][sq.type as keyof typeof START_COUNTS]++;
      }
    }
    const capturedBy = (side: 'w' | 'b') => {
      const enemy = side === 'w' ? 'b' : 'w';
      const out: string[] = [];
      for (const t of ORDER) {
        const n = Math.max(0, START_COUNTS[t] - counts[enemy][t]);
        for (let i = 0; i < n; i++) out.push(GLYPHS[enemy][t]);
      }
      return out;
    };
    const score = (side: 'w' | 'b') => ORDER.reduce((sum, t) => sum + counts[side][t] * VALUES[t], 0);
    const diff = score('w') - score('b');
    return { white: capturedBy('w'), black: capturedBy('b'), diff };
    // chess is mutated in place; gameState identity changes on every update
  }, [gameState]);

  const statusLine = !gameStarted
    ? 'Press Start Game to begin'
    : resultText ?? `${turn === 'white' ? 'White' : 'Black'} to move${gameState.inCheck ? ' - Check!' : ''}`;

  const panel =
    'rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900';
  const btnBase = 'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors';

  return (
    <>
    <LoadingScreen ready={sceneReady} />
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-none px-3 py-2">
        {/* Header */}
        <header className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-xl text-slate-900">
              ♞
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight">3D Chess</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Local two-player</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Board theme">
              {BOARD_THEMES.map((t) => (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={t.id === boardTheme.id}
                  aria-label={`${t.name} board`}
                  title={t.name}
                  onClick={() => chooseBoardTheme(t.id)}
                  className={`h-6 w-6 overflow-hidden rounded-full border-2 transition-transform hover:scale-110 ${
                    t.id === boardTheme.id ? 'border-amber-400' : 'border-transparent'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)` }}
                />
              ))}
            </div>
            <button
              onClick={toggleMode}
              aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
              title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-lg hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              {mode === 'dark' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          {/* Board */}
          <section>
            <div className="relative h-[70vh] min-h-[460px] w-full overflow-hidden lg:h-[calc(100vh-5.5rem)] rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-200 to-slate-300 shadow-xl dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
              <Chessboard
                size={8}
                squareSize={1}
                theme={{ light: boardTheme.light, dark: boardTheme.dark }}
                frameColor={boardTheme.frame}
                initialPosition={gameState.chess.fen()}
                showCoordinates
                enableAnimations={true}
                showShadows={true}
                devicePerformance="high"
                highlightedSquares={highlightedSquares}
                selectedSquare={gameState.selectedSquare || null}
                hoveredSquares={hoveredLegalMoves}
                captureSquares={captureSquares}
                lastMove={lastMove}
                onReady={() => setSceneReady(true)}
                onSquareHover={onSquareHover}
                onSquareClick={onSquareClick}
              />
              {!gameStarted && (
                <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
                  <span className="rounded-full bg-slate-900/70 px-4 py-1 text-sm text-white backdrop-blur">
                    Press Start Game to play
                  </span>
                </div>
              )}
              {gameStarted && gameOver && resultText && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                  <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center text-white shadow-2xl">
                    <div className="mb-1 text-2xl font-bold">Game over</div>
                    <div className="mb-4 text-slate-300">{resultText}</div>
                    <button onClick={() => newGame(true)} className={`${btnBase} bg-amber-400 text-slate-900 hover:bg-amber-300`}>
                      New Game
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-1 text-center text-[10px] text-slate-500 dark:text-slate-400">
              Click a piece, then a marked square. Drag to orbit, scroll to zoom.
            </p>
          </section>

          {/* Side panel */}
          <aside className="space-y-2">
            <ChessClock
              color="black"
              captured={material.black}
              advantage={material.diff < 0 ? -material.diff : 0}
              timeRemaining={clocks.black}
              bonus={bonus?.side === 'black' ? { id: bonus.id, seconds: timeControl.incrementSeconds } : null}
              isActive={clockRunning && turn === 'black'}
            />

            <div className={panel}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold">Moves</h3>
                <span
                  role="status"
                  aria-live="polite"
                  className={`text-xs ${gameState.inCheck && !gameOver ? 'font-semibold text-red-500' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {statusLine}
                </span>
              </div>
              <div className="h-32 overflow-y-auto font-mono text-xs">
                {movePairs.length === 0 && <div className="text-slate-400">No moves yet</div>}
                {movePairs.map((p) => (
                  <div
                    key={p.n}
                    className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded px-1 py-0.5 odd:bg-slate-50 dark:odd:bg-slate-800/50"
                  >
                    <span className="text-slate-400">{p.n}.</span>
                    <span>{p.white}</span>
                    <span>{p.black ?? ''}</span>
                  </div>
                ))}
                <div ref={historyEndRef} />
              </div>
            </div>

            <ChessClock
              color="white"
              captured={material.white}
              advantage={material.diff > 0 ? material.diff : 0}
              timeRemaining={clocks.white}
              bonus={bonus?.side === 'white' ? { id: bonus.id, seconds: timeControl.incrementSeconds } : null}
              isActive={clockRunning && turn === 'white'}
            />

            <div className={`${panel} space-y-3`}>
              <TimeControlSelector selected={timeControl} onChange={changeTimeControl} disabled={gameStarted} />
              <div className="flex flex-wrap gap-2">
                {!gameStarted ? (
                  <button onClick={() => newGame(true)} className={`${btnBase} flex-1 bg-amber-400 text-slate-900 hover:bg-amber-300`}>
                    Start Game
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => newGame(false)}
                      className={`${btnBase} flex-1 border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800`}
                    >
                      Reset
                    </button>
                    {!gameOver && (
                      <button
                        onClick={() => setResigned(turn)}
                        className={`${btnBase} flex-1 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400`}
                      >
                        {turn === 'white' ? 'White' : 'Black'} resigns
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>

        <PromotionDialog
          color={turn}
          onSelect={handlePromotion}
          onCancel={cancelPromotion}
          visible={pendingMove !== null}
        />
      </div>
    </div>
    </>
  );
}
