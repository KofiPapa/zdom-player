import { useState, useEffect } from "react";

export function StatusOverlay() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-600/80 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
      Offline
    </div>
  );
}
