import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, Compass, Settings } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const tabs = [
    { id: "home", label: "Home", icon: Home, path: "/home" },
    { id: "qibla", label: "Qibla", icon: Compass, path: "/qibla" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ];

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto ${
      isDark ? "bg-[#0f1210]" : "bg-[#f5f1e8]"
    }`}>
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto ${
        isDark 
          ? "bg-[#1a1d1a] border-t border-[#2a2d2a]" 
          : "bg-white border-t border-gray-200"
      }`}>
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive 
                      ? (isDark ? "text-[#00ff7f]" : "text-[#2d8659]")
                      : (isDark ? "text-gray-500" : "text-gray-400")
                  }`}
                />
                <span
                  className={`text-xs mt-1 ${
                    isActive 
                      ? (isDark ? "text-[#00ff7f]" : "text-[#2d8659]")
                      : (isDark ? "text-gray-500" : "text-gray-400")
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
