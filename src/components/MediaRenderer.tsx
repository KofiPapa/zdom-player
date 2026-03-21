interface MediaRendererProps {
  url: string;
  mimeType?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
}

export function MediaRenderer({
  url,
  mimeType,
  objectFit = "cover",
}: MediaRendererProps) {
  const isVideo = mimeType?.startsWith("video/");

  if (isVideo) {
    return (
      <video
        src={url}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full"
        style={{ objectFit }}
      />
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="w-full h-full"
      style={{ objectFit }}
      draggable={false}
    />
  );
}
