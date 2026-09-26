import React, { useState } from 'react';
import Header from './components/common/Header';
import ARSimulatorContainer from './components/ar/ARSimulatorContainer';
import AssessmentEngine from './components/assessment/AssessmentEngine';
import CertificateView from './components/certificate/CertificateView';
import AdminDashboard from './components/admin/AdminDashboard';
import WorkerGuide from './components/guide/WorkerGuide';
import QRVerifierModal from './components/certificate/QRVerifierModal';
import SurakshaAssistant from './components/ai/SurakshaAssistant';
import EquipmentExplorer from './components/explorer/EquipmentExplorer';
import HazardSpotterGame from './components/game/HazardSpotterGame';
import EmergencySosModal from './components/emergency/EmergencySosModal';
import Mine3DMapExplorer from './components/telemetry/Mine3DMapExplorer';
import PreShiftFatigueScanner from './components/scanner/PreShiftFatigueScanner';
import GasPlumeSimulator from './components/gas/GasPlumeSimulator';
import { TRANSLATIONS } from './locales/translations';
import { saveWorkerEvaluation } from './utils/offlineStorage';
import { UserCheck, ShieldCheck, MapPin, Sparkles, RefreshCw, AlertTriangle, Activity, Flame, Wind, Lock, ShieldAlert } from 'lucide-react';

const PRESET_WORKERS = [
  {
    id: "JHK-MN-2026-081",
    name: "Budhan Manjhi",
    language: "sat",
    mineSector: "Jharia Coalfield, Dhanbad Cluster",
    orientationDays: 14,
    score: 92,
    certified: true,
    certHash: "0x8F9A7B3C2D1E4F5A",
    certDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "JHK-MN-2026-104",
    name: "Ramesh Kumar Sharma",
    language: "hi",
    mineSector: "Digwadih Colliery Seam 14",
    orientationDays: 30,
    score: 88,
    certified: true,
    certHash: "0x3A2B1C4D5E6F7A8B",
    certDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "JHK-MN-2026-215",
    name: "Sarah Thomas",
    language: "en",
    mineSector: "Moonidih Deep Shaft #3",
    orientationDays: 45,
    score: 96,
    certified: true,
    certHash: "0x9E8D7C6B5A4F3E2D",
    certDate: new Date().toISOString().split('T')[0]
  }
];

export default function App() {
  const [currentLang, setCurrentLang] = useState('hi');
  const [activeTab, setActiveTab] = useState('ar');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [showHazardPanel, setShowHazardPanel] = useState(true);
  
  const [activeWorkerIndex, setActiveWorkerIndex] = useState(0);
  const activeWorker = PRESET_WORKERS[activeWorkerIndex];

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const handleModuleComplete = (moduleName, score) => {
    console.log(`Module ${moduleName} completed with score ${score}`);
    setActiveTab('assessment');
  };

  const handlePassAssessment = (finalScore) => {
    const updated = saveWorkerEvaluation({
      ...activeWorker,
      score: finalScore,
      language: currentLang
    });
    setActiveTab('certificate');
  };

  const handleViewWorkerCert = (workerData) => {
    setActiveTab('certificate');
  };

  const cycleWorkerProfile = () => {
    const nextIdx = (activeWorkerIndex + 1) % PRESET_WORKERS.length;
    setActiveWorkerIndex(nextIdx);
    setCurrentLang(PRESET_WORKERS[nextIdx].language);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Header
        currentLang={currentLang}
        onSelectLang={setCurrentLang}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSos={() => setIsSosOpen(true)}
      />

      {/* Industrial Worker Quick-HUD Status Ribbon & Profile Switcher */}
      <div className="bg-slate-900/90 border-b border-slate-800 py-2 px-3 sm:px-6 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-slate-300 font-bold">{activeWorker.name}</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400 font-bold">{activeWorker.id}</span>

            {/* Profile Switcher Trigger Button */}
            <button
              onClick={cycleWorkerProfile}
              className="ml-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-[10px] flex items-center space-x-1 font-bold transition active:scale-95 shadow-sm"
              title="Switch Test Worker Profile"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span>Switch Miner Profile</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className="hidden md:flex items-center space-x-1 text-slate-400">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>{activeWorker.mineSector}</span>
            </span>

            {/* DGMS TRAINING SCORE Badge */}
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-emerald-950 to-emerald-900 border border-emerald-500/60 text-emerald-400 rounded-lg font-black tracking-wide shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DGMS TRAINING SCORE: {activeWorker.score}%</span>
            </span>

            {/* Hazard Panel Toggle Button */}
            <button
              onClick={() => setShowHazardPanel(!showHazardPanel)}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition flex items-center space-x-1 ${
                showHazardPanel 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>{showHazardPanel ? 'Hide Hazard Panel' : 'Hazard Panel'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ⚠️ Dynamic Real-Time Hazard Detection Panel */}
      {showHazardPanel && (
        <div className="bg-slate-900/95 border-b border-amber-500/40 px-3 sm:px-6 py-2.5 shadow-lg backdrop-blur-md">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>AI HAZARD DETECTION & MONITORING PANEL</span>
              </span>
              <span className="text-[9px] font-mono text-slate-400">LIVE SENSOR TELEMETRY SYNCED</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Fire Hazard</span>
                    <span className="font-bold text-slate-200">DCP Extinguisher</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SEALED
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wind className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">CH4 Methane</span>
                    <span className="font-bold text-amber-400">1.85% VOL</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  LEAL WARNING
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Motor Breaker</span>
                    <span className="font-bold text-slate-200">LOTO Lockout</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LOCKED
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">PPE Readiness</span>
                    <span className="font-bold text-slate-200">SCBA Mask</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  100% PASS
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 lg:p-6">
        {activeTab === 'ar' && (
          <ARSimulatorContainer
            currentLang={currentLang}
            onModuleComplete={handleModuleComplete}
            onNavigateToQuiz={() => setActiveTab('assessment')}
            onNavigateToCertificate={() => setActiveTab('certificate')}
          />
        )}

        {activeTab === 'telemetry' && (
          <Mine3DMapExplorer currentLang={currentLang} />
        )}

        {activeTab === 'scanner' && (
          <PreShiftFatigueScanner currentLang={currentLang} />
        )}

        {activeTab === 'gas' && (
          <GasPlumeSimulator currentLang={currentLang} />
        )}

        {activeTab === 'game' && (
          <HazardSpotterGame
            currentLang={currentLang}
            onNavigateToCertificate={() => setActiveTab('certificate')}
          />
        )}

        {activeTab === 'assistant' && (
          <SurakshaAssistant currentLang={currentLang} />
        )}

        {activeTab === 'explorer' && (
          <EquipmentExplorer currentLang={currentLang} />
        )}

        {activeTab === 'assessment' && (
          <AssessmentEngine
            currentLang={currentLang}
            onPassAssessment={handlePassAssessment}
          />
        )}

        {activeTab === 'certificate' && (
          <CertificateView
            currentLang={currentLang}
            activeWorker={activeWorker}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            currentLang={currentLang}
            onOpenScanner={() => setIsScannerOpen(true)}
            onViewWorkerCert={handleViewWorkerCert}
          />
        )}

        {activeTab === 'guide' && (
          <WorkerGuide currentLang={currentLang} />
        )}

        {/* Safety Fallback */}
        {!['ar', 'telemetry', 'scanner', 'gas', 'game', 'assessment', 'certificate', 'admin', 'guide', 'assistant', 'explorer'].includes(activeTab) && (
          <ARSimulatorContainer
            currentLang={currentLang}
            onModuleComplete={handleModuleComplete}
            onNavigateToQuiz={() => setActiveTab('assessment')}
            onNavigateToCertificate={() => setActiveTab('certificate')}
          />
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 py-4 text-center text-[11px] text-slate-500">
        <p className="font-semibold text-slate-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 inline" />
          <span>SurakshaAR - DGMS Industrial Safety Training Simulator</span>
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Factories Act 1948 & Mines Act 1952 Aligned | Santali (Ol Chiki) & Hindi Support
        </p>
      </footer>

      <QRVerifierModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      <EmergencySosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
      />
    </div>
  );
}
