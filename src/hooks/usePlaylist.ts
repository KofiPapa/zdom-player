import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
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

export function usePlaylist(playlistId: string | null): UsePlaylistReturn {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [resolvedItems, setResolvedItems] = useState<ResolvedPlaylistItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playlistId) {
      setPlaylist(null);
      setResolvedItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPlaylist() {
      setLoading(true);
      try {
        const playlistRef = doc(db, "playlists", playlistId!);
        const playlistSnap = await getDoc(playlistRef);

        if (!playlistSnap.exists() || cancelled) {
          setPlaylist(null);
          setResolvedItems([]);
          setLoading(false);
          return;
        }

        const playlistData = {
          id: playlistSnap.id,
          ...playlistSnap.data(),
        } as Playlist;
        setPlaylist(playlistData);

        // Resolve each item's media/template URLs
        const resolved = await Promise.all(
          playlistData.items
            .sort((a, b) => a.order - b.order)
            .map(async (item): Promise<ResolvedPlaylistItem> => {
              if (item.type === "media" && item.mediaId) {
                try {
                  const mediaRef = doc(db, "media", item.mediaId);
                  const mediaSnap = await getDoc(mediaRef);
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
                  console.error(
                    `Failed to resolve media ${item.mediaId}:`,
                    err
                  );
                }
              }

              if (item.type === "template" && item.templateId) {
                try {
                  const templateRef = doc(db, "templates", item.templateId);
                  const templateSnap = await getDoc(templateRef);
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

        if (!cancelled) {
          setResolvedItems(resolved);
        }
      } catch (err) {
        console.error("Failed to fetch playlist:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPlaylist();
    return () => {
      cancelled = true;
    };
  }, [playlistId]);

  return { playlist, resolvedItems, loading };
}
