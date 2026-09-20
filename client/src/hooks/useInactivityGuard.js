import { useState, useEffect, useRef, useCallback } from 'react';

const TWENTY_MINUTES_MS = 20 * 60 * 1000;

export function useInactivityGuard(isAuthenticated, onLock) {
  const [isLocked, setIsLocked] = useState(false);
  const lastActiveRef = useRef(Date.now());
  const timerRef = useRef(null);

  const registerActivity = useCallback(() => {
    if (!isLocked) {
      lastActiveRef.current = Date.now();
    }
  }, [isLocked]);

  const lockApp = useCallback(() => {
    setIsLocked(true);
    if (onLock) onLock();
  }, [onLock]);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
    lastActiveRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Events to monitor activity
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handleEvent = () => registerActivity();

    events.forEach(e => window.addEventListener(e, handleEvent, { passive: true }));

    // Periodic check for 20 minutes inactivity
    timerRef.current = setInterval(() => {
      if (!isLocked && Date.now() - lastActiveRef.current >= TWENTY_MINUTES_MS) {
        console.log('[Inactivity Guard] 20 minutes of inactivity detected. Locking application.');
        lockApp();
      }
    }, 10000); // check every 10 seconds

    // Also check on tab refocus if user switched apps for >20 mins
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (!isLocked && Date.now() - lastActiveRef.current >= TWENTY_MINUTES_MS) {
          lockApp();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleEvent));
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, isLocked, registerActivity, lockApp]);

  return {
    isLocked,
    lockApp,
    unlockApp,
    lastActive: lastActiveRef.current
  };
}
