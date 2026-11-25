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
    <div role="radiogroup" aria-label="Time control" className="grid grid-cols-3 gap-1.5">
      {presets.map((preset) => {
        const isSelected =
          preset.value.initialMinutes === selected.initialMinutes &&
          preset.value.incrementSeconds === selected.incrementSeconds;
        return (
          <button
            key={preset.name}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(preset.value)}
            disabled={disabled}
            className={`rounded-lg border px-1.5 py-1 text-[11px] leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50
              ${isSelected
                ? 'border-amber-400 bg-amber-400/15 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'}`}
          >
            <div className="font-semibold">{preset.name}</div>
            <div className="text-xs opacity-70">
              {preset.value.initialMinutes}+{preset.value.incrementSeconds}
            </div>
          </button>
        );
      })}
    </div>
  );
}
