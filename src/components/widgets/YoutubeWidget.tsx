interface YoutubeWidgetProps {
  config?: Record<string, unknown>;
}

export function YoutubeWidget({ config }: YoutubeWidgetProps) {
  const videoId = (config?.videoId as string) ?? "";
  const autoplay = (config?.autoplay as boolean) ?? true;
  const mute = (config?.mute as boolean) ?? true;
  const loop = (config?.loop as boolean) ?? true;

  if (!videoId) {
    return (
      <div className="flex items-center justify-center w-full h-full text-white text-lg">
        YouTube Widget — no video ID configured
      </div>
    );
  }

  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "1");
  if (mute) params.set("mute", "1");
  if (loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }
  params.set("controls", "0");
  params.set("modestbranding", "1");
  params.set("rel", "0");

  return (
    <iframe
      className="w-full h-full border-0"
      src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
      allow="autoplay; encrypted-media"
      allowFullScreen
      title="YouTube Video"
    />
  );
}
