import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase.ts";
import type { Screen } from "@shared/types/firestore-schema.ts";

interface UseScreenConfigReturn {
  screen: Screen | null;
  loading: boolean;
}

export function useScreenConfig(screenId: string | null): UseScreenConfigReturn {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!screenId) {
      setLoading(false);
      return;
    }

    const screenRef = doc(db, "screens", screenId);
    const unsubscribe = onSnapshot(
      screenRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setScreen({ id: snapshot.id, ...snapshot.data() } as Screen);
        } else {
          setScreen(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to screen config:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [screenId]);

  return { screen, loading };
}
