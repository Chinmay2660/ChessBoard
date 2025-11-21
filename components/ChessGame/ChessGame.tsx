/**
 * Main Chess Game component - integrates chessboard, clocks, and game logic
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Chessboard } from '@/components/Chessboard/Chessboard';
import { ChessClock, TimeControlSelector } from '@/components/ChessClock';
import { PromotionDialog } from '@/components/PromotionDialog/PromotionDialog';
import { GameModeSelector } from '@/components/GameModeSelector/GameModeSelector';
import { useChessGame } from '@/lib/chess/useChessGame';
import { GameConfig, TimeControl, TIME_CONTROLS, GameMode } from '@/lib/chess/gameState';
import { WebSocketClient } from '@/lib/multiplayer/websocket';
import type { Square } from 'chess.js';

export function ChessGame() {
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [timeControl, setTimeControl] = useState<TimeControl>(TIME_CONTROLS.rapid);
  const [showPromotion, setShowPromotion] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ from: Square; to: Square } | null>(null);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);

  const config: GameConfig = {
    mode: gameMode,
    timeControl,
  };

  const {
    gameState,
    hoveredSquare,
    hoveredLegalMoves,
    handleSquareHover,
    handleSquareClick,
    makeMove,
    resetGame,
    getPieces,
  } = useChessGame(config);

  // Handle promotion
  const handlePromotion = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (pendingMove) {
        makeMove(pendingMove.from, pendingMove.to, piece);
        setPendingMove(null);
        setShowPromotion(false);
      }
    },
    [pendingMove, makeMove]
  );

  // Check if move requires promotion
  const checkPromotion = useCallback(
    (from: Square, to: Square): boolean => {
      const pieces = getPieces();
      const piece = pieces.get(from);
      if (piece?.type === 'p') {
        // Check if pawn reaches last rank
        const rank = parseInt(to[1]);
        if ((piece.color === 'white' && rank === 8) || (piece.color === 'black' && rank === 1)) {
          return true;
        }
      }
      return false;
    },
    [getPieces]
  );

  // Enhanced square click handler
  const onSquareClick = useCallback(
    (square: string) => {
      const sq = square as Square;
      
      // Check if this is a legal move from selected square
      if (gameState.selectedSquare) {
        const legalMove = gameState.legalMoves.find((m) => m.to === sq);
        if (legalMove) {
          // Check if promotion needed
          if (checkPromotion(legalMove.from, legalMove.to)) {
            setPendingMove({ from: legalMove.from, to: legalMove.to });
            setShowPromotion(true);
          } else {
            makeMove(legalMove.from, legalMove.to);
          }
        } else {
          handleSquareClick(sq);
        }
      } else {
        handleSquareClick(sq);
      }
    },
    [gameState.selectedSquare, gameState.legalMoves, checkPromotion, makeMove, handleSquareClick]
  );

  // Enhanced square hover handler
  const onSquareHover = useCallback(
    (square: string | null) => {
      handleSquareHover(square as Square | null);
    },
    [handleSquareHover]
  );

  // WebSocket connection for online mode
  useEffect(() => {
    if (gameMode === 'online') {
      const client = new WebSocketClient('ws://localhost:8080');
      
      client.onMessage((message) => {
        if (message.type === 'move') {
          const { from, to, promotion } = message.data;
          makeMove(from, to, promotion);
        } else if (message.type === 'state') {
          // Sync game state
          // This would require loading FEN from server
        }
      });

      client.connect().catch(console.error);
      setWsClient(client);

      return () => {
        client.disconnect();
      };
    }
  }, [gameMode, makeMove]);

  // Send move to server in online mode
  const sendMoveToServer = useCallback(
    (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => {
      if (wsClient?.isConnected()) {
        wsClient.sendMove(from, to, promotion);
      }
    },
    [wsClient]
  );

  // Combine legal moves (selected + hovered)
  const allHighlightedSquares = useCallback(() => {
    const squares = new Set<string>();
    
    // If a piece is selected, show only its legal moves (not hover moves)
    if (gameState.selectedSquare) {
      gameState.legalMoves.forEach((move) => {
        squares.add(move.to);
      });
    } else {
      // If no piece is selected, show hover moves when hovering over a piece
      hoveredLegalMoves.forEach((square) => {
        squares.add(square);
      });
    }
    
    return squares;
  }, [gameState.legalMoves, gameState.selectedSquare, hoveredLegalMoves]);

  // Get capture squares (different highlight)
  const captureSquares = useCallback(() => {
    const squares = new Set<string>();
    const pieces = getPieces();
    
    // Use selected piece's moves if selected, otherwise use hover moves
    const movesToCheck = gameState.selectedSquare 
      ? gameState.legalMoves 
      : hoveredLegalMoves.map((to) => ({ to } as any));
    
    movesToCheck.forEach((move: any) => {
      const targetSquare = move.to || move;
      if (pieces.has(targetSquare)) {
        squares.add(targetSquare);
      }
    });
    
    return squares;
  }, [gameState.legalMoves, gameState.selectedSquare, hoveredLegalMoves, getPieces]);

  const isWhiteTurn = gameState.currentTurn === 'white';
  const isGameActive = gameState.status === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-4">3D Chess Game</h1>
          
          <div className="flex gap-4 flex-wrap">
            <GameModeSelector selected={gameMode} onChange={setGameMode} />
            <TimeControlSelector selected={timeControl} onChange={setTimeControl} />
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              Reset Game
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Clocks */}
          <div className="lg:col-span-1 space-y-4">
            <ChessClock
              timeControl={timeControl}
              isActive={isGameActive && isWhiteTurn}
              onTimeUp={() => {
                // Handle time up
                console.log('White time up');
              }}
              color="white"
            />
            <ChessClock
              timeControl={timeControl}
              isActive={isGameActive && !isWhiteTurn}
              onTimeUp={() => {
                // Handle time up
                console.log('Black time up');
              }}
              color="black"
            />

            {/* Game Status */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Game Status</h3>
              <div className="text-sm space-y-1">
                <div>Turn: {gameState.currentTurn}</div>
                <div>Status: {gameState.status}</div>
                {gameState.result && <div>Result: {gameState.result}</div>}
                {gameState.chess.isCheck() && <div className="text-red-500">Check!</div>}
              </div>
            </div>
          </div>

          {/* Center - Chessboard */}
          <div className="lg:col-span-2">
            <div className="aspect-square w-full max-w-4xl mx-auto">
              <Chessboard
                size={8}
                squareSize={1}
                theme="classic"
                initialPosition={gameState.chess.fen()}
                onPieceMove={(from, to) => {
                  onSquareClick(to);
                  if (wsClient?.isConnected()) {
                    sendMoveToServer(from as Square, to as Square);
                  }
                }}
                enableAnimations={true}
                showShadows={true}
                devicePerformance="high"
                highlightedSquares={allHighlightedSquares()}
                selectedSquare={gameState.selectedSquare || null}
                hoveredSquares={hoveredLegalMoves || []}
                captureSquares={captureSquares()}
                onSquareHover={onSquareHover}
                onSquareClick={onSquareClick}
              />
            </div>
          </div>

          {/* Right Panel - Move History */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Move History</h3>
              <div className="space-y-1 text-sm max-h-96 overflow-y-auto">
                {gameState.moveHistory.map((move, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{i + 1}.</span>
                    <span>
                      {move.from} → {move.to}
                      {move.promotion && `=${move.promotion.toUpperCase()}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Promotion Dialog */}
        <PromotionDialog
          color={gameState.currentTurn}
          onSelect={handlePromotion}
          visible={showPromotion}
        />
      </div>
    </div>
  );
}

