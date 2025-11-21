# Quick Start Guide

## Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the demo.

## Basic Usage

```tsx
import { Chessboard } from '@/components/Chessboard/Chessboard';

function MyPage() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Chessboard
        size={8}
        theme="classic"
        onPieceMove={(from, to) => console.log(`${from} → ${to}`)}
      />
    </div>
  );
}
```

## Key Features

- **3D Rendering**: Low-poly chess pieces with Three.js
- **Interactive**: Click/drag pieces, orbit camera
- **Customizable**: Themes, board sizes, animations
- **Performance**: Device performance presets
- **Accessible**: Keyboard navigation support

## Project Structure

- `components/Chessboard/` - Main chessboard component and subcomponents
- `lib/three-hooks/` - Custom Three.js hooks
- `utils/chess/` - Chess utilities (coordinates, FEN)
- `app/page.tsx` - Demo page with controls

## Testing

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

## Building

```bash
pnpm build
pnpm start
```

