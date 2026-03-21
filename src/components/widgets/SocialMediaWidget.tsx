interface SocialMediaWidgetProps {
  config?: Record<string, unknown>;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  tiktok: "#000000",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "X / Twitter",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export function SocialMediaWidget({ config }: SocialMediaWidgetProps) {
  const platform = (config?.platform as string) ?? "instagram";
  const embedUrl = (config?.embedUrl as string) ?? "";

  const color = PLATFORM_COLORS[platform] ?? "#888";
  const label = PLATFORM_LABELS[platform] ?? platform;

  if (embedUrl) {
    return (
      <iframe
        className="w-full h-full border-0"
        src={embedUrl}
        title={`${label} Embed`}
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-white">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4"
        style={{ backgroundColor: color }}
      >
        {label.charAt(0)}
      </div>
      <div className="text-xl font-semibold">{label}</div>
      <div className="text-sm text-gray-400 mt-2">
        Social Media Widget — configure an embed URL to display content
      </div>
    </div>
  );
}
