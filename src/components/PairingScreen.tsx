import { useState, useRef, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase.ts";

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

  // Auto-focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
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

      // Focus appropriate input
      const nextEmpty = Math.min(pasted.length, 5);
      inputRefs.current[nextEmpty]?.focus();

      // Auto-submit if 6 digits pasted
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

      const result = await pairScreen({
        code,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenWidth: String(window.screen.width),
          screenHeight: String(window.screen.height),
          pairedAt: new Date().toISOString(),
        },
      });

      const { screenId, customToken } = result.data;
      onPaired(screenId, customToken);
    } catch (err: unknown) {
      console.error("Pairing failed:", err);
      const message =
        err instanceof Error ? err.message : "Pairing failed";

      if (message.includes("not-found") || message.includes("Invalid")) {
        setError("Invalid or expired code. Please try again.");
      } else if (message.includes("deadline-exceeded") || message.includes("expired")) {
        setError("This code has expired. Generate a new one from the dashboard.");
      } else {
        setError("Pairing failed. Please check the code and try again.");
      }

      // Clear inputs for retry
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-black">
      <div className="text-center max-w-lg px-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">Z</span>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">ZDOM Player</h1>
        </div>

        {/* Instructions */}
        <p className="text-gray-400 text-lg mb-2 tracking-wide uppercase">
          Enter Pairing Code
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Enter the 6-digit code shown on your dashboard to pair this screen.
        </p>

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
              className={`w-14 h-16 text-center text-3xl font-mono font-bold rounded-lg border-2
                bg-gray-900 text-white outline-none transition-all duration-200
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
                ${error ? "border-red-500" : "border-gray-700 focus:border-blue-500"}
              `}
              autoComplete="off"
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <p className="text-gray-300 text-lg">Pairing...</p>
          </div>
        )}

        {/* Help text */}
        <p className="text-gray-600 text-xs mt-8 leading-relaxed">
          Open your ZDOM Dashboard → Screens → Select a screen → Click "Pair"
          to get a 6-digit code.
        </p>
      </div>
    </div>
  );
}
