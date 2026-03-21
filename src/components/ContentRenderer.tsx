import type { ResolvedPlaylistItem } from "../hooks/usePlaylist.ts";
import { MediaRenderer } from "./MediaRenderer.tsx";
import { ZoneRenderer } from "./ZoneRenderer.tsx";

interface ContentRendererProps {
  item: ResolvedPlaylistItem;
}

export function ContentRenderer({ item }: ContentRendererProps) {
  if (item.type === "media" && item.mediaUrl) {
    return (
      <div className="w-full h-full bg-black">
        <MediaRenderer
          url={item.mediaUrl}
          mimeType={item.mimeType}
          objectFit="contain"
        />
      </div>
    );
  }

  if (item.type === "template" && item.templateZones) {
    return (
      <div className="relative w-full h-full bg-black">
        {item.templateZones.map((zone) => (
          <ZoneRenderer key={zone.id} zone={zone} />
        ))}
      </div>
    );
  }

  // Fallback for unresolved items
  return (
    <div className="flex items-center justify-center w-full h-full bg-black text-gray-500 text-xl">
      Content unavailable
    </div>
  );
}
