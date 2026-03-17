/**
 * Meta Glasses connection service.
 * Abstracted to allow swapping Meta SDK when Orion launches.
 *
 * Current approach: Ray-Ban Meta glasses send images to the
 * Meta View app on the phone, which can share with our app.
 * This module handles that integration path.
 */

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface GlassesState {
  status: ConnectionStatus;
  deviceName: string | null;
  batteryLevel: number | null;
}

let state: GlassesState = {
  status: 'disconnected',
  deviceName: null,
  batteryLevel: null,
};

type Listener = (state: GlassesState) => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...state }));
}

/**
 * Attempt to connect to Meta glasses.
 * Currently simulated — will use Meta SDK when available.
 */
export async function connectToGlasses(): Promise<GlassesState> {
  state = { ...state, status: 'connecting' };
  notifyListeners();

  // TODO: Replace with actual Meta SDK connection
  // For now, we rely on the Meta View app sharing images to our app
  return new Promise((resolve) => {
    setTimeout(() => {
      state = {
        status: 'connected',
        deviceName: 'Ray-Ban Meta',
        batteryLevel: null, // Not available without SDK
      };
      notifyListeners();
      resolve({ ...state });
    }, 1000);
  });
}

export async function disconnectGlasses(): Promise<void> {
  state = { status: 'disconnected', deviceName: null, batteryLevel: null };
  notifyListeners();
}

export function getGlassesState(): GlassesState {
  return { ...state };
}

export function onStateChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
