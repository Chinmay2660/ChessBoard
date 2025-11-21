/**
 * Minimal WebSocket server example for chess multiplayer
 * 
 * To run: node server/websocket-server.js
 * Requires: npm install ws
 */

const WebSocket = require('ws');
const { Chess } = require('chess.js');

const wss = new WebSocket.Server({ port: 8080 });

const games = new Map(); // gameId -> { white: ws, black: ws, chess: Chess }

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join':
          handleJoin(ws, data);
          break;
        case 'move':
          handleMove(ws, data);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          ws.send(JSON.stringify({ type: 'error', data: 'Unknown message type' }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', data: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Clean up games
    for (const [gameId, game] of games.entries()) {
      if (game.white === ws || game.black === ws) {
        games.delete(gameId);
        // Notify other player
        const otherPlayer = game.white === ws ? game.black : game.white;
        if (otherPlayer) {
          otherPlayer.send(JSON.stringify({ type: 'opponent-disconnected' }));
        }
      }
    }
  });
});

function handleJoin(ws, data) {
  const { gameId, color } = data;
  
  if (!games.has(gameId)) {
    games.set(gameId, {
      white: color === 'white' ? ws : null,
      black: color === 'black' ? ws : null,
      chess: new Chess(),
    });
  } else {
    const game = games.get(gameId);
    if (color === 'white') {
      game.white = ws;
    } else {
      game.black = ws;
    }
  }

  const game = games.get(gameId);
  
  // Send current game state
  ws.send(JSON.stringify({
    type: 'state',
    data: {
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      history: game.chess.history({ verbose: true }),
    },
  }));

  // Notify other player if both are connected
  if (game.white && game.black) {
    game.white.send(JSON.stringify({ type: 'game-ready' }));
    game.black.send(JSON.stringify({ type: 'game-ready' }));
  }
}

function handleMove(ws, data) {
  const { gameId, from, to, promotion } = data;
  const game = games.get(gameId);

  if (!game) {
    ws.send(JSON.stringify({ type: 'error', data: 'Game not found' }));
    return;
  }

  // Validate it's the correct player's turn
  const isWhiteTurn = game.chess.turn() === 'w';
  const isWhitePlayer = game.white === ws;

  if (isWhiteTurn !== isWhitePlayer) {
    ws.send(JSON.stringify({ type: 'error', data: 'Not your turn' }));
    return;
  }

  // Validate move
  try {
    const move = game.chess.move({
      from,
      to,
      promotion: promotion || 'q',
    });

    if (move) {
      // Broadcast move to both players
      const moveData = {
        type: 'move',
        data: {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: move.san,
        },
        fen: game.chess.fen(),
        turn: game.chess.turn(),
      };

      if (game.white) game.white.send(JSON.stringify(moveData));
      if (game.black) game.black.send(JSON.stringify(moveData));

      // Check for game end
      if (game.chess.isGameOver()) {
        const result = game.chess.isCheckmate()
          ? (game.chess.turn() === 'w' ? 'black-wins' : 'white-wins')
          : 'draw';

        const endData = {
          type: 'game-over',
          data: { result },
        };

        if (game.white) game.white.send(JSON.stringify(endData));
        if (game.black) game.black.send(JSON.stringify(endData));
      }
    }
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', data: 'Invalid move: ' + error.message }));
  }
}

console.log('WebSocket server running on ws://localhost:8080');

