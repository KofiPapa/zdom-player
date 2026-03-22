import { useState, useEffect, useCallback, useRef } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase.ts";
import type {
  Playlist,
  PlaylistItem,
  Media,
  Template,
  Zone,
} from "@shared/types/firestore-schema.ts";

export interface ResolvedPlaylistItem extends PlaylistItem {
  mediaUrl?: string;
  mediaThumbnail?: string;
  mediaType?: "image" | "video" | "document";
  mimeType?: string;
  templateZones?: Zone[];
  templateName?: string;
}

interface UsePlaylistReturn {
  playlist: Playlist | null;
  resolvedItems: ResolvedPlaylistItem[];
  loading: boolean;
}

async function resolveItems(
  items: PlaylistItem[]
): Promise<ResolvedPlaylistItem[]> {
  return Promise.all(
    items
      .sort((a, b) => a.order - b.order)
      .map(async (item): Promise<ResolvedPlaylistItem> => {
        if (item.type === "media" && item.mediaId) {
          try {
            const mediaSnap = await getDoc(doc(db, "media", item.mediaId));
            if (mediaSnap.exists()) {
              const media = mediaSnap.data() as Media;
              return {
                ...item,
                mediaUrl: media.downloadUrl,
                mediaThumbnail: media.thumbnailUrl,
                mediaType: media.type,
                mimeType: media.mimeType,
              };
            }
          } catch (err) {
            console.error(`Failed to resolve media ${item.mediaId}:`, err);
          }
        }

        if (item.type === "template" && item.templateId) {
          try {
            const templateSnap = await getDoc(
              doc(db, "templates", item.templateId)
            );
            if (templateSnap.exists()) {
              const template = templateSnap.data() as Template;
              return {
                ...item,
                templateZones: template.zones,
                templateName: template.name,
              };
            }
          } catch (err) {
            console.error(
              `Failed to resolve template ${item.templateId}:`,
              err
            );
          }
        }

        return { ...item };
      })
  );
}

export function usePlaylist(playlistId: string | null): UsePlaylistReturn {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [resolvedItems, setResolvedItems] = useState<ResolvedPlaylistItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const resolvingRef = useRef(0);

  const resolveAndSet = useCallback(
    async (playlistData: Playlist) => {
      const version = ++resolvingRef.current;
      try {
        const resolved = await resolveItems(playlistData.items || []);
        // Only update if this is still the latest resolve call
        if (version === resolvingRef.current) {
          setResolvedItems(resolved);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to resolve playlist items:", err);
        if (version === resolvingRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!playlistId) {
      setPlaylist(null);
      setResolvedItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const playlistRef = doc(db, "playlists", playlistId);

    // Real-time listener — fires immediately with current data,
    // then again whenever the playlist document changes
    const unsubscribe = onSnapshot(
      playlistRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          setPlaylist(null);
          setResolvedItems([]);
          setLoading(false);
          return;
        }

        const playlistData = {
          id: snapshot.id,
          ...snapshot.data(),
        } as Playlist;

        setPlaylist(playlistData);
        await resolveAndSet(playlistData);
      },
      (error) => {
        console.error("Playlist listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [playlistId, resolveAndSet]);

  return { playlist, resolvedItems, loading };
}
