import { useEffect } from "react";
import { useNavigate } from "react-router";

export function LoadingScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-[#0f1210] flex items-center justify-center">
      <div className="text-center px-6">
        {/* Main Bismillah Text */}
        <h1 className="text-6xl md:text-7xl text-[#d4af77] font-arabic mb-6 animate-fade-in leading-relaxed">
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </h1>
        
        {/* English Translation */}
        <p className="text-[#c9a961] text-lg mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          In the name of Allah, the Most Gracious, the Most Merciful
        </p>
        
        {/* Loading indicator with green accent */}
        <div className="flex items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="h-1 w-20 bg-[#00ff7f] rounded-full animate-pulse"></div>
          <div className="h-1 w-20 bg-[#d4af77] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-1 w-20 bg-[#00ff7f] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
