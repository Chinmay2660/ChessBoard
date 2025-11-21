/**
 * FIDE-style chess clock component
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TimeControl } from '@/lib/chess/gameState';

export interface ChessClockProps {
  timeControl: TimeControl;
  isActive: boolean;
  onTimeUp: () => void;
  onMoveComplete?: () => void;
  color: 'white' | 'black';
}

export function ChessClock({
  timeControl,
  isActive,
  onTimeUp,
  onMoveComplete,
  color,
}: ChessClockProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeControl.initialMinutes * 60 * 1000);
  const [isLowTime, setIsLowTime] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - (startTimeRef.current || Date.now());
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - elapsed);
          startTimeRef.current = Date.now();
          
          if (newTime === 0) {
            onTimeUp();
            return 0;
          }
          
          return newTime;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (startTimeRef.current && isActive === false) {
        // Add increment when move completes
        if (onMoveComplete) {
          setTimeRemaining((prev) => prev + timeControl.incrementSeconds * 1000);
        }
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeControl.incrementSeconds, onTimeUp, onMoveComplete]);

  useEffect(() => {
    setIsLowTime(timeRemaining < 60000); // Less than 1 minute
  }, [timeRemaining]);

  const formatTime = useCallback((ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${totalSeconds}s`;
    }
  }, []);

  const bgColor = color === 'white' ? 'bg-white' : 'bg-gray-900';
  const textColor = color === 'white' ? 'text-gray-900' : 'text-white';
  const activeBorder = isActive ? 'ring-4 ring-blue-500' : '';
  const lowTimeClass = isLowTime ? 'animate-pulse text-red-500' : '';

  return (
    <div
      className={`
        ${bgColor} ${textColor} ${activeBorder} ${lowTimeClass}
        px-6 py-4 rounded-lg shadow-lg font-mono text-2xl font-bold
        transition-all duration-200
      `}
    >
      <div className="text-sm opacity-75 mb-1 uppercase">{color}</div>
      <div className="text-4xl">{formatTime(timeRemaining)}</div>
    </div>
  );
}

