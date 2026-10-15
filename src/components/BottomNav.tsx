import React from 'react';
import { NavigationPage, Language } from '../types';
import { translations } from '../data/translations';
import { Home, Brain, Image as ImageIcon } from 'lucide-react';

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
      label: lang === 'en' ? 'Play Orbs' : 'ลูกแก้วความจำ',
      icon: Brain,
      badge: isCompletedAll ? '✨' : `${unlockedCount}/${totalCount}`,
    },
    {
      id: 'vault' as NavigationPage,
      label: lang === 'en' ? 'Family Photos' : 'รูปครอบครัว',
      icon: ImageIcon,
      badge: null,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto px-6">
        <nav
          aria-label="Bottom Navigation"
          className="flex items-center justify-around py-3 sm:py-3.5"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="group relative flex-1 flex flex-col items-center justify-center py-1 focus:outline-none transition-all active:scale-95"
              >
                {/* Plain Minimal Icon */}
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-7 h-7 sm:w-7.5 sm:h-7.5 transition-colors ${
                      isActive
                        ? 'text-slate-950 stroke-[2.4]'
                        : 'text-slate-400 group-hover:text-slate-600 stroke-[1.8]'
                    }`}
                  />

                  {/* Badge */}
                  {item.badge && (
                    <span
                      className={`absolute -top-1.5 -right-3 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border shadow-2xs ${
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
                  className={`mt-1 text-xs tracking-tight transition-colors ${
                    isActive
                      ? 'text-slate-950 font-extrabold'
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
