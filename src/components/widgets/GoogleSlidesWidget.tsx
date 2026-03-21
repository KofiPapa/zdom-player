interface GoogleSlidesWidgetProps {
  config?: Record<string, unknown>;
}

export function GoogleSlidesWidget({ config }: GoogleSlidesWidgetProps) {
  const presentationId = (config?.presentationId as string) ?? "";
  const autoAdvance = (config?.autoAdvance as boolean) ?? true;
  const intervalSeconds = (config?.intervalSeconds as number) ?? 10;

  if (!presentationId) {
    return (
      <div className="flex items-center justify-center w-full h-full text-white text-lg">
        Google Slides Widget — no presentation ID configured
      </div>
    );
  }

  const params = new URLSearchParams();
  params.set("rm", "minimal");
  if (autoAdvance) {
    params.set("start", "true");
    params.set("delayms", String(intervalSeconds * 1000));
  }
  params.set("loop", "true");

  return (
    <iframe
      className="w-full h-full border-0"
      src={`https://docs.google.com/presentation/d/${presentationId}/embed?${params.toString()}`}
      allow="autoplay"
      allowFullScreen
      title="Google Slides Presentation"
    />
  );
}
