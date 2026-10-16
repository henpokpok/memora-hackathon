import React, { useState } from 'react';
import { initialMemoryOrbs } from './data/memoryOrbs';
import { initialFamilyGroup } from './data/familyData';
import { MemoryOrb, NavigationPage, Language, FamilyGroup } from './types';
import { translations } from './data/translations';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/views/HomeView';

import { TestView } from './components/views/TestView';
import { ErrorBoundary } from './components/ErrorBoundary';

// Dynamic code splitting for secondary views to optimize bundle size and LCP
const VaultView = React.lazy(() => import('./components/views/VaultView').then((m) => ({ default: m.VaultView })));
const SettingsView = React.lazy(() => import('./components/views/SettingsView').then((m) => ({ default: m.SettingsView })));
const ChildPortalView = React.lazy(() => import('./components/views/ChildPortalView').then((m) => ({ default: m.ChildPortalView })));
const SessionReviewView = React.lazy(() => import('./components/views/SessionReviewView').then((m) => ({ default: m.SessionReviewView })));
const TodayRecapView = React.lazy(() => import('./components/views/TodayRecapView').then((m) => ({ default: m.TodayRecapView })));
const LineCapsuleModal = React.lazy(() => import('./components/LineCapsuleModal').then((m) => ({ default: m.LineCapsuleModal })));
import { stopSpeech } from './services/elevenlabs';
import { familyApi, orbsApi } from './services/api';
import { preloadAppMedia } from './services/imagePreloader';
import { initialDailyRecaps } from './services/recapStorage';

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('memora_language');
      if (saved === 'th' || saved === 'en') return saved;
    }
    return 'th';
  });
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [orbs, setOrbs] = useState<MemoryOrb[]>(initialMemoryOrbs);
  const [activeOrbId, setActiveOrbId] = useState<string>(initialMemoryOrbs[0].id);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);

  // Family System state (Multi-Elder Support)
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup>(initialFamilyGroup);
  const [activeSeniorId, setActiveSeniorId] = useState<string>('elder-1');

  // Hydrate from SQLite / Prisma Backend Database on Mount & Warm Image Cache
  React.useEffect(() => {
    // 1. Proactively warm all 15 memory orbs & recap photos in background
    preloadAppMedia(initialMemoryOrbs, initialDailyRecaps);

    // 2. Fetch family configuration
    familyApi.getCurrentFamily().then((family) => {
      if (family && family.members.length > 0) {
        setFamilyGroup(family);
        const active = family.members.find((m) => m.role === 'elder' && m.isCurrentActive);
        if (active) {
          setActiveSeniorId(active.id);
        } else {
          const firstElder = family.members.find((m) => m.role === 'elder');
          if (firstElder) setActiveSeniorId(firstElder.id);
        }
      }
    });

    // 3. Fetch backend orbs and warm any new database additions
    orbsApi.getOrbs().then((dbOrbs) => {
      if (dbOrbs && dbOrbs.length > 0) {
        setOrbs(dbOrbs);
        setActiveOrbId(dbOrbs[0].id);
        preloadAppMedia(dbOrbs);
      }
    });
  }, []);

  const activeSenior =
    familyGroup.members.find((m) => m.id === activeSeniorId && m.role === 'elder') ||
    familyGroup.members.find((m) => m.role === 'elder') ||
    familyGroup.members[0];

  const t = translations[lang];

  // Unlocked counter
  const unlockedCount = orbs.filter((o) => o.isUnlocked).length;

  // Language toggle
  const handleToggleLang = () => {
    stopSpeech();
    setLang((prev) => {
      const next = prev === 'th' ? 'en' : 'th';
      if (typeof window !== 'undefined') {
        localStorage.setItem('memora_language', next);
      }
      return next;
    });
  };

  // Navigation handlers
  const handleNavigate = (page: NavigationPage) => {
    stopSpeech();
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOrbForTest = (orbId: string) => {
    stopSpeech();
    setActiveOrbId(orbId);
    setCurrentPage('test');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Correct answer callback -> Persist unlock to Database
  const handleCorrectAnswer = (orbId: string) => {
    setOrbs((prev) =>
      prev.map((orb) => (orb.id === orbId ? { ...orb, isUnlocked: true } : orb))
    );
    orbsApi.unlockOrb(orbId).catch((err) => console.warn('Unlock persist error:', err));
  };

  // Finish session callback -> navigate to Session Review celebration page!
  const handleFinishSession = () => {
    stopSpeech();
    setCurrentPage('session-review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add new orb from LINE simulation -> Persist to Database
  const handleAddNewOrb = (newOrb: MemoryOrb) => {
    setOrbs((prev) => [newOrb, ...prev]);
    orbsApi.createOrb(newOrb).catch((err) => console.warn('Create orb persist error:', err));
  };

  // Switch senior callback -> Persist to Database
  const handleSwitchSenior = (seniorId: string) => {
    setActiveSeniorId(seniorId);
    familyApi.setActiveSenior(seniorId).catch((err) => console.warn('Switch senior persist error:', err));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Top Header with Living Aura Mist and Clean Settings Button ⚙️ */}
      <TopHeader onOpenSettings={() => handleNavigate('settings')} />

      {/* Main Multi-Page Content Area with Bottom Padding for Tablet Floating Bar */}
      <main className={`flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 ${
        currentPage === 'test' ? 'pt-2 sm:pt-2.5 pb-14 sm:pb-15' : 'py-4 pb-32 sm:pb-36'
      }`}>
        <ErrorBoundary
          fallbackTitle={lang === 'en' ? 'Opening View...' : 'กำลังเปิดหน้าจอ...'}
          onReset={() => setCurrentPage('home')}
        >
          <React.Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[45vh] space-y-3">
                <div className="w-9 h-9 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
                <p className="text-xs font-semibold text-slate-400">
                  {lang === 'en' ? 'Loading view...' : 'กำลังเปิดหน้าจอ...'}
                </p>
              </div>
            }
          >
          {currentPage === 'home' && (
            <HomeView
              orbs={orbs}
              unlockedCount={unlockedCount}
              onNavigate={handleNavigate}
              onSelectOrbForTest={handleSelectOrbForTest}
              lang={lang}
              activeSenior={activeSenior}
            />
          )}

          {currentPage === 'test' && (
            <TestView
              orbs={orbs}
              activeOrbId={activeOrbId}
              onSelectOrb={(id) => {
                stopSpeech();
                setActiveOrbId(id);
              }}
              onCorrectAnswer={handleCorrectAnswer}
              onFinishSession={handleFinishSession}
              lang={lang}
            />
          )}

          {/* Dedicated Session Review & Daily Milestone Celebration Page */}
          {currentPage === 'session-review' && (
            <SessionReviewView
              orbs={orbs}
              activeSenior={activeSenior}
              onNavigate={handleNavigate}
              onOpenLineModal={() => setIsLineModalOpen(true)}
              lang={lang}
            />
          )}

          {currentPage === 'vault' && (
            <VaultView
              orbs={orbs}
              onSelectOrbForTest={handleSelectOrbForTest}
              lang={lang}
              onNavigate={handleNavigate}
            />
          )}

          {/* Dedicated Today's Storytelling Recap View */}
          {currentPage === 'today-recap' && (
            <TodayRecapView
              onNavigate={handleNavigate}
              lang={lang}
            />
          )}

          {/* Dedicated Full Page for Settings (No popup modal!) */}
          {currentPage === 'settings' && (
            <SettingsView
              onNavigate={handleNavigate}
              lang={lang}
              onToggleLang={handleToggleLang}
              onResetOrbs={() => setOrbs((prev) => prev.map((o) => ({ ...o, isUnlocked: false })))}
              onUnlockAllOrbs={() => setOrbs((prev) => prev.map((o) => ({ ...o, isUnlocked: true })))}
            />
          )}

          {/* Dedicated Caregiver & Family Console (Separated for safety) */}
          {currentPage === 'child-portal' && (
            <ChildPortalView
              onNavigate={handleNavigate}
              orbs={orbs}
              unlockedCount={unlockedCount}
              familyGroup={familyGroup}
              onUpdateFamily={(updated) => setFamilyGroup(updated)}
              activeSenior={activeSenior}
              onSwitchActiveSenior={handleSwitchSenior}
              onAddNewOrb={handleAddNewOrb}
              lang={lang}
            />
          )}
        </React.Suspense>
        </ErrorBoundary>
      </main>

      {/* LINE Memory Capsule Push Preview Modal */}
      {isLineModalOpen && (
        <React.Suspense fallback={null}>
          <LineCapsuleModal
            isOpen={isLineModalOpen}
            onClose={() => setIsLineModalOpen(false)}
            orbs={orbs}
            unlockedCount={unlockedCount}
          />
        </React.Suspense>
      )}

      {/* Plain Minimal Bottom Navigation Bar with Selected Dot Indicator */}
      <BottomNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        unlockedCount={unlockedCount}
        totalCount={orbs.length}
        lang={lang}
      />
    </div>
  );
};

export default App;
