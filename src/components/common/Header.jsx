import React, { useState, useEffect } from 'react';
import { ShieldCheck, Layers, HardHat, Award, BarChart3, HelpCircle, Bot, Box, ShieldAlert, Target, Wifi, WifiOff, Activity, Wind, Eye } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { TRANSLATIONS } from '../../locales/translations';

export default function Header({ currentLang, onSelectLang, activeTab, setActiveTab, onOpenSos }) {
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
    { id: 'ar', label: t.navArModules || "AR Modules", icon: Layers },
    { id: 'telemetry', label: "Mine 3D Shaft Map", icon: Activity },
    { id: 'scanner', label: "Pre-Shift Scan", icon: Eye },
    { id: 'gas', label: "Gas Plume AR", icon: Wind },
    { id: 'game', label: "Hazard Spotter", icon: Target },
    { id: 'assistant', label: "SurakshaMitra AI", icon: Bot },
    { id: 'explorer', label: "3D Gear Sandbox", icon: Box },
    { id: 'assessment', label: t.navAssessment || "Assessment", icon: HardHat },
    { id: 'certificate', label: t.navCertificates || "Certificates", icon: Award },
    { id: 'admin', label: t.navAdmin || "Admin Portal", icon: BarChart3 },
    { id: 'guide', label: t.navGuide || "Guide", icon: HelpCircle },
  ];

  const handleSosClick = () => {
    if (onOpenSos) onOpenSos();
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-amber-500/30 shadow-[0_4px_25px_rgba(245,158,11,0.15)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        {/* Main Brand Logo & SOS Telemetry Bar */}
        <div className="flex items-center justify-between h-16 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('ar')}>
            <div className="p-2 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-black tracking-tight text-white">
                  Suraksha<span className="text-amber-400">AR</span>
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-400">
                  DGMS v2.4 SIH
                </span>
              </div>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium">
                DGMS Industrial Safety Simulator • Mining & Manufacturing
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Online / Offline Status Badge */}
            <div className={`hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
              isOnline ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' : 'bg-red-950/60 border-red-500/40 text-red-400'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'LIVE TELEMETRY' : 'OFFLINE MODE'}</span>
            </div>

            {/* SOS Panic Button with Glowing Ring */}
            <button
              onClick={handleSosClick}
              className="min-h-[44px] px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center space-x-1.5 ring-2 ring-red-400/60 animate-pulse transition-all active:scale-95"
              title="Emergency SOS Panic Beacon"
            >
              <ShieldAlert className="w-4 h-4 text-yellow-300" />
              <span className="tracking-wider">SOS BEACON</span>
            </button>

            <LanguageSelector currentLang={currentLang} onSelectLang={onSelectLang} />
          </div>
        </div>

        {/* Navigation Tabs (48px Glove-Friendly Touch Targets) */}
        <nav className="flex space-x-1.5 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[48px] flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/50 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent hover:border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
