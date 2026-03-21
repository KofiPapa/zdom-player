import { useState, useEffect } from "react";

interface CountdownWidgetProps {
  config?: Record<string, unknown>;
}

function computeTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export function CountdownWidget({ config }: CountdownWidgetProps) {
  const targetDate = (config?.targetDate as string) ?? "";
  const title = (config?.title as string) ?? "Countdown";
  const expiredMessage = (config?.expiredMessage as string) ?? "Event has started!";

  const [timeLeft, setTimeLeft] = useState(() =>
    targetDate ? computeTimeLeft(targetDate) : null
  );

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      setTimeLeft(computeTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) {
    return (
      <div className="flex items-center justify-center w-full h-full text-white text-lg">
        Countdown Widget — no target date configured
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-white">
        <div className="text-3xl font-bold">{expiredMessage}</div>
      </div>
    );
  }

  const segments = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-white">
      {title && <div className="text-2xl font-semibold mb-6">{title}</div>}
      <div className="flex gap-4">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="flex flex-col items-center bg-white/10 rounded-xl px-5 py-4 min-w-[80px]"
          >
            <span className="text-4xl font-mono font-bold">
              {String(seg.value).padStart(2, "0")}
            </span>
            <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
