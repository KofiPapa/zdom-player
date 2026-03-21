interface TickerWidgetProps {
  config?: Record<string, unknown>;
}

export function TickerWidget({ config }: TickerWidgetProps) {
  const text = (config?.text as string) ?? "Breaking News: Welcome to ZDOM";
  const speed = (config?.speed as number) ?? 50;
  const color = (config?.color as string) ?? "#ffffff";
  const bgColor = (config?.backgroundColor as string) ?? "transparent";
  const fontSize = (config?.fontSize as number) ?? 24;

  const duration = Math.max(5, 200 / speed);

  return (
    <div
      className="flex items-center w-full h-full overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="whitespace-nowrap"
        style={{
          color,
          fontSize: `${fontSize}px`,
          animation: `ticker-scroll-left ${duration}s linear infinite`,
        }}
      >
        {text}
      </div>
    </div>
  );
}
