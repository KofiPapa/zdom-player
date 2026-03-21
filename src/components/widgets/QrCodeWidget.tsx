interface QrCodeWidgetProps {
  config?: Record<string, unknown>;
}

export function QrCodeWidget({ config }: QrCodeWidgetProps) {
  const data = (config?.data as string) ?? "";
  const size = (config?.size as number) ?? 200;
  const foreground = (config?.foreground as string) ?? "#000000";
  const background = (config?.background as string) ?? "#ffffff";

  if (!data) {
    return (
      <div className="flex items-center justify-center w-full h-full text-white text-lg">
        QR Code Widget — no data configured
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div
        className="rounded-xl flex items-center justify-center p-6"
        style={{ backgroundColor: background, width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          width={size - 48}
          height={size - 48}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Simplified QR-code-like pattern as placeholder */}
          {/* Top-left finder */}
          <rect x="0" y="0" width="30" height="30" fill={foreground} />
          <rect x="5" y="5" width="20" height="20" fill={background} />
          <rect x="10" y="10" width="10" height="10" fill={foreground} />

          {/* Top-right finder */}
          <rect x="70" y="0" width="30" height="30" fill={foreground} />
          <rect x="75" y="5" width="20" height="20" fill={background} />
          <rect x="80" y="10" width="10" height="10" fill={foreground} />

          {/* Bottom-left finder */}
          <rect x="0" y="70" width="30" height="30" fill={foreground} />
          <rect x="5" y="75" width="20" height="20" fill={background} />
          <rect x="10" y="80" width="10" height="10" fill={foreground} />

          {/* Data area placeholder pattern */}
          <rect x="40" y="5" width="5" height="5" fill={foreground} />
          <rect x="50" y="5" width="5" height="5" fill={foreground} />
          <rect x="40" y="15" width="5" height="5" fill={foreground} />
          <rect x="55" y="15" width="5" height="5" fill={foreground} />
          <rect x="35" y="35" width="5" height="5" fill={foreground} />
          <rect x="45" y="40" width="5" height="5" fill={foreground} />
          <rect x="55" y="45" width="5" height="5" fill={foreground} />
          <rect x="65" y="35" width="5" height="5" fill={foreground} />
          <rect x="40" y="55" width="5" height="5" fill={foreground} />
          <rect x="50" y="60" width="5" height="5" fill={foreground} />
          <rect x="60" y="55" width="5" height="5" fill={foreground} />
          <rect x="45" y="50" width="5" height="5" fill={foreground} />
          <rect x="75" y="40" width="5" height="5" fill={foreground} />
          <rect x="85" y="50" width="5" height="5" fill={foreground} />
          <rect x="70" y="55" width="5" height="5" fill={foreground} />
          <rect x="80" y="65" width="5" height="5" fill={foreground} />
          <rect x="90" y="75" width="5" height="5" fill={foreground} />
          <rect x="75" y="85" width="5" height="5" fill={foreground} />
          <rect x="85" y="90" width="5" height="5" fill={foreground} />
          <rect x="50" y="75" width="5" height="5" fill={foreground} />
          <rect x="60" y="85" width="5" height="5" fill={foreground} />
          <rect x="45" y="90" width="5" height="5" fill={foreground} />
        </svg>
      </div>
      <div className="text-xs text-gray-400 mt-3 max-w-[200px] text-center truncate">
        {data}
      </div>
    </div>
  );
}
