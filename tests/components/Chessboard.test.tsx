import { render, screen } from '@testing-library/react';
import { Chessboard } from '@/components/Chessboard/Chessboard';

// Mock react-three/fiber
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useThree: () => ({
    scene: {},
    camera: {},
    gl: { domElement: document.createElement('canvas') },
  }),
  useFrame: () => {},
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  PerspectiveCamera: () => <div data-testid="perspective-camera" />,
}));


// Mock scene internals that need a real WebGL context
jest.mock('@/lib/three-hooks', () => ({
  useSceneSetup: () => {},
  usePointerEvents: () => ({ handlePointerDown: jest.fn(), handlePointerMove: jest.fn(), handlePointerUp: jest.fn() }),
  usePieceAnimations: () => ({ animate: jest.fn(), isAnimating: () => false }),
}));
jest.mock('@/components/Chessboard/BoardMesh', () => ({ BoardMesh: () => null }));
jest.mock('@/components/Chessboard/controls/CameraControls', () => ({ CameraControls: () => null }));
jest.mock('@/components/Chessboard/controls/MovePreview', () => ({ MovePreview: () => null }));
jest.mock('@/components/Chessboard/Pieces', () => {
  const P = () => null;
  return { King: P, Queen: P, Rook: P, Bishop: P, Knight: P, Pawn: P };
});

describe('Chessboard component', () => {
  it('should render without crashing', () => {
    render(<Chessboard />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('should accept size prop', () => {
    const { container } = render(<Chessboard size={10} />);
    expect(container).toBeTruthy();
  });

  it('should accept theme prop', () => {
    const { container } = render(<Chessboard theme="dark" />);
    expect(container).toBeTruthy();
  });

  it('should accept custom theme colors', () => {
    const { container } = render(
      <Chessboard theme={{ light: '#ffffff', dark: '#000000' }} />
    );
    expect(container).toBeTruthy();
  });
});

