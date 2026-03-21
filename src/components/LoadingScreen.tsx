interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

export function LoadingScreen({
  message = "Loading content...",
  progress,
}: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-black">
      <p className="text-gray-400 text-xl mb-6">{message}</p>
      <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
        {progress !== undefined ? (
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        ) : (
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-1/2" />
        )}
      </div>
    </div>
  );
}
