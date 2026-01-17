'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Wake Lock Hook
 * 
 * Keeps the screen on during Cook Mode to prevent auto-lock
 * 
 * Features:
 * - Requests wake lock when enabled
 * - Releases wake lock when disabled or component unmounts
 * - Handles visibility change (re-acquires lock when tab becomes visible)
 * - Graceful error handling (not all browsers support wake lock)
 * 
 * Browser support:
 * - Chrome/Edge 84+
 * - Safari 16.4+
 * - Firefox (behind flag)
 * 
 * Usage:
 * ```tsx
 * const { isSupported, isActive, error } = useWakeLock(isEnabled);
 * ```
 */
export function useWakeLock(enabled: boolean) {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is supported
    if ('wakeLock' in navigator) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      setError('Wake Lock API is not supported in this browser');
    }
  }, []);

  useEffect(() => {
    if (!isSupported || !enabled) {
      // Release wake lock if disabled
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
          setIsActive(false);
        });
      }
      return;
    }

    // Request wake lock
    const requestWakeLock = async () => {
      try {
        const wakeLock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = wakeLock;
        setIsActive(true);
        setError(null);

        // Handle wake lock release (e.g., when tab is not visible)
        wakeLock.addEventListener('release', () => {
          setIsActive(false);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to request wake lock');
        setIsActive(false);
      }
    };

    requestWakeLock();

    // Re-acquire wake lock when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
          setIsActive(false);
        });
      }
    };
  }, [isSupported, enabled]);

  return {
    /** Whether Wake Lock API is supported in this browser */
    isSupported,
    
    /** Whether wake lock is currently active */
    isActive,
    
    /** Error message if wake lock failed */
    error,
  };
}
