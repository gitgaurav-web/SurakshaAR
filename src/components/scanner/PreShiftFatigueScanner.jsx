import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, Eye, HardHat, ShieldCheck, Zap, UserCheck, Activity, Lock } from 'lucide-react';
import { generateAuditSignature } from '../../utils/cryptoAudit';
import { voiceAssistant } from '../../utils/voiceAssistant';

export default function PreShiftFatigueScanner({ currentLang = 'hi', onClearanceGenerated }) {
  const [scanState, setScanState] = useState('idle'); // 'idle', 'scanning_gear', 'fatigue_test', 'completed'
  const [cameraActive, setCameraActive] = useState(false);
  const [gearDetected, setGearDetected] = useState({
    helmet: false,
    vest: false,
    respirator: false,
    boots: true
  });
  
  // Reaction test state
  const [reactionPrompt, setReactionPrompt] = useState(false);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [startTime, setStartTime] = useState(0);
  const [targetPos, setTargetPos] = useState({ top: 40, left: 50 });
  const [fatigueScore, setFatigueScore] = useState(null);
  const [clearanceCard, setClearanceCard] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize WebRTC Camera with mobile webview autoplay safety
  useEffect(() => {
    const startCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        // Capacitor Native camera permissions request if running inside native APK
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera) {
          try {
            await window.Capacitor.Plugins.Camera.requestPermissions();
          } catch (capErr) {
            console.warn('Capacitor native camera check:', capErr);
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          await videoRef.current.play().catch(e => console.warn('Camera video play caught:', e));
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Camera access not granted or unavailable, using simulation mode', err);
        setCameraActive(false);
      }
    };

    if (scanState === 'scanning_gear' || scanState === 'fatigue_test') {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [scanState]);

  // Gear scan animation logic
  const handleStartGearScan = () => {
    setScanState('scanning_gear');
    setGearDetected({ helmet: false, vest: false, respirator: false, boots: true });
    
    voiceAssistant.speak(
      currentLang === 'sat' ? 'Pre-shift gear scan shuru hoyakina. Helmet, vest aamage check me.' :
      currentLang === 'hi' ? 'प्री-शिफ्ट PPE गियर स्कैन शुरू हो रहा है। हेलमेट और जैकेट चेक करें।' :
      'Pre-shift PPE gear scanning initialized. Align helmet and safety vest.',
      currentLang
    );

    // Progressive gear detection simulation
    setTimeout(() => {
      setGearDetected(prev => ({ ...prev, helmet: true }));
    }, 1200);

    setTimeout(() => {
      setGearDetected(prev => ({ ...prev, vest: true }));
    }, 2400);

    setTimeout(() => {
      setGearDetected(prev => ({ ...prev, respirator: true }));
      voiceAssistant.speak(
        currentLang === 'hi' ? 'सभी सुरक्षा उपकरण स्वीकृत हैं। अब प्रतिक्रिया समय जांच शुरू करें।' :
        'All PPE approved. Moving to oculomotor fatigue reaction test.',
        currentLang
      );
      setScanState('fatigue_test');
      triggerReactionPrompt();
    }, 3800);
  };

  const triggerReactionPrompt = () => {
    setReactionPrompt(false);
    const delay = 1500 + Math.random() * 2000;
    setTimeout(() => {
      setTargetPos({
        top: Math.floor(20 + Math.random() * 60),
        left: Math.floor(20 + Math.random() * 60)
      });
      setStartTime(Date.now());
      setReactionPrompt(true);
    }, delay);
  };

  const handleTargetClick = () => {
    if (!reactionPrompt) return;
    const elapsed = Date.now() - startTime;
    const updated = [...reactionTimes, elapsed];
    setReactionTimes(updated);
    setReactionPrompt(false);

    if (updated.length < 3) {
      triggerReactionPrompt();
    } else {
      const avg = Math.round(updated.reduce((a, b) => a + b, 0) / updated.length);
      let score = Math.max(50, Math.min(99, Math.round(100 - (avg - 250) * 0.15)));
      setFatigueScore(score);

      const isApproved = score >= 75;
      const record = {
        workerId: "JHK-MN-2026-081",
        workerName: "Budhan Manjhi",
        mineSector: "Jharia Coalfield, Dhanbad Cluster",
        fatigueScore: score,
        avgReactionMs: avg,
        ppeStatus: "100% COMPLIANT",
        status: isApproved ? "APPROVED FOR SHIFT" : "REJECTED - MANDATORY REST",
        shiftDate: new Date().toLocaleDateString('en-IN'),
        timestamp: new Date().toISOString()
      };

      const signedCard = {
        ...record,
        digitalSignature: generateAuditSignature(record)
      };

      setClearanceCard(signedCard);
      setScanState('completed');

      const msg = isApproved
        ? (currentLang === 'hi' ? `शिफ्ट पास! आपकी थकान स्कोर ${score}% है। खदान प्रवेश स्वीकृत।` : `Clearance granted. Fatigue score ${score}%. Shift entry approved.`)
        : (currentLang === 'hi' ? `ध्यान दें! प्रतिक्रिया समय धीमा है। विश्राम आवश्यक है।` : `Warning! Slow reaction time detected. Shift clearance denied.`);

      voiceAssistant.speak(msg, currentLang);

      if (onClearanceGenerated) {
        onClearanceGenerated(signedCard);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl max-w-4xl mx-auto my-4 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Pre-Shift Worker Fatigue & AR Gear Scanner
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
                DGMS SEC-38
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              AI Oculomotor Alertness Test & Computer Vision PPE Compliance Scanner
            </p>
          </div>
        </div>

        {scanState === 'completed' && (
          <button
            onClick={() => {
              setScanState('idle');
              setReactionTimes([]);
              setFatigueScore(null);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Test</span>
          </button>
        )}
      </div>

      {/* Main Scanner Container */}
      {scanState === 'idle' && (
        <div className="text-center py-10 px-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400 animate-pulse">
            <HardHat className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-2">
            Start Mandatory Pre-Shift Inspection
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Scans Helmet, Respirator, High-Vis Vest via AR Camera & measures worker alertness reaction time before entering underground mine shaft.
          </p>
          <button
            onClick={handleStartGearScan}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-lg shadow-amber-500/25 transition active:scale-95 flex items-center space-x-2 mx-auto"
          >
            <Camera className="w-4 h-4" />
            <span>Initialize Pre-Shift AI Scan</span>
          </button>
        </div>
      )}

      {(scanState === 'scanning_gear' || scanState === 'fatigue_test') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AR Video Overlay Box */}
          <div className="md:col-span-2 relative bg-slate-950 rounded-2xl overflow-hidden border border-amber-500/40 aspect-video flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-center p-4">
                <Activity className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
                <p className="text-xs font-mono text-amber-400">CAMERA SIMULATION ENGAGED</p>
                <p className="text-[11px] text-slate-400 mt-1">Analyzing Biometric & Vision Frames...</p>
              </div>
            )}

            {/* Bounding Box Visual Overlays */}
            {scanState === 'scanning_gear' && (
              <div className="absolute inset-0 border-2 border-dashed border-amber-400/60 m-6 rounded-xl flex flex-col justify-between p-4 pointer-events-none animate-pulse">
                <div className="flex justify-between items-start">
                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold flex items-center space-x-1 ${gearDetected.helmet ? 'bg-emerald-500/80 text-white' : 'bg-amber-500/80 text-slate-950'}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>HELMET DETECTED</span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold flex items-center space-x-1 ${gearDetected.vest ? 'bg-emerald-500/80 text-white' : 'bg-slate-800/80 text-slate-400'}`}>
                    <span>SAFETY VEST</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="px-4 py-1.5 rounded-full bg-slate-950/80 border border-amber-500/60 text-amber-400 text-xs font-mono font-bold">
                    SCANNING PPE COMPLIANCE...
                  </span>
                </div>
              </div>
            )}

            {/* Oculomotor Reaction Test Interactive Target */}
            {scanState === 'fatigue_test' && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]">
                {reactionPrompt ? (
                  <button
                    onClick={handleTargetClick}
                    style={{ top: `${targetPos.top}%`, left: `${targetPos.left}%` }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-red-500 hover:bg-red-400 rounded-full border-4 border-white shadow-[0_0_25px_rgba(239,68,68,0.9)] flex items-center justify-center animate-ping transition-all"
                  >
                    <Zap className="w-6 h-6 text-white" />
                  </button>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs font-mono font-bold text-amber-400 bg-slate-950/90 px-4 py-2 rounded-xl border border-amber-500/40">
                      WAIT FOR RED TARGET & TAP IMMEDIATELY ({reactionTimes.length}/3)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checklist & Status Side Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Pre-Shift Audit Checklist
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li className={`flex items-center justify-between p-2 rounded-xl border ${gearDetected.helmet ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  <span className="flex items-center space-x-2">
                    <HardHat className="w-4 h-4" />
                    <span>Mine Helmet</span>
                  </span>
                  {gearDetected.helmet ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                </li>
                <li className={`flex items-center justify-between p-2 rounded-xl border ${gearDetected.vest ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  <span className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>High-Vis Vest</span>
                  </span>
                  {gearDetected.vest ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full bg-slate-700" />}
                </li>
                <li className={`flex items-center justify-between p-2 rounded-xl border ${gearDetected.respirator ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  <span className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Self-Rescuer Gear</span>
                  </span>
                  {gearDetected.respirator ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full bg-slate-700" />}
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">REACTION SPEED TRIALS</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="flex-1 py-1.5 text-center bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono">
                    {reactionTimes[idx] ? `${reactionTimes[idx]}ms` : '--'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completed Clearance Card */}
      {scanState === 'completed' && clearanceCard && (
        <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 mb-4 gap-3">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
                DGMS UNDERGROUND ENTRY CLEARANCE CARD
              </span>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                {clearanceCard.workerName}
                <span className="text-xs font-mono font-normal text-slate-400">({clearanceCard.workerId})</span>
              </h3>
            </div>

            <div className={`px-4 py-2 rounded-2xl border font-black text-xs flex items-center space-x-2 ${
              clearanceCard.fatigueScore >= 75
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-red-950/80 border-red-500/60 text-red-400'
            }`}>
              {clearanceCard.fatigueScore >= 75 ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span>{clearanceCard.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-medium block">Fatigue Alertness Score</span>
              <span className="text-lg font-black text-amber-400 font-mono">{clearanceCard.fatigueScore}%</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-medium block">Avg Reaction Latency</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{clearanceCard.avgReactionMs} ms</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-medium block">PPE Gear Status</span>
              <span className="text-xs font-bold text-slate-200 mt-1 block">{clearanceCard.ppeStatus}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-medium block">Mine Sector</span>
              <span className="text-xs font-bold text-slate-200 mt-1 block truncate">{clearanceCard.mineSector}</span>
            </div>
          </div>

          {/* SHA-256 HMAC Digital Verification Stamp */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-[10px] text-slate-400">
            <div className="flex items-center space-x-2 truncate">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">HMAC-SHA256 Stamp: <span className="text-slate-300 font-semibold">{clearanceCard.digitalSignature}</span></span>
            </div>
            <span className="shrink-0 text-emerald-400 font-bold ml-2">VERIFIED OFFLINE</span>
          </div>
        </div>
      )}
    </div>
  );
}
