interface RssWidgetProps {
  config?: Record<string, unknown>;
}

const MOCK_RSS_ITEMS = [
  {
    title: "New ZDOM Features Released",
    description: "Our platform now supports more widget types including RSS feeds, countdowns, and social media embeds.",
    date: "2 hours ago",
  },
  {
    title: "Best Practices for Lobby Displays",
    description: "Learn how to create engaging digital signage content for corporate lobbies and waiting areas.",
    date: "5 hours ago",
  },
  {
    title: "Industry Report: Digital Signage Growth in 2026",
    description: "Market analysts predict continued expansion in the digital signage sector driven by AI integration.",
    date: "1 day ago",
  },
  {
    title: "How to Optimize Content for Portrait Displays",
    description: "Tips and tricks for designing vertical content that captures attention in retail environments.",
    date: "2 days ago",
  },
  {
    title: "Customer Spotlight: Metro Transit Authority",
    description: "See how Metro Transit uses digital signage to keep passengers informed across 200+ stations.",
    date: "3 days ago",
  },
];

export function RssWidget({ config }: RssWidgetProps) {
  const feedUrl = (config?.feedUrl as string) ?? "";
  const maxItems = (config?.maxItems as number) ?? 5;
  const layout = (config?.layout as string) ?? "list";

  const items = MOCK_RSS_ITEMS.slice(0, maxItems);

  if (layout === "grid") {
    return (
      <div className="flex flex-col w-full h-full text-white p-4 overflow-hidden">
        <div className="text-xs text-gray-500 mb-2 truncate">
          {feedUrl || "No feed URL configured"}
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
          {items.map((item, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-3 overflow-hidden">
              <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                {item.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {item.description}
              </p>
              <span className="text-xs text-gray-500 mt-1 block">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full text-white p-4 overflow-hidden">
      <div className="text-xs text-gray-500 mb-2 truncate">
        {feedUrl || "No feed URL configured"}
      </div>
      <div className="flex-1 space-y-3 overflow-auto">
        {items.map((item, i) => (
          <div key={i} className="border-b border-white/10 pb-3 last:border-0">
            <h3 className="text-sm font-semibold leading-tight">{item.title}</h3>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {item.description}
            </p>
            <span className="text-xs text-gray-500 mt-1 block">{item.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
