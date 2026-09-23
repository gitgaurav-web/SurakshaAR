import React, { useState, useEffect } from 'react';
import { ShieldCheck, Layers, HardHat, Award, BarChart3, HelpCircle, Wifi, WifiOff } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { TRANSLATIONS } from '../../locales/translations';

export default function Header({ currentLang, onSelectLang, activeTab, setActiveTab }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'ar', label: t.navArModules, icon: Layers },
    { id: 'assessment', label: t.navAssessment, icon: HardHat },
    { id: 'certificate', label: t.navCertificates, icon: Award },
    { id: 'admin', label: t.navAdmin, icon: BarChart3 },
    { id: 'guide', label: t.navGuide, icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Main Logo & Language Bar */}
        <div className="flex items-center justify-between h-14 border-b border-slate-800/60">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('ar')}>
            <div className="p-1.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl text-slate-950 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white">
                Suraksha<span className="text-amber-400">AR</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] text-slate-400 font-medium">
                DGMS Industrial Safety Simulator
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <LanguageSelector currentLang={currentLang} onSelectLang={onSelectLang} />
          </div>
        </div>

        {/* Compact Navigation Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
