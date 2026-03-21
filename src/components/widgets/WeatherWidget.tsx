interface WeatherWidgetProps {
  config?: Record<string, unknown>;
}

export function WeatherWidget({ config }: WeatherWidgetProps) {
  const location = (config?.location as string) ?? "Unknown Location";

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-white">
      <div className="text-4xl mb-2">--°</div>
      <div className="text-lg text-gray-300">{location}</div>
      <div className="text-sm text-gray-500 mt-4">
        Weather Widget — configure API key for live data
      </div>
    </div>
  );
}
