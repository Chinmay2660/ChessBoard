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
  initialTime?: number;
  onTimeChange?: (time: number) => void;
}

export function ChessClock({
  timeControl,
  isActive,
  onTimeUp,
  onMoveComplete,
  color,
  initialTime,
  onTimeChange,
}: ChessClockProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime || timeControl.initialMinutes * 60 * 1000);
  const [isLowTime, setIsLowTime] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const wasActiveRef = useRef(false);

  // Update time when initialTime changes
  useEffect(() => {
    if (initialTime !== undefined) {
      setTimeRemaining(initialTime);
    }
  }, [initialTime]);

  useEffect(() => {
    if (isActive) {
      if (!wasActiveRef.current) {
        // Just became active - start timer
        startTimeRef.current = Date.now();
      }
      wasActiveRef.current = true;
      
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - (startTimeRef.current || now);
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - elapsed);
          startTimeRef.current = now;
          
          if (onTimeChange) {
            onTimeChange(newTime);
          }
          
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
      
      // Add increment when move completes (clock stops)
      if (wasActiveRef.current && onMoveComplete) {
        setTimeRemaining((prev) => {
          const newTime = prev + timeControl.incrementSeconds * 1000;
          if (onTimeChange) {
            onTimeChange(newTime);
          }
          return newTime;
        });
        onMoveComplete();
      }
      
      wasActiveRef.current = false;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeControl.incrementSeconds, onTimeUp, onMoveComplete, onTimeChange]);

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

