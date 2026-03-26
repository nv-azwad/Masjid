import { useState } from "react";
import { Bell, Globe, Check, Moon, Sun } from "lucide-react";
import { Switch } from "./ui/switch";
import { useTheme } from "../context/ThemeContext";

type Language = "english" | "arabic" | "urdu" | "bengali";

interface LanguageOption {
  id: Language;
  name: string;
  nativeName: string;
}

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english");

  const languages: LanguageOption[] = [
    { id: "english", name: "English", nativeName: "English" },
    { id: "arabic", name: "Arabic", nativeName: "العربية" },
    { id: "urdu", name: "Urdu", nativeName: "اردو" },
    { id: "bengali", name: "Bengali", nativeName: "বাংলা" },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className={`text-2xl ${isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}`}>
          Settings
        </h1>
        <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Manage your preferences
        </p>
      </div>

      {/* Theme Section */}
      <div className={`rounded-2xl p-5 shadow-lg ${
        isDark 
          ? "bg-[#1a1d1a] border border-[#2a2d2a]" 
          : "bg-white border border-gray-200"
      }`}>
        <div className="flex items-center gap-3 mb-4">
          {isDark ? (
            <Moon className="w-5 h-5 text-[#00ff7f]" />
          ) : (
            <Sun className="w-5 h-5 text-[#2d8659]" />
          )}
          <h2 className={isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}>
            Appearance
          </h2>
        </div>
        <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Switch between light and dark mode
        </p>
        
        <div className={`flex items-center justify-between p-4 rounded-xl ${
          isDark 
            ? "bg-[#0f1210] border border-[#2a2d2a]" 
            : "bg-gray-50 border border-gray-200"
        }`}>
          <div>
            <p className={isDark ? "text-white" : "text-gray-900"}>
              {isDark ? "Dark Mode" : "Light Mode"}
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
              {isDark ? "Easier on the eyes at night" : "Bright and clear display"}
            </p>
          </div>
          <Switch
            checked={isDark}
            onCheckedChange={toggleTheme}
          />
        </div>
      </div>

      {/* Notifications Section */}
      <div className={`rounded-2xl p-5 shadow-lg ${
        isDark 
          ? "bg-[#1a1d1a] border border-[#2a2d2a]" 
          : "bg-white border border-gray-200"
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <Bell className={`w-5 h-5 ${isDark ? "text-[#00ff7f]" : "text-[#2d8659]"}`} />
          <h2 className={isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}>
            Notifications
          </h2>
        </div>
        <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Enable or disable prayer notifications
        </p>
        
        <div className={`flex items-center justify-between p-4 rounded-xl ${
          isDark 
            ? "bg-[#0f1210] border border-[#2a2d2a]" 
            : "bg-gray-50 border border-gray-200"
        }`}>
          <div>
            <p className={isDark ? "text-white" : "text-gray-900"}>
              All Notifications
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
              Enable notifications for all prayers
            </p>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>
      </div>

      {/* Language Section */}
      <div className={`rounded-2xl p-5 shadow-lg ${
        isDark 
          ? "bg-[#1a1d1a] border border-[#2a2d2a]" 
          : "bg-white border border-gray-200"
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <Globe className={`w-5 h-5 ${isDark ? "text-[#00ff7f]" : "text-[#2d8659]"}`} />
          <h2 className={isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}>
            Language
          </h2>
        </div>
        <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Choose your preferred language
        </p>
        
        <div className="space-y-2">
          {languages.map((language) => (
            <button
              key={language.id}
              onClick={() => setSelectedLanguage(language.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                selectedLanguage === language.id
                  ? isDark 
                    ? "bg-[#0f1210] border-2 border-[#00ff7f]"
                    : "bg-gray-50 border-2 border-[#2d8659]"
                  : isDark
                    ? "bg-[#0f1210] border-2 border-[#2a2d2a] hover:border-[#3a3d3a]"
                    : "bg-gray-50 border-2 border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-left">
                <p className={isDark ? "text-white" : "text-gray-900"}>
                  {language.name}
                </p>
                <p className={`text-sm font-arabic ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                  {language.nativeName}
                </p>
              </div>
              {selectedLanguage === language.id && (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isDark ? "bg-[#00ff7f]" : "bg-[#2d8659]"
                }`}>
                  <Check className={`w-4 h-4 ${isDark ? "text-[#0f1210]" : "text-white"}`} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className={`rounded-2xl p-5 shadow-lg ${
        isDark 
          ? "bg-[#1a1d1a] border border-[#2a2d2a]" 
          : "bg-white border border-gray-200"
      }`}>
        <h2 className={`mb-3 ${isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}`}>
          About
        </h2>
        <div className={`space-y-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          <p>Gausal Azam Jameh Mosjid</p>
          <p>Prayer Times App</p>
          <p>Version 1.0.0</p>
          <p className={`text-xs mt-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
            © 2026 Gausal Azam Jameh Mosjid. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
