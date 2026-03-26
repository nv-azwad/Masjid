import { Clock, User, Bell, Mail } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface Prayer {
  id: string;
  name: string;
  time: string;
  isNext?: boolean;
}

interface Imam {
  id: string;
  name: string;
  role: string;
  bio: string;
  contact?: string;
}

export function Home() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const jummaDetail = {
    name: "Friday Jummah",
    time: "1:30 PM",
    khateeb: "Sheikh Ibrahim Ahmed",
  };

  const dailyPrayers: Prayer[] = [
    { id: "fajr", name: "Fajr", time: "5:45 AM", isNext: true },
    { id: "dhuhr", name: "Dhuhr", time: "12:30 PM" },
    { id: "asr", name: "Asr", time: "3:45 PM" },
    { id: "maghrib", name: "Maghrib", time: "6:15 PM" },
    { id: "isha", name: "Isha", time: "7:45 PM" },
  ];

  const imams: Imam[] = [
    {
      id: "1",
      name: "Imam Abdullah Rahman",
      role: "Head Imam",
      bio: "Served the community for over 15 years with dedication to Islamic education and spiritual guidance.",
      contact: "imam.abdullah@gausalamazam.org",
    },
    {
      id: "2",
      name: "Imam Muhammad Ali",
      role: "Associate Imam",
      bio: "Specializes in Quran recitation and teaches Islamic studies to youth and adults.",
      contact: "imam.muhammad@gausalamazam.org",
    },
    {
      id: "3",
      name: "Imam Yusuf Hassan",
      role: "Imam & Community Outreach",
      bio: "Focuses on community engagement and interfaith dialogue while leading prayers.",
      contact: "imam.yusuf@gausalamazam.org",
    },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className={`rounded-2xl p-4 shadow-lg ${
        isDark 
          ? "bg-[#1a1d1a] border border-[#2a2d2a]" 
          : "bg-white border border-gray-200"
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isDark ? "bg-[#00ff7f]" : "bg-[#2d8659]"
          }`}>
            <svg className={`w-7 h-7 ${isDark ? "text-[#0f1210]" : "text-white"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </div>
          <h1 className={`text-2xl ${isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}`}>
            Gausal Azam Jameh Mosjid
          </h1>
        </div>
        <div className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          <Clock className="w-4 h-4" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Jummah Prayer */}
      <div>
        <h2 className={`mb-3 px-1 ${isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}`}>
          Jummah Prayer
        </h2>
        <div className={`rounded-2xl p-5 shadow-lg relative ${
          isDark 
            ? "bg-gradient-to-br from-[#d4af77] to-[#c9a961] border border-[#d4af77]/50" 
            : "bg-gradient-to-br from-[#d4af77] to-[#e8d4a8] border border-[#d4af77]/50"
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className={`w-5 h-5 ${isDark ? "text-[#0f1210]" : "text-[#2d2410]"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h3 className={isDark ? "text-[#0f1210]" : "text-[#2d2410]"}>{jummaDetail.name}</h3>
            </div>
            <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? "bg-[#0f1210]/20 hover:bg-[#0f1210]/30" : "bg-[#2d2410]/20 hover:bg-[#2d2410]/30"
            }`}>
              <Bell className={`w-4 h-4 ${isDark ? "text-[#0f1210]" : "text-[#2d2410]"}`} />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className={`w-4 h-4 ${isDark ? "text-[#0f1210]" : "text-[#2d2410]"}`} />
              <div>
                <p className={`text-xs ${isDark ? "text-[#0f1210]/80" : "text-[#2d2410]/80"}`}>Prayer Time</p>
                <p className={isDark ? "text-[#0f1210]" : "text-[#2d2410]"}>{jummaDetail.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className={`w-4 h-4 ${isDark ? "text-[#0f1210]" : "text-[#2d2410]"}`} />
              <div>
                <p className={`text-xs ${isDark ? "text-[#0f1210]/80" : "text-[#2d2410]/80"}`}>Khateeb</p>
                <p className={isDark ? "text-[#0f1210]" : "text-[#2d2410]"}>{jummaDetail.khateeb}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Prayers */}
      <div>
        <h2 className={`mb-3 px-1 ${isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}`}>
          Daily Prayers
        </h2>
        <div className="space-y-3">
          {dailyPrayers.map((prayer) => (
            <div
              key={prayer.id}
              className={`rounded-2xl p-4 shadow-lg flex items-center justify-between border ${
                prayer.isNext
                  ? isDark 
                    ? "bg-[#00ff7f] text-[#0f1210] border-[#00ff7f]"
                    : "bg-[#2d8659] text-white border-[#2d8659]"
                  : isDark
                    ? "bg-[#1a1d1a] text-white border-[#2a2d2a]"
                    : "bg-white text-gray-900 border-gray-200"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={
                    prayer.isNext 
                      ? isDark ? "text-[#0f1210]" : "text-white"
                      : isDark ? "text-[#d4af77]" : "text-[#8b6f47]"
                  }>
                    {prayer.name}
                  </h3>
                  {prayer.isNext && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isDark ? "bg-[#0f1210] text-white" : "bg-white text-[#2d8659]"
                    }`}>
                      NEXT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{prayer.time}</span>
                </div>
              </div>
              <button
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  prayer.isNext 
                    ? isDark 
                      ? "bg-[#0f1210] hover:bg-[#1a1d1a]"
                      : "bg-white hover:bg-gray-100"
                    : isDark
                      ? "bg-[#2a2d2a] hover:bg-[#3a3d3a]"
                      : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <Bell
                  className={`w-4 h-4 ${
                    prayer.isNext 
                      ? isDark ? "text-white" : "text-[#2d8659]"
                      : isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Imams Information Section */}
      <div>
        <h2 className={`mb-3 px-1 ${isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}`}>
          Meet Our Imams
        </h2>
        <div className="space-y-4">
          {imams.map((imam) => (
            <div
              key={imam.id}
              className={`rounded-2xl p-5 shadow-lg ${
                isDark 
                  ? "bg-[#1a1d1a] border border-[#2a2d2a]" 
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDark ? "bg-[#00ff7f]" : "bg-[#2d8659]"
                }`}>
                  <User className={`w-7 h-7 ${isDark ? "text-[#0f1210]" : "text-white"}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg mb-1 ${isDark ? "text-[#d4af77]" : "text-[#8b6f47]"}`}>
                    {imam.name}
                  </h3>
                  <p className={`text-sm ${isDark ? "text-[#00ff7f]" : "text-[#2d8659]"}`}>
                    {imam.role}
                  </p>
                </div>
              </div>
              
              <p className={`text-sm mb-3 leading-relaxed ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                {imam.bio}
              </p>
              
              {imam.contact && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className={`w-4 h-4 ${isDark ? "text-[#00ff7f]" : "text-[#2d8659]"}`} />
                  <a 
                    href={`mailto:${imam.contact}`}
                    className={`transition-colors ${
                      isDark 
                        ? "text-gray-400 hover:text-[#d4af77]" 
                        : "text-gray-600 hover:text-[#8b6f47]"
                    }`}
                  >
                    {imam.contact}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <p className={`text-center text-sm mt-6 mb-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
        May Allah accept our prayers
      </p>
    </div>
  );
}
