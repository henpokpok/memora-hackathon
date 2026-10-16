import React from 'react';
import { NavigationPage, Language } from '../types';
import { translations } from '../data/translations';
import { Home, Brain, Images } from 'lucide-react';

interface BottomNavProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  unlockedCount: number;
  totalCount: number;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  onNavigate,
  unlockedCount,
  totalCount,
  lang,
}) => {
  const t = translations[lang];
  const isCompletedAll = unlockedCount === totalCount;

  const navItems = [
    {
      id: 'home' as NavigationPage,
      label: t.navHome,
      icon: Home,
      badge: null,
    },
    {
      id: 'test' as NavigationPage,
      label: lang === 'en' ? 'Reminisce' : 'ย้อนวันวาน',
      icon: Brain,
      badge: null,
    },
    {
      id: 'vault' as NavigationPage,
      label: lang === 'en' ? 'Family Photos' : 'รูปครอบครัว',
      icon: Images,
      badge: null,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-2xl border-t border-slate-200/70 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
      <style>{`
        @keyframes nav-rainbow-shift {
          0% {
            color: #4f46e5;
            filter: drop-shadow(0 0 6px rgba(79, 70, 229, 0.45));
          }
          20% {
            color: #db2777;
            filter: drop-shadow(0 0 6px rgba(219, 39, 119, 0.45));
          }
          40% {
            color: #d97706;
            filter: drop-shadow(0 0 6px rgba(217, 119, 6, 0.45));
          }
          60% {
            color: #059669;
            filter: drop-shadow(0 0 6px rgba(5, 150, 105, 0.45));
          }
          80% {
            color: #0284c7;
            filter: drop-shadow(0 0 6px rgba(2, 132, 199, 0.45));
          }
          100% {
            color: #4f46e5;
            filter: drop-shadow(0 0 6px rgba(79, 70, 229, 0.45));
          }
        }
        @keyframes nav-ambient-aura {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.15);
          }
        }
        .nav-icon-rainbow {
          animation: nav-rainbow-shift 8s linear infinite;
        }
        .nav-aura-pulse {
          animation: nav-ambient-aura 4s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-md mx-auto px-6">
        <nav
          aria-label="Bottom Navigation"
          className="flex items-center justify-around py-2.5 sm:py-3"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="group relative flex-1 flex flex-col items-center justify-center py-1 focus:outline-none transition-all active:scale-95 cursor-pointer"
              >
                {/* Icon Container with Ambient Glow */}
                <div className="relative flex items-center justify-center w-10 h-10">
                  {/* Ambient Soft Aura behind active icon */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-300/30 via-pink-300/25 to-amber-300/30 blur-md pointer-events-none nav-aura-pulse" />
                  )}

                  <Icon
                    className={`relative z-10 w-7 h-7 sm:w-7.5 sm:h-7.5 transition-all duration-300 ${
                      isActive
                        ? 'nav-icon-rainbow stroke-[2.4] scale-105'
                        : 'text-slate-400 group-hover:text-slate-600 stroke-[1.8]'
                    }`}
                  />

                  {/* Badge */}
                  {item.badge && (
                    <span
                      className={`absolute -top-1 -right-2 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border shadow-2xs z-20 ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Minimal Text Label */}
                <span
                  className={`mt-0.5 text-xs tracking-normal transition-colors ${
                    isActive
                      ? 'text-slate-900 font-bold'
                      : 'text-slate-400 font-medium group-hover:text-slate-600'
                  }`}
                >
                  {item.label}
                </span>

                {/* Selected Page Indicator Dot (วงกลมเล็กๆ อยู่ใต้ icon) */}
                <div className="h-2 flex items-center justify-center mt-0.5">
                  {isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-xs animate-fade-in" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Safe Area Spacer for iOS Home Bar */}
      <div className="h-safe pb-1" />
    </div>
  );
};
