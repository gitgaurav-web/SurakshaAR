import React, { useState, useEffect } from 'react';
import { ShieldCheck, Layers, HardHat, Award, BarChart3, HelpCircle, Bot, Box, ShieldAlert, Target, Wifi, WifiOff, Activity, Wind, Eye, Sparkles, AlertTriangle } from 'lucide-react';
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
    { id: 'ar', label: t.navArModules || "AR Modules", icon: Layers, badge: 'HOT' },
    { id: 'telemetry', label: "Mine 3D Shaft Map", icon: Activity, badge: '3D' },
    { id: 'scanner', label: "Pre-Shift Scan", icon: Eye, badge: 'AI' },
    { id: 'gas', label: "Gas Plume AR", icon: Wind, badge: 'CFD' },
    { id: 'game', label: "Hazard Spotter", icon: Target },
    { id: 'assistant', label: "SurakshaMitra AI", icon: Bot, badge: 'RAG' },
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
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-b border-amber-500/30 shadow-[0_4px_30px_rgba(245,158,11,0.2)] max-w-full overflow-hidden">
      {/* ⚠️ Live Mine Hazard Alert Ticker Banner */}
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border-b border-red-500/40 py-1 px-2 sm:px-4 text-[10px] sm:text-[11px] font-mono text-amber-300 overflow-hidden flex items-center justify-between w-full">
        <div className="flex items-center space-x-1.5 animate-pulse shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="font-bold text-red-400 hidden xs:inline">DGMS ALERT:</span>
        </div>
        <div className="truncate mx-2 text-slate-300 max-w-[75%] sm:max-w-none">
          <span className="truncate block sm:inline">Jharia Shaft #4 - CH4 Methane <strong className="text-amber-400">1.85% VOL</strong> | Aux Vent Fan Active</span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 font-bold shrink-0">
          LIVE TICKER
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        {/* Main Brand Logo & SOS Telemetry Bar */}
        <div className="flex flex-wrap items-center justify-between min-h-16 py-2 border-b border-slate-800/80 gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group shrink-0" onClick={() => setActiveTab('ar')}>
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/50 transform group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-1">
                  Suraksha<span className="text-amber-400 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">AR</span>
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse inline" />
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-400 tracking-wider shadow-sm">
                  DGMS v2.4 SIH PRO
                </span>
              </div>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wide">
                DGMS Industrial Safety Simulator • Dhanbad Cluster
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Online / Offline Status Badge */}
            <div className={`hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${
              isOnline 
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]' 
                : 'bg-red-950/80 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
              <span>{isOnline ? 'LIVE TELEMETRY' : 'OFFLINE MODE'}</span>
            </div>

            {/* SOS Panic Button with Glowing Ring */}
            <button
              onClick={handleSosClick}
              className="min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-[11px] sm:text-xs rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.6)] flex items-center space-x-1 sm:space-x-1.5 ring-2 ring-red-400/80 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0"
              title="Emergency SOS Panic Beacon"
            >
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 shrink-0" />
              <span className="tracking-wider sm:tracking-widest">SOS BEACON</span>
            </button>

            <LanguageSelector currentLang={currentLang} onSelectLang={onSelectLang} />
          </div>
        </div>

        {/* Navigation Tabs (48px Glove-Friendly Touch Targets) */}
        <nav className="flex space-x-1.5 sm:space-x-2 overflow-x-auto py-2.5 sm:py-3 no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[44px] sm:min-h-[48px] flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all duration-200 relative shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-[0_0_25px_rgba(245,158,11,0.4)] ring-2 ring-amber-300/60 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/90 border border-slate-800/60 hover:border-amber-500/30'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-slate-950 font-black' : 'text-amber-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[8px] sm:text-[9px] font-mono font-extrabold px-1 sm:px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
