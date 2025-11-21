/**
 * Game mode selector component
 */

'use client';

import { GameMode } from '@/lib/chess/gameState';

export interface GameModeSelectorProps {
  selected: GameMode;
  onChange: (mode: GameMode) => void;
}

export function GameModeSelector({ selected, onChange }: GameModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">Game Mode</label>
      <div className="flex gap-2">
        <button
          onClick={() => onChange('local')}
          className={`
            px-4 py-2 rounded transition-colors
            ${selected === 'local'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          Local (Hotseat)
        </button>
        <button
          onClick={() => onChange('online')}
          className={`
            px-4 py-2 rounded transition-colors
            ${selected === 'online'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          Online
        </button>
      </div>
    </div>
  );
}

