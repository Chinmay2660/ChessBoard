/**
 * Time control selector component
 */

'use client';

import { TimeControl, TIME_CONTROLS } from '@/lib/chess/gameState';

export interface TimeControlSelectorProps {
  selected: TimeControl;
  onChange: (timeControl: TimeControl) => void;
  disabled?: boolean;
}

export function TimeControlSelector({ selected, onChange, disabled = false }: TimeControlSelectorProps) {
  const presets = [
    { name: 'Classical', value: TIME_CONTROLS.classical },
    { name: 'Rapid', value: TIME_CONTROLS.rapid },
    { name: 'Blitz', value: TIME_CONTROLS.blitz },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">Time Control</label>
      <div className="flex gap-2">
        {presets.map((preset) => {
          const isSelected =
            preset.value.initialMinutes === selected.initialMinutes &&
            preset.value.incrementSeconds === selected.incrementSeconds;

          return (
            <button
              key={preset.name}
              onClick={() => onChange(preset.value)}
              disabled={disabled}
              className={`
                px-4 py-2 rounded transition-colors
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {preset.name}
              <div className="text-xs opacity-75">
                {preset.value.initialMinutes}+{preset.value.incrementSeconds}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

