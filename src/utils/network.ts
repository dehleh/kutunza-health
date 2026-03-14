/**
 * Network utilities for KutunzaCare
 * Provides offline detection using a lightweight ping approach
 * (avoids adding @react-native-community/netinfo dependency)
 */

import { useState, useEffect, useCallback } from 'react';

// Simple connectivity check by pinging a reliable endpoint
async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

/**
 * Hook that tracks network connectivity.
 * Checks on mount and every 30s if offline.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    setIsChecking(true);
    const online = await checkConnectivity();
    setIsOnline(online);
    setIsChecking(false);
    return online;
  }, []);

  useEffect(() => {
    check();
    // Poll every 30s when offline so we recover automatically
    const interval = setInterval(() => {
      if (!isOnline) check();
    }, 30_000);
    return () => clearInterval(interval);
  }, [isOnline, check]);

  return { isOnline, isChecking, recheckNow: check };
}
