import { useState, useEffect } from "react";

interface ClockWidgetProps {
  config?: Record<string, unknown>;
}

export function ClockWidget({ config }: ClockWidgetProps) {
  const [now, setNow] = useState(new Date());
  const format24h = (config?.format24h as boolean) ?? false;
  const showSeconds = (config?.showSeconds as boolean) ?? true;
  const timezone = (config?.timezone as string) ?? undefined;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...(showSeconds && { second: "2-digit" }),
    hour12: !format24h,
    ...(timezone && { timeZone: timezone }),
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(timezone && { timeZone: timezone }),
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-white">
      <div className="text-6xl font-mono font-bold tracking-wider">
        {now.toLocaleTimeString(undefined, timeOptions)}
      </div>
      <div className="text-xl text-gray-300 mt-3">
        {now.toLocaleDateString(undefined, dateOptions)}
      </div>
    </div>
  );
}
