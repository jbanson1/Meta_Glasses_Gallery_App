import { useState, useEffect, useCallback } from 'react';
import {
  connectToGlasses,
  disconnectGlasses,
  getGlassesState,
  onStateChange,
  type ConnectionStatus,
} from '../services/metaGlasses';

export function useGlassesConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [deviceName, setDeviceName] = useState<string | null>(null);

  useEffect(() => {
    const initial = getGlassesState();
    setStatus(initial.status);
    setDeviceName(initial.deviceName);

    const unsubscribe = onStateChange((state) => {
      setStatus(state.status);
      setDeviceName(state.deviceName);
    });

    return unsubscribe;
  }, []);

  const connect = useCallback(async () => {
    await connectToGlasses();
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectGlasses();
  }, []);

  return { status, deviceName, connect, disconnect };
}
