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
import { TRANSLATIONS } from './locales/translations';
import { saveWorkerEvaluation } from './utils/offlineStorage';

export default function App() {
  const [currentLang, setCurrentLang] = useState('hi');
  const [activeTab, setActiveTab] = useState('ar');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  
  const [activeWorker, setActiveWorker] = useState({
    id: "JHK-MN-2026-081",
    name: "Budhan Manjhi",
    language: "sat",
    mineSector: "Jharia Coalfield, Dhanbad Cluster",
    orientationDays: 14,
    score: 92,
    certified: true,
    certHash: "0x8F9A7B3C2D1E4F5A",
    certDate: new Date().toISOString().split('T')[0]
  });

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const handleModuleComplete = (moduleName, score) => {
    console.log(`Module ${moduleName} completed with score ${score}`);
  };

  const handlePassAssessment = (finalScore) => {
    const updated = saveWorkerEvaluation({
      ...activeWorker,
      score: finalScore,
      language: currentLang
    });
    setActiveWorker(updated);
    setActiveTab('certificate');
  };

  const handleViewWorkerCert = (workerData) => {
    setActiveWorker(workerData);
    setActiveTab('certificate');
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 lg:p-6">
        {activeTab === 'ar' && (
          <ARSimulatorContainer
            currentLang={currentLang}
            onModuleComplete={handleModuleComplete}
            onNavigateToQuiz={() => setActiveTab('assessment')}
          />
        )}

        {activeTab === 'game' && (
          <HazardSpotterGame currentLang={currentLang} />
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

        {/* Safety Fallback to prevent any blank screen */}
        {!['ar', 'game', 'assistant', 'explorer', 'assessment', 'certificate', 'admin', 'guide'].includes(activeTab) && (
          <ARSimulatorContainer
            currentLang={currentLang}
            onModuleComplete={handleModuleComplete}
            onNavigateToQuiz={() => setActiveTab('assessment')}
          />
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 py-4 text-center text-[11px] text-slate-500">
        <p className="font-semibold text-slate-400">
          SurakshaAR - DGMS Industrial Safety Training Simulator
        </p>
        <p className="text-[10px]">
          Factories Act 1948 & Mines Act 1952 Aligned | Santali (Ol Chiki) & Hindi
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
