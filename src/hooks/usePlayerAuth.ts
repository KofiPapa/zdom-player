import { useState, useEffect, useCallback } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../lib/firebase.ts";

const STORAGE_KEY_SCREEN_ID = "player_screenId";
const STORAGE_KEY_TOKEN = "player_customToken";

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
    const storedScreenId = localStorage.getItem(STORAGE_KEY_SCREEN_ID);
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);

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
          setIsPairing(true);
        });
    } else {
      setIsPairing(true);
    }
  }, []);

  const setCredentials = useCallback(
    async (newScreenId: string, token: string) => {
      await signInWithCustomToken(auth, token);
      localStorage.setItem(STORAGE_KEY_SCREEN_ID, newScreenId);
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      setScreenId(newScreenId);
      setIsAuthenticated(true);
      setIsPairing(false);
    },
    []
  );

  return { screenId, isAuthenticated, isPairing, setCredentials };
}
