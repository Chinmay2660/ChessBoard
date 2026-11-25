# 3D Chess

A two-player chess game on a 3D board, built with Next.js, Three.js (via react-three-fiber) and Tailwind CSS. Play locally with a chess clock, legal-move hints, promotion, game-over detection, dark/light mode and selectable board themes. The board is also usable on its own as a reusable `<Chessboard />` component.

## Features

**Game**
- Full chess rules via [chess.js](https://github.com/jhlywa/chess.js): castling, en passant, promotion, check, checkmate, stalemate, repetition, insufficient material
- Click a piece to see its legal moves; captures show as rings, moves as dots, the last move is tinted, a checked king is marked
- Promotion dialog (Esc or click outside to cancel)
- Move list in standard notation, captured pieces and material balance
- Resign, reset, and a game-over panel

**Chess clock**
- Presets: Classical 90+30, Rapid 15+10 (default), Blitz 3+2
- Fischer increment: after each completed move the mover gets the increment (a `+10s` badge flashes)
- White's clock starts with the game; only the side to move ticks; the promotion choice is part of the move
- Running out of time loses, unless the opponent cannot checkmate (bare king, or king + one minor piece against a bare king), which is a draw

**UI**
- Game-style loading screen that stays until the 3D scene has rendered
- Dark / light mode (follows the system on first visit, then remembered)
- Board themes: Walnut, Marble, Midnight, Emerald (remembered)
- Orbit / zoom camera that cannot go under the board
- Responsive layout; coordinates drawn on the board frame

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| 3D | three 0.187, @react-three/fiber 9, @react-three/drei 10 |
| Chess | chess.js |
| Styling | Tailwind CSS 4 |
| Language | TypeScript 6 |
| Tests | Jest 30, React Testing Library |
| Lint | ESLint 9 (flat config, `eslint-config-next`) |

TypeScript 7 and ESLint 10 are available but not used yet: `typescript-eslint` does not support TS 7.

## Getting started

Requires Node.js 20.9+.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (`eslint .`) |
| `npm test` | Jest tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage |

## Project structure

```
app/                      layout (applies saved colour mode before paint) + page
components/
  ChessGame/              the game screen: layout, clocks, promotion, game over
  ChessClock/             player card + clock, time-control selector
  Chessboard/             3D board: Chessboard, BoardMesh, Pieces/, controls/
  LoadingScreen/          game-style loader
  PromotionDialog/
lib/
  chess/                  gameState (chess.js wrapper), useChessGame hook, clock rules
  three-hooks/            scene setup, pointer picking, animations, frustum culling
  theme.ts                UI mode + board themes
  multiplayer/            WebSocket / WebRTC helpers (not wired into the UI yet)
utils/chess/              coordinates and FEN helpers
tests/                    unit + component tests
server/                   websocket-server.js (for the multiplayer helpers)
```

## Using the board on its own

```tsx
import { Chessboard } from '@/components/Chessboard/Chessboard';

export default function Page() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Chessboard
        theme={{ light: '#ecd9b5', dark: '#a9794f' }}
        frameColor="#3b2414"
        initialPosition="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        showCoordinates
        onSquareClick={(square) => console.log(square)}
      />
    </div>
  );
}
```

The board is a fixed 8x8. Chess rules live outside it (`lib/chess`), so you decide what a click means.

### `<Chessboard />` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `squareSize` | `number` | `1` | World size of one square |
| `theme` | `'classic' \| 'dark' \| 'high-contrast' \| { light, dark }` | `'classic'` | Square colours (CSS hex strings for the object form) |
| `frameColor` | `string` | `'#3b2414'` | Frame colour (CSS hex) |
| `initialPosition` | `string` | starting position | FEN; pieces follow this value |
| `showCoordinates` | `boolean` | `false` | Draw a-h / 1-8 on the frame |
| `highlightedSquares` | `Set<string>` | - | Squares to mark (dots) |
| `captureSquares` | `Set<string>` | - | Highlighted squares that are captures (rings) |
| `selectedSquare` | `string \| null` | - | Selected square |
| `hoveredSquares` | `string[]` | - | Extra hover markers |
| `lastMove` | `{ from, to } \| null` | - | Last move tint |
| `onSquareClick` | `(square) => void` | - | A press-and-release that did not orbit the camera |
| `onSquareHover` | `(square \| null) => void` | - | Hover changes |
| `onReady` | `() => void` | - | Called once, after the first frames are drawn |
| `showShadows` | `boolean` | `true` | Shadows |
| `devicePerformance` | `'low' \| 'medium' \| 'high'` | `'high'` | Quality preset (shadows, pixel ratio) |
| `enableAnimations` | `boolean` | `true` | Reserved; move animations are not wired in yet |

## Performance

- Piece geometries and per-colour materials are cached and shared by all pieces; coordinate label textures are cached
- Hover picking is throttled; a click is only registered if the pointer barely moved, so camera drags never select pieces
- `devicePerformance` scales shadows and pixel ratio

## Known limitations

- Local two-player only. `lib/multiplayer` has WebSocket/WebRTC helpers, but they are not connected to the game UI
- Pieces move instantly (no move animation yet)
- Insufficient-material handling on time-out is the simple version (see Chess clock)

## Testing

```bash
npm test
```

Covers coordinate and FEN utilities, the time-out rule, and component rendering (the 3D canvas is mocked, since jsdom has no WebGL).

## License

MIT
