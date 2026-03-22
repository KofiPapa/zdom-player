import { useState, useEffect, useCallback } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../lib/firebase.ts";

const STORAGE_KEY_SCREEN_ID = "player_screenId";
const STORAGE_KEY_TOKEN = "player_customToken";

// ── Android Bridge Helpers ──────────────────────────────────────────
// When running inside the ZDOM Android WebView, the native app exposes
// a "Android" JavaScript interface (SignageJsBridge) with methods for
// persistent credential storage that survives WebView cache clears.

interface AndroidBridge {
  getScreenId(): string;
  getAuthToken(): string;
  setCredentials(screenId: string, token: string): void;
  clearCredentials(): void;
  isPaired(): boolean;
  setOrientation(orientation: string): void;
  getOrientation(): string;
  getDeviceInfo(): string;
  getPlatform(): string;
}

function getAndroidBridge(): AndroidBridge | null {
  return (window as unknown as { Android?: AndroidBridge }).Android ?? null;
}

function isAndroid(): boolean {
  return getAndroidBridge() !== null;
}

// Get stored credentials — prefer Android bridge, fall back to localStorage
function getStoredCredentials(): { screenId: string | null; token: string | null } {
  const bridge = getAndroidBridge();

  if (bridge) {
    const screenId = bridge.getScreenId();
    const token = bridge.getAuthToken();
    if (screenId && token) {
      return { screenId, token };
    }
  }

  // Also check URL params (for direct linking: ?screen=SCREEN_ID)
  const urlParams = new URLSearchParams(window.location.search);
  const urlScreenId = urlParams.get("screen");

  const screenId = urlScreenId || localStorage.getItem(STORAGE_KEY_SCREEN_ID);
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);

  return { screenId: screenId || null, token: token || null };
}

// ── Hook ────────────────────────────────────────────────────────────

interface UsePlayerAuthReturn {
  screenId: string | null;
  isAuthenticated: boolean;
  isPairing: boolean;
  setCredentials: (screenId: string, token: string) => Promise<void>;
}

export function usePlayerAuth(): UsePlayerAuthReturn {
  const [screenId, setScreenId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPairing, setIsPairing] = useState(true);

  useEffect(() => {
    const { screenId: storedScreenId, token: storedToken } = getStoredCredentials();

    if (storedScreenId && storedToken) {
      signInWithCustomToken(auth, storedToken)
        .then(() => {
          setScreenId(storedScreenId);
          setIsAuthenticated(true);
          setIsPairing(false);
        })
        .catch(() => {
          // Token expired or invalid — clear and show pairing
          localStorage.removeItem(STORAGE_KEY_SCREEN_ID);
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          const bridge = getAndroidBridge();
          if (bridge) bridge.clearCredentials();
          setIsPairing(true);
        });
    } else {
      setIsPairing(true);
    }
  }, []);

  const setCredentials = useCallback(
    async (newScreenId: string, token: string) => {
      // Authenticate with Firebase
      await signInWithCustomToken(auth, token);

      // Persist in localStorage (for web/browser)
      localStorage.setItem(STORAGE_KEY_SCREEN_ID, newScreenId);
      localStorage.setItem(STORAGE_KEY_TOKEN, token);

      // Persist in Android native storage (survives WebView cache clears)
      const bridge = getAndroidBridge();
      if (bridge) {
        bridge.setCredentials(newScreenId, token);
        console.log("[Android Bridge] Credentials stored for screen:", newScreenId);
      }

      setScreenId(newScreenId);
      setIsAuthenticated(true);
      setIsPairing(false);
    },
    []
  );

  return { screenId, isAuthenticated, isPairing, setCredentials };
}

// Export helper for other components that need to check platform
export { isAndroid, getAndroidBridge };
