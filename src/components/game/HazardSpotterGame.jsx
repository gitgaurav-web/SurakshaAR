import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Clock, RotateCcw, Flame, AlertTriangle, Sparkles, Award } from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { playAudioBeep, speakInstruction } from '../../utils/audioEngine';
import confetti from 'canvas-confetti';

export default function HazardSpotterGame({ currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [hazards, setHazards] = useState([
    { id: 1, name: "Un-inspected Fire Extinguisher", found: false, x: 20, y: 30, desc: "Safety pin missing & pressure dial expired!" },
    { id: 2, name: "High Methane Gas Leak Pipe", found: false, x: 70, y: 25, desc: "CH4 pipe joint leaking gas fumes!" },
    { id: 3, name: "Exposed High-Voltage Wire", found: false, x: 45, y: 65, desc: "Unisolated electrical cable near coal dust!" },
    { id: 4, name: "Unguarded Conveyor Belt Roller", found: false, x: 80, y: 70, desc: "LOTO lock missing on moving belt drive!" },
    { id: 5, name: "Unsealed Mine Shaft Wall", found: false, x: 15, y: 75, desc: "Cracked tunnel wall needing roof bolting!" }
  ]);

  useEffect(() => {
    let timer = null;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
      setGameOver(true);
      playAudioBeep('alarm');
    }
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
    setGameActive(true);
    setHazards(prev => prev.map(h => ({ ...h, found: false })));
    playAudioBeep('pass');
    speakInstruction("Spot all 5 industrial mine hazards before the timer runs out!", currentLang);
  };

  const handleSpotHazard = (id) => {
    if (!gameActive) return;
    setHazards(prev => prev.map(h => {
      if (h.id === id && !h.found) {
        playAudioBeep('success');
        setScore(s => s + 20);
        return { ...h, found: true };
      }
      return h;
    }));

    // Check if all found
    const remaining = hazards.filter(h => h.id !== id && !h.found).length;
    if (remaining === 0) {
      setGameActive(false);
      setGameOver(true);
      playAudioBeep('success');
      try { confetti({ particleCount: 120, spread: 80 }); } catch (err) {}
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>AR Mine Hazard Spotting Challenge</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400">Scan & tap 5 hidden workplace hazards within 60 seconds</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold text-amber-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{timeLeft}s</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold text-emerald-400">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>{score} PTS</span>
          </div>
        </div>
      </div>

      {!gameActive && !gameOver ? (
        <div className="text-center py-10 bg-slate-950/80 rounded-2xl border border-slate-800 p-6 space-y-4">
          <ShieldAlert className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
          <h3 className="text-xl font-black text-white">Interactive AR Safety Inspection Drill</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Test your hazard perception skills! Find and tap all 5 dangerous mine conditions hidden inside the simulated coal shaft environment.
          </p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-xl hover:brightness-110"
          >
            Start Hazard Spotting Drill
          </button>
        </div>
      ) : (
        <div className="relative w-full h-[400px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden mine-grid-bg">
          {/* Simulated Mine Background with interactive hazard targets */}
          {hazards.map((h) => (
            <button
              key={h.id}
              onClick={() => handleSpotHazard(h.id)}
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              className={`absolute p-3 rounded-2xl font-bold text-xs transition-all transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1.5 shadow-2xl ${
                h.found
                  ? 'bg-emerald-600 text-white border-2 border-emerald-400 scale-95'
                  : 'bg-red-600/90 text-white border-2 border-red-400 animate-pulse hover:scale-110'
              }`}
            >
              {h.found ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="text-[11px] font-extrabold">{h.name}</span>
            </button>
          ))}

          {gameOver && (
            <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Award className="w-16 h-16 text-amber-400 animate-bounce" />
              <h3 className="text-2xl font-black text-white">Challenge Completed!</h3>
              <p className="text-xs text-slate-300">
                You scored <strong className="text-amber-400 text-base">{score} / 100 PTS</strong> in mine hazard detection.
              </p>
              <button
                onClick={startGame}
                className="px-6 py-3 bg-amber-500 text-slate-950 font-black rounded-2xl text-xs flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
