import React from 'react';
import { NavigationPage, Language } from '../types';
import { translations } from '../data/translations';
import { Home, Brain, Image as ImageIcon, FileText, Globe } from 'lucide-react';

interface NavbarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  unlockedCount: number;
  totalCount: number;
  lang: Language;
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  unlockedCount,
  totalCount,
  lang,
  onToggleLang,
}) => {
  const t = translations[lang];

  const navItems = [
    { id: 'home' as NavigationPage, label: t.navHome, icon: Home },
    { id: 'test' as NavigationPage, label: t.navTest, icon: Brain, badge: `${unlockedCount}/${totalCount}` },
    { id: 'vault' as NavigationPage, label: t.navVault, icon: ImageIcon },
    { id: 'report' as NavigationPage, label: t.navReport, icon: FileText, highlight: true },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-3 text-left focus:outline-none group"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 p-[1.5px] shadow-sm shadow-indigo-100 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <span className="text-xl">🔮</span>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {t.brandName}
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                  {t.brandTagline}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {t.brandSubtitle}
              </p>
            </div>
          </button>

          {/* Navigation Links + Language Switcher */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Tabs */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : item.highlight
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span className="hidden sm:inline">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Language Switcher Button (TH / EN) */}
            <button
              onClick={onToggleLang}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 shadow-2xs transition-all active:scale-95"
              title="Switch language / เปลี่ยนภาษา"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>{lang === 'th' ? 'EN' : 'ไทย'}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
