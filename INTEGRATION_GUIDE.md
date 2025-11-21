# Chess Game Integration Guide

This guide explains how to integrate and use the two-player chess game features.

## Features Overview

- ✅ **Local/Hotseat Mode**: Two players alternate turns on the same device
- ✅ **Online Multiplayer**: WebSocket-based multiplayer with server validation
- ✅ **Legal Move Highlighting**: Hover over pieces to see legal moves
- ✅ **Click-to-Select/Click-to-Place**: Intuitive move input
- ✅ **FIDE-Style Clocks**: Configurable time controls with increments
- ✅ **Move Validation**: Uses chess.js for accurate move validation
- ✅ **Promotion UI**: Dialog for choosing promotion piece

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run the Application

```bash
pnpm dev
```

### 3. (Optional) Start WebSocket Server for Online Mode

```bash
node server/websocket-server.js
```

## Component Structure

### Main Game Component

```tsx
import { ChessGame } from '@/components/ChessGame/ChessGame';

export default function Page() {
  return <ChessGame />;
}
```

### Using Chessboard with Game Logic

```tsx
import { Chessboard } from '@/components/Chessboard/Chessboard';
import { useChessGame } from '@/lib/chess/useChessGame';

function MyGame() {
  const { gameState, handleSquareClick, handleSquareHover } = useChessGame({
    mode: 'local',
    timeControl: { initialMinutes: 15, incrementSeconds: 10 },
  });

  return (
    <Chessboard
      size={8} // Fixed 8x8
      highlightedSquares={new Set(gameState.legalMoves.map(m => m.to))}
      selectedSquare={gameState.selectedSquare}
      onSquareClick={handleSquareClick}
      onSquareHover={handleSquareHover}
    />
  );
}
```

## Game Modes

### Local (Hotseat) Mode

Players alternate turns on the same device. No server required.

```tsx
const config = {
  mode: 'local',
  timeControl: TIME_CONTROLS.rapid,
};
```

### Online Mode

Requires WebSocket server. Players connect to the same game room.

```tsx
const config = {
  mode: 'online',
  timeControl: TIME_CONTROLS.classical,
};
```

## Time Controls

Predefined time controls:

- **Classical**: 90 minutes + 30s increment
- **Rapid**: 15 minutes + 10s increment  
- **Blitz**: 3 minutes + 2s increment

```tsx
import { TIME_CONTROLS } from '@/lib/chess/gameState';

<TimerControlSelector 
  selected={TIME_CONTROLS.rapid}
  onChange={setTimeControl}
/>
```

## Move Input

### Click-to-Select/Click-to-Place

1. Click a piece to select it (highlights legal moves)
2. Click a highlighted square to move
3. Click another piece of same color to change selection
4. Click empty space to deselect

### Hover Highlighting

- Hover over a piece to see its legal moves
- Capture squares show in red
- Quiet moves show in yellow

## Promotion

When a pawn reaches the last rank, a promotion dialog appears:

```tsx
<PromotionDialog
  color={gameState.currentTurn}
  onSelect={(piece) => {
    makeMove(from, to, piece);
  }}
  visible={showPromotion}
/>
```

## WebSocket Server

The included server (`server/websocket-server.js`) provides:

- Game room management
- Move validation
- State synchronization
- Conflict resolution

### Server API

**Join Game:**
```json
{
  "type": "join",
  "gameId": "game-123",
  "color": "white"
}
```

**Make Move:**
```json
{
  "type": "move",
  "gameId": "game-123",
  "from": "e2",
  "to": "e4",
  "promotion": "q"
}
```

## Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Customization

### Custom Time Control

```tsx
const customTimeControl = {
  initialMinutes: 10,
  incrementSeconds: 5,
};
```

### Custom Themes

The chessboard supports custom color themes:

```tsx
<Chessboard
  theme={{ light: '#f0d9b5', dark: '#b58863' }}
/>
```

## Performance Considerations

- Use `devicePerformance="low"` for mobile devices
- Disable shadows for better performance
- Reduce animation duration for faster gameplay

## Troubleshooting

### WebSocket Connection Issues

- Ensure server is running on port 8080
- Check firewall settings
- Verify WebSocket URL in client code

### Move Validation Errors

- All moves are validated server-side in online mode
- Invalid moves are rejected with error messages
- Check browser console for details

## Next Steps

- Add move history navigation
- Implement draw offers
- Add spectator mode
- Implement game replay

