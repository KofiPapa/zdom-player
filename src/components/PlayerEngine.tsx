import { useState, useEffect, useRef, useCallback } from "react";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase.ts";
import { usePlaylist } from "../hooks/usePlaylist.ts";
import { useCommands } from "../hooks/useCommands.ts";
import { ContentRenderer } from "./ContentRenderer.tsx";
import { TransitionWrapper } from "./TransitionWrapper.tsx";
import { StatusOverlay } from "./StatusOverlay.tsx";
import { LoadingScreen } from "./LoadingScreen.tsx";
import type { Screen } from "@shared/types/firestore-schema.ts";

interface PlayerEngineProps {
  screen: Screen;
}

export function PlayerEngine({ screen }: PlayerEngineProps) {
  const playlistId = screen.currentPlaylistId;
  const { resolvedItems, loading } = usePlaylist(playlistId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlistVersion, setPlaylistVersion] = useState(0);
  const itemStartRef = useRef<Date>(new Date());
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Command handlers
  const handleRefresh = useCallback(() => {
    setPlaylistVersion((v) => v + 1);
  }, []);

  const handleUpdateContent = useCallback(() => {
    setPlaylistVersion((v) => v + 1);
    setCurrentIndex(0);
  }, []);

  useCommands(screen.id, {
    onRefresh: handleRefresh,
    onUpdateContent: handleUpdateContent,
  });

  // Reset index when playlist changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [playlistId, playlistVersion]);

  // Clamp index if items were removed and current index is out of bounds
  useEffect(() => {
    if (resolvedItems.length > 0 && currentIndex >= resolvedItems.length) {
      setCurrentIndex(0);
    }
  }, [resolvedItems, currentIndex]);

  // Cycle through items based on duration
  useEffect(() => {
    if (resolvedItems.length === 0) return;

    const currentItem = resolvedItems[currentIndex % resolvedItems.length];
    if (!currentItem) return;

    itemStartRef.current = new Date();
    const durationMs = (currentItem.duration || 10) * 1000;

    const timer = setTimeout(() => {
      // Log the play
      logPlay(screen, currentItem.id, currentItem.mediaId ?? null, currentItem.templateId ?? null, currentItem.duration || 10);

      // Advance to next item (loop)
      setCurrentIndex((prev) => (prev + 1) % resolvedItems.length);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [currentIndex, resolvedItems, screen]);

  // Heartbeat every 60 seconds
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const screenRef = doc(db, "screens", screen.id);
        await updateDoc(screenRef, {
          lastHeartbeat: serverTimestamp(),
          status: "online",
        });
      } catch (err) {
        console.error("Heartbeat failed:", err);
      }
    };

    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, 60_000);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [screen.id]);

  if (loading) {
    return <LoadingScreen message="Loading playlist..." />;
  }

  if (!playlistId) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black">
        <p className="text-gray-500 text-2xl">No playlist assigned</p>
      </div>
    );
  }

  if (resolvedItems.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black">
        <p className="text-gray-500 text-2xl">Playlist is empty</p>
      </div>
    );
  }

  const currentItem = resolvedItems[currentIndex % resolvedItems.length];
  if (!currentItem) return null;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <TransitionWrapper
        transitionType={currentItem.transition}
        itemKey={`${currentItem.id}-${currentIndex}`}
      >
        <ContentRenderer item={currentItem} />
      </TransitionWrapper>
      <StatusOverlay />
    </div>
  );
}

async function logPlay(
  screen: Screen,
  itemId: string,
  mediaId: string | null,
  templateId: string | null,
  duration: number
) {
  try {
    const now = Timestamp.now();
    await addDoc(collection(db, "playLogs"), {
      organizationId: screen.organizationId,
      screenId: screen.id,
      playlistId: screen.currentPlaylistId,
      itemId,
      mediaId,
      templateId,
      startedAt: new Timestamp(
        now.seconds - duration,
        now.nanoseconds
      ),
      endedAt: now,
      duration,
    });
  } catch (err) {
    console.error("Failed to log play:", err);
  }
}
