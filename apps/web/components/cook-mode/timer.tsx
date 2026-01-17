'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatTimerDisplay } from '@/types/cook-mode';
import type { TimerProps } from '@/types/cook-mode';

/**
 * Timer Component
 * 
 * Single timer for cooking steps with:
 * - Start / Pause / Reset controls
 * - Large, readable display (MM:SS)
 * - Visual feedback when running
 * - Background timer (continues when app is backgrounded)
 * - Completion callback
 * 
 * Design principles:
 * - Large touch targets (48x48px)
 * - High contrast
 * - Clear state indication
 * - No multi-timer (MVP constraint)
 */
export function Timer({
  timerState,
  onStart,
  onPause,
  onReset,
  onComplete,
}: TimerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle timer countdown
  useEffect(() => {
    if (timerState.isRunning && timerState.remaining > 0) {
      intervalRef.current = setInterval(() => {
        // Timer logic is handled by parent component
        // This effect is just for triggering re-renders
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [timerState.isRunning, timerState.remaining]);

  // Handle timer completion
  useEffect(() => {
    if (timerState.remaining === 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.();
    } else if (timerState.remaining > 0) {
      hasCompletedRef.current = false;
    }
  }, [timerState.remaining, onComplete]);

  const isCompleted = timerState.remaining === 0;
  const isRunning = timerState.isRunning;
  const displayTime = formatTimerDisplay(timerState.remaining);

  return (
    <Card className={`w-full max-w-md border-2 transition-all ${
      isCompleted 
        ? 'border-green-500 bg-green-50 dark:bg-green-950' 
        : isRunning 
        ? 'border-primary bg-primary/5 animate-pulse' 
        : 'border-border bg-surface'
    }`}>
      <CardContent className="p-6 space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className={`text-6xl md:text-7xl font-mono font-bold tabular-nums ${
            isCompleted 
              ? 'text-green-600 dark:text-green-400' 
              : isRunning 
              ? 'text-primary' 
              : 'text-foreground'
          }`}>
            {displayTime}
          </div>
          
          {/* Status Text */}
          <div className="mt-2 text-sm font-medium text-muted-foreground">
            {isCompleted ? (
              <span className="text-green-600 dark:text-green-400">
                ✓ Time's up!
              </span>
            ) : isRunning ? (
              <span className="text-primary">
                Timer running...
              </span>
            ) : (
              <span>
                Ready to start
              </span>
            )}
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex gap-3">
          {!isRunning && !isCompleted && (
            <>
              {/* Start Button */}
              <Button
                onClick={onStart}
                size="lg"
                className="flex-1 h-14 text-base font-semibold"
              >
                ▶ Start Timer
              </Button>
              
              {/* Reset Button (only if time has changed) */}
              {timerState.remaining !== timerState.duration && (
                <Button
                  onClick={onReset}
                  variant="outline"
                  size="lg"
                  className="h-14 px-6"
                >
                  ↻
                </Button>
              )}
            </>
          )}

          {isRunning && (
            <>
              {/* Pause Button */}
              <Button
                onClick={onPause}
                variant="outline"
                size="lg"
                className="flex-1 h-14 text-base font-semibold"
              >
                ⏸ Pause
              </Button>
              
              {/* Reset Button */}
              <Button
                onClick={onReset}
                variant="outline"
                size="lg"
                className="h-14 px-6"
              >
                ↻
              </Button>
            </>
          )}

          {isCompleted && (
            <>
              {/* Reset Button (full width when completed) */}
              <Button
                onClick={onReset}
                size="lg"
                className="flex-1 h-14 text-base font-semibold"
              >
                ↻ Reset Timer
              </Button>
            </>
          )}
        </div>

        {/* Helper Text */}
        {!isRunning && !isCompleted && (
          <p className="text-xs text-center text-muted-foreground">
            Timer will run in the background
          </p>
        )}
      </CardContent>
    </Card>
  );
}
