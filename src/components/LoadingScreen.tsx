interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

export function LoadingScreen({
  message = "Loading content...",
  progress,
}: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-surface">
      {/* Logo */}
      <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
        <span className="text-white text-xl font-bold">Z</span>
      </div>

      <p className="text-gray-400 text-lg mb-6">{message}</p>

      <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        {progress !== undefined ? (
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        ) : (
          <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full animate-pulse w-1/2" />
        )}
      </div>
    </div>
  );
}
