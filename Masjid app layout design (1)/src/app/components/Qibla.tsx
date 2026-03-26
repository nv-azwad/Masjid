import { useState, useEffect } from "react";
import { Navigation, AlertCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function Qibla() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [heading, setHeading] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Qibla direction (example: 45 degrees Northeast)
  const qiblaDirection = 45;

  useEffect(() => {
    if ("DeviceOrientationEvent" in window) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null) {
          setHeading(360 - event.alpha);
        }
      };

      // Request permission for iOS 13+
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        (DeviceOrientationEvent as any)
          .requestPermission()
          .then((response: string) => {
            if (response === "granted") {
              setHasPermission(true);
              window.addEventListener("deviceorientation", handleOrientation);
            } else {
              setHasPermission(false);
            }
          })
          .catch(() => setHasPermission(false));
      } else {
        // Non-iOS or older iOS
        setHasPermission(true);
        window.addEventListener("deviceorientation", handleOrientation);
      }

      return () => {
        window.removeEventListener("deviceorientation", handleOrientation);
      };
    } else {
      setHasPermission(false);
    }
  }, []);

  const relativeQibla = (qiblaDirection - heading + 360) % 360;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className={`rounded-2xl p-4 shadow-lg ${
        isDark 
          ? "bg-[#1a1d1a] border border-[#2a2d2a]" 
          : "bg-white border border-gray-200"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isDark ? "bg-[#00ff7f]" : "bg-[#2d8659]"
          }`}>
            <Navigation className={`w-6 h-6 ${isDark ? "text-[#0f1210]" : "text-white"}`} />
          </div>
          <div>
            <h1 className={`text-2xl ${isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}`}>
              Qibla Direction
            </h1>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Find the direction of the Kaaba
            </p>
          </div>
        </div>
      </div>

      {/* Compass */}
      <div className={`rounded-2xl p-8 shadow-lg ${
        isDark 
          ? "bg-[#1a1d1a] border border-[#2a2d2a]" 
          : "bg-white border border-gray-200"
      }`}>
        <div className="relative w-full aspect-square max-w-sm mx-auto">
          {/* Compass Circle */}
          <div className={`absolute inset-0 rounded-full border-4 ${
            isDark ? "border-[#00ff7f]/30" : "border-[#2d8659]/30"
          }`}>
            {/* Cardinal directions */}
            <div className={`absolute top-2 left-1/2 -translate-x-1/2 text-sm ${
              isDark ? "text-[#d4af77]" : "text-[#8b6f47]"
            }`}>
              N
            </div>
            <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-sm ${
              isDark ? "text-[#d4af77]" : "text-[#8b6f47]"
            }`}>
              S
            </div>
            <div className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${
              isDark ? "text-[#d4af77]" : "text-[#8b6f47]"
            }`}>
              W
            </div>
            <div className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm ${
              isDark ? "text-[#d4af77]" : "text-[#8b6f47]"
            }`}>
              E
            </div>
          </div>

          {/* Qibla Arrow */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
            style={{ transform: `rotate(${relativeQibla}deg)` }}
          >
            <div className="relative">
              <Navigation className={`w-20 h-20 ${
                isDark ? "text-[#00ff7f] fill-[#00ff7f]" : "text-[#2d8659] fill-[#2d8659]"
              }`} />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className={`px-3 py-1 rounded-full text-xs ${
                  isDark 
                    ? "bg-[#d4af77] text-[#0f1210]" 
                    : "bg-[#d4af77] text-white"
                }`}>
                  Qibla
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className={`rounded-2xl p-5 shadow-lg ${
        isDark 
          ? "bg-[#1a1d1a] border border-[#2a2d2a]" 
          : "bg-white border border-gray-200"
      }`}>
        <h3 className={`mb-4 ${isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}`}>
          Instructions
        </h3>
        <ul className={`space-y-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          <li className="flex gap-3">
            <span className={`flex-shrink-0 ${isDark ? "text-[#00ff7f]" : "text-[#2d8659]"}`}>
              •
            </span>
            <span>Hold your device flat and parallel to the ground</span>
          </li>
          <li className="flex gap-3">
            <span className={`flex-shrink-0 ${isDark ? "text-[#00ff7f]" : "text-[#2d8659]"}`}>
              •
            </span>
            <span>Rotate yourself until the green arrow points toward Qibla</span>
          </li>
          <li className="flex gap-3">
            <span className={`flex-shrink-0 ${isDark ? "text-[#00ff7f]" : "text-[#2d8659]"}`}>
              •
            </span>
            <span>The direction you're facing is toward the Kaaba</span>
          </li>
          {hasPermission === false && (
            <li className={`flex gap-3 items-start p-3 rounded-lg -mx-1 ${
              isDark 
                ? "text-[#d4af77] bg-[#d4af77]/10 border border-[#d4af77]/30" 
                : "text-[#8b6f47] bg-[#d4af77]/10 border border-[#d4af77]/30"
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Allow device orientation access for compass to work</span>
            </li>
          )}
        </ul>
        
        <p className={`text-center text-xs mt-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
          Qibla direction: 45° Northeast
        </p>
      </div>
    </div>
  );
}
