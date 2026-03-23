import { useState, useRef, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase.ts";
import { getAndroidBridge } from "../hooks/usePlayerAuth.ts";

interface PairingScreenProps {
  onPaired: (screenId: string, token: string) => void;
}

interface PairScreenResponse {
  screenId: string;
  customToken: string;
  organizationId: string;
  orientation: string;
  resolution: string;
}

export function PairingScreen({ onPaired }: PairingScreenProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const code = newDigits.join("");
      if (code.length === 6) {
        submitCode(code);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const code = digits.join("");
      if (code.length === 6) {
        submitCode(code);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setDigits(newDigits);
      setError(null);
      const nextEmpty = Math.min(pasted.length, 5);
      inputRefs.current[nextEmpty]?.focus();
      if (pasted.length === 6) {
        submitCode(pasted);
      }
    }
  };

  const submitCode = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const pairScreen = httpsCallable<
        { code: string; deviceInfo: Record<string, string> },
        PairScreenResponse
      >(functions, "pairScreen");

      const bridge = getAndroidBridge();
      let deviceInfo: Record<string, string> = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: String(window.screen.width),
        screenHeight: String(window.screen.height),
        pairedAt: new Date().toISOString(),
      };

      if (bridge) {
        try {
          const nativeInfo = JSON.parse(bridge.getDeviceInfo());
          deviceInfo = { ...deviceInfo, ...nativeInfo, source: "android-app" };
        } catch {
          deviceInfo.source = "android-app";
        }
      } else {
        deviceInfo.source = "web-browser";
      }

      const result = await pairScreen({ code, deviceInfo });
      const { screenId, customToken } = result.data;
      onPaired(screenId, customToken);
    } catch (err: unknown) {
      console.error("Pairing failed:", err);
      const message = err instanceof Error ? err.message : "Pairing failed";

      if (message.includes("not-found") || message.includes("Invalid")) {
        setError("Invalid or expired code. Please try again.");
      } else if (message.includes("deadline-exceeded") || message.includes("expired")) {
        setError("This code has expired. Generate a new one from the dashboard.");
      } else {
        setError("Pairing failed. Please check the code and try again.");
      }

      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-surface overflow-hidden" style={{ cursor: "default" }}>
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-dots opacity-50" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
        {/* Decorative ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full animate-spin-slow" />
      </div>

      <div className="text-center max-w-lg px-6 relative z-10">
        {/* Logo */}
        <div className="mb-10">
          <div className="relative w-20 h-20 mx-auto mb-5">
            {/* Pulse ring */}
            <div className="absolute inset-0 bg-primary/20 rounded-2xl" style={{ animation: "pulse-ring 2s ease-out infinite" }} />
            <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30">
              <span className="text-white text-3xl font-bold">Z</span>
            </div>
          </div>
          <h1 className="text-white text-4xl font-bold mb-1">ZDOM Player</h1>
          <p className="text-gray-500 text-sm">Digital Signage Platform</p>
        </div>

        {/* Instructions */}
        <div className="mb-8">
          <p className="text-primary-light text-sm font-semibold tracking-widest uppercase mb-2">
            Enter Pairing Code
          </p>
          <p className="text-gray-400 text-sm">
            Enter the 6-digit code from your dashboard to pair this screen.
          </p>
        </div>

        {/* Code Input */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              style={{ cursor: "text" }}
              className={`w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl sm:text-4xl font-mono font-bold rounded-xl border-2
                bg-white/5 backdrop-blur-sm text-white outline-none transition-all duration-300
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
                ${error
                  ? "border-red-500/70 bg-red-500/5"
                  : digit
                    ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-white/10 hover:border-white/20 focus:border-primary focus:bg-primary/5 focus:shadow-lg focus:shadow-primary/10"
                }
              `}
              autoComplete="off"
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center justify-center gap-2 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg py-2.5 px-4 mx-auto max-w-sm">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-3 h-3 bg-primary-light rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            <p className="text-gray-300 text-lg ml-2">Pairing...</p>
          </div>
        )}

        {/* Help text */}
        <div className="mt-10 bg-white/3 border border-white/5 rounded-xl p-4">
          <p className="text-gray-500 text-xs leading-relaxed">
            Open your <span className="text-primary-light font-medium">ZDOM Dashboard</span> → Screens → Select a screen → Click <span className="text-primary-light font-medium">"Pair"</span> to get a 6-digit code.
          </p>
        </div>
      </div>
    </div>
  );
}
