import { useState, useEffect } from "react";

interface WebpageWidgetProps {
  config?: Record<string, unknown>;
}

export function WebpageWidget({ config }: WebpageWidgetProps) {
  const url = (config?.url as string) ?? "";
  const refreshMinutes = (config?.refreshMinutes as number) ?? 0;
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (refreshMinutes > 0) {
      const interval = setInterval(
        () => setRefreshKey((k) => k + 1),
        refreshMinutes * 60 * 1000
      );
      return () => clearInterval(interval);
    }
  }, [refreshMinutes]);

  if (!url) {
    return (
      <div className="flex items-center justify-center w-full h-full text-white text-lg">
        Webpage Widget — no URL configured
      </div>
    );
  }

  return (
    <iframe
      key={refreshKey}
      className="w-full h-full border-0"
      src={url}
      title="Embedded Webpage"
      sandbox="allow-scripts allow-same-origin allow-popups"
    />
  );
}
