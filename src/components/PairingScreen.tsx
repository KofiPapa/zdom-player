import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase.ts";
import type { Screen } from "@shared/types/firestore-schema.ts";

interface PairingScreenProps {
  onPaired: (screenId: string, token: string) => void;
}

export function PairingScreen({ onPaired }: PairingScreenProps) {
  const [screenId, setScreenId] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  // Extract screen ID from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlScreenId = params.get("screen");
    if (urlScreenId) {
      setScreenId(urlScreenId);
    }
  }, []);

  // Listen for screen doc changes when we have a screenId
  useEffect(() => {
    if (!screenId) return;

    const screenRef = doc(db, "screens", screenId);
    const unsubscribe = onSnapshot(
      screenRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const screenData = snapshot.data() as Omit<Screen, "id">;
        setPairingCode(screenData.pairingCode ?? null);

        // Check if screen has been paired and has a customToken field
        if (screenData.isPaired) {
          const data = snapshot.data();
          if (data.customToken) {
            onPaired(screenId, data.customToken as string);
          }
        }
      },
      (error) => {
        console.error("Error listening to screen for pairing:", error);
      }
    );

    return () => unsubscribe();
  }, [screenId, onPaired]);

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-black">
      <div className="text-center">
        {screenId ? (
          <>
            {pairingCode ? (
              <>
                <p className="text-gray-400 text-xl mb-6 tracking-wide uppercase">
                  Pairing Code
                </p>
                <div className="text-white text-8xl font-mono font-bold tracking-[0.3em] mb-8">
                  {pairingCode}
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-400 text-xl mb-6 tracking-wide uppercase">
                  Screen ID
                </p>
                <div className="text-white text-4xl font-mono font-bold mb-8 break-all max-w-xl px-4">
                  {screenId}
                </div>
              </>
            )}

            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-gray-300 text-lg">Waiting for pairing...</p>
            </div>

            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
              Go to your dashboard and enter this code to pair this screen.
              The display will start automatically once paired.
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-2xl mb-6">
              No screen ID provided
            </p>
            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
              Add <code className="text-gray-300 bg-gray-800 px-2 py-1 rounded text-xs">?screen=SCREEN_ID</code> to
              the URL to connect this player to a screen.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
