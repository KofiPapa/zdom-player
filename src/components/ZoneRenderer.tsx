import type { Zone } from "@shared/types/firestore-schema.ts";
import { MediaRenderer } from "./MediaRenderer.tsx";
import { TextRenderer } from "./TextRenderer.tsx";
import { WidgetRenderer } from "./WidgetRenderer.tsx";

interface ZoneRendererProps {
  zone: Zone;
}

export function ZoneRenderer({ zone }: ZoneRendererProps) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${zone.x}%`,
    top: `${zone.y}%`,
    width: `${zone.width}%`,
    height: `${zone.height}%`,
    zIndex: zone.zIndex,
    backgroundColor: zone.backgroundColor ?? "transparent",
    borderRadius: zone.borderRadius ? `${zone.borderRadius}px` : undefined,
    opacity: zone.opacity ?? 1,
    overflow: "hidden",
  };

  return (
    <div style={style}>
      {zone.type === "media" && zone.content.mediaUrl && (
        <MediaRenderer
          url={zone.content.mediaUrl}
          mimeType={
            zone.content.mediaUrl?.endsWith(".mp4")
              ? "video/mp4"
              : "image/jpeg"
          }
          objectFit={zone.content.objectFit ?? "cover"}
        />
      )}

      {zone.type === "text" && zone.content.text && zone.content.textStyle && (
        <TextRenderer text={zone.content.text} style={zone.content.textStyle} />
      )}

      {zone.type === "widget" && zone.content.widgetType && (
        <WidgetRenderer
          widgetType={zone.content.widgetType}
          config={zone.content.widgetConfig}
        />
      )}
    </div>
  );
}
