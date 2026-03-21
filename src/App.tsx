import { useCallback } from "react";
import { usePlayerAuth } from "./hooks/usePlayerAuth.ts";
import { useScreenConfig } from "./hooks/useScreenConfig.ts";
import { PairingScreen } from "./components/PairingScreen.tsx";
import { PlayerEngine } from "./components/PlayerEngine.tsx";
import { LoadingScreen } from "./components/LoadingScreen.tsx";
import type { Orientation } from "@shared/types/firestore-schema.ts";

function getOrientationStyle(orientation: Orientation): React.CSSProperties {
  switch (orientation) {
    case "portrait":
      return {
        transform: "rotate(90deg)",
        transformOrigin: "top left",
        width: "100vh",
        height: "100vw",
        position: "absolute",
        left: "100vw",
        top: 0,
      };
    case "portrait-flipped":
      return {
        transform: "rotate(-90deg)",
        transformOrigin: "top right",
        width: "100vh",
        height: "100vw",
        position: "absolute",
        left: 0,
        top: "100vh",
      };
    case "landscape-flipped":
      return {
        transform: "rotate(180deg)",
        transformOrigin: "center center",
        width: "100vw",
        height: "100vh",
      };
    case "landscape":
    default:
      return {
        width: "100vw",
        height: "100vh",
      };
  }
}

function App() {
  const { screenId, isAuthenticated, isPairing, setCredentials } =
    usePlayerAuth();
  const { screen, loading } = useScreenConfig(
    isAuthenticated ? screenId : null
  );

  const handlePaired = useCallback(
    async (pairedScreenId: string, token: string) => {
      await setCredentials(pairedScreenId, token);
    },
    [setCredentials]
  );

  // Show pairing screen if not authenticated
  if (isPairing || !isAuthenticated) {
    return <PairingScreen onPaired={handlePaired} />;
  }

  // Show loading while fetching screen config
  if (loading) {
    return <LoadingScreen message="Loading screen configuration..." />;
  }

  // No screen data found
  if (!screen) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black">
        <p className="text-gray-500 text-2xl">Screen not found</p>
      </div>
    );
  }

  const orientation = screen.orientation ?? "landscape";
  const orientationStyle = getOrientationStyle(orientation);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <div style={orientationStyle}>
        <PlayerEngine screen={screen} />
      </div>
    </div>
  );
}

export default App;
