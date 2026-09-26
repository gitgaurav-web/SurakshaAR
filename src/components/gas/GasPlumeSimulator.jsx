import React, { useState, useEffect, useRef } from 'react';
import { Wind, Flame, AlertOctagon, ShieldAlert, Thermometer, Gauge, Volume2, ShieldCheck, RefreshCw } from 'lucide-react';
import { voiceAssistant } from '../../utils/voiceAssistant';

const GAS_TYPES = {
  ch4: { name: "Methane (CH4)", lel: 5.0, uel: 15.0, color: "rgba(239, 68, 68, ", unit: "% vol", dangerMsg: "Explosive Risk! CH4 exceeds 5% LEL threshold." },
  co: { name: "Carbon Monoxide (CO)", lel: 50, uel: 400, color: "rgba(245, 158, 11, ", unit: "PPM", dangerMsg: "Toxic Threat! CO exceeds 50 PPM exposure limit." },
  h2s: { name: "Hydrogen Sulfide (H2S)", lel: 10, uel: 100, color: "rgba(168, 85, 247, ", unit: "PPM", dangerMsg: "Lethal Poison! H2S exceeds 10 PPM limit." },
  dust: { name: "Coal Dust Plume", lel: 40, uel: 200, color: "rgba(148, 163, 184, ", unit: "g/m³", dangerMsg: "Coal Dust Explosive Concentration High!" }
};

export default function GasPlumeSimulator({ currentLang = 'hi' }) {
  const [selectedGas, setSelectedGas] = useState('ch4');
  const [leakRate, setLeakRate] = useState(60); // L/min
  const [airflowCFM, setAirflowCFM] = useState(1500); // CFM ventilation speed
  const [tempC, setTempC] = useState(32); // Strata temperature
  const [fanStatus, setFanStatus] = useState(true);

  const [gasConcentration, setGasConcentration] = useState(2.4);
  const [isExplosive, setIsExplosive] = useState(false);

  const canvasRef = useRef(null);

  // Math simulation loop & Canvas Particle Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set high-DPI canvas bounds
    const width = (canvas.width = canvas.parentElement.clientWidth || 600);
    const height = (canvas.height = 320);

    // Particle pool
    const particles = Array.from({ length: 120 }, () => ({
      x: 60 + Math.random() * 20,
      y: height - 60 + (Math.random() * 20 - 10),
      radius: Math.random() * 12 + 8,
      opacity: Math.random() * 0.6 + 0.2,
      vx: (leakRate / 30) + Math.random() * 1.5,
      vy: -(Math.random() * 1.2 + 0.5) * (tempC / 25)
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Mine Shaft Underground Tunnel Walls
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Tunnel ceiling and floor lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(width, 40);
      ctx.moveTo(0, height - 40);
      ctx.lineTo(width, height - 40);
      ctx.stroke();

      // Draw Ventilation Fan Arrow Vectors
      const fanSpeedFactor = fanStatus ? airflowCFM / 1000 : 0.1;
      ctx.fillStyle = fanStatus ? '#10b981' : '#ef4444';
      ctx.font = '10px monospace';
      ctx.fillText(fanStatus ? `FAN ONLINE: ${airflowCFM} CFM ▶` : 'VENT FAN OFFLINE ✖', 20, 25);

      // Draw Gas Origin Valve Source
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(50, height - 70, 24, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.fillText('LEAK', 48, height - 75);

      // Render Particle Volumetric Flow
      const gasInfo = GAS_TYPES[selectedGas];

      particles.forEach(p => {
        // Dynamic velocity governed by airflow & temperature
        p.x += p.vx + fanSpeedFactor * 2.5;
        p.y += p.vy - (tempC * 0.02);
        p.radius += 0.15;
        p.opacity -= 0.003;

        // Reset particle when out of bounds or faded
        if (p.x > width || p.y < 30 || p.opacity <= 0) {
          p.x = 60 + Math.random() * 15;
          p.y = height - 60;
          p.radius = Math.random() * 10 + 6;
          p.opacity = Math.random() * 0.7 + 0.3;
        }

        // Radial Gradient for Soft Gas Volume Effect
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `${gasInfo.color}${p.opacity})`);
        grad.addColorStop(1, `${gasInfo.color}0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [selectedGas, leakRate, airflowCFM, tempC, fanStatus]);

  // Compute actual dynamic gas concentration logic
  useEffect(() => {
    // Math formula: Conc = (LeakRate * 1000) / (AirflowCFM * (fanStatus ? 1 : 0.05))
    const effectiveAirflow = fanStatus ? Math.max(200, airflowCFM) : 100;
    const conc = parseFloat(((leakRate * 120) / effectiveAirflow).toFixed(2));
    setGasConcentration(conc);

    const gasInfo = GAS_TYPES[selectedGas];
    const danger = conc >= gasInfo.lel;
    setIsExplosive(danger);

    if (danger) {
      voiceAssistant.speak(
        currentLang === 'hi'
          ? `चेतावनी! ${gasInfo.name} का स्तर खतरनाक हो गया है। वेंटिलेशन बढ़ाएं।`
          : `Warning! Dangerous concentration of ${gasInfo.name} detected. Activate auxiliary vent fan.`,
        currentLang
      );
    }
  }, [leakRate, airflowCFM, fanStatus, selectedGas, currentLang]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl max-w-4xl mx-auto my-4 text-slate-100">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 mb-6 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Volumetric Gas Plume Dispersion Simulator
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
                DGMS REG-114
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Underground Mine Ventilation CFD & Gas Explosive Limit (LEL) Dynamics
            </p>
          </div>
        </div>

        {/* Dynamic Gas Alert Badge */}
        <div className={`px-4 py-2 rounded-2xl border font-mono font-bold text-xs flex items-center space-x-2 ${
          isExplosive
            ? 'bg-red-950/90 border-red-500/80 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]'
            : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
        }`}>
          {isExplosive ? <AlertOctagon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{isExplosive ? 'EXPLOSIVE THRESHOLD BREACHED' : 'CONCENTRATION SAFE'}</span>
        </div>
      </div>

      {/* Gas Type Selection Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(GAS_TYPES).map(([key, gas]) => (
          <button
            key={key}
            onClick={() => setSelectedGas(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              selectedGas === key
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{gas.name}</span>
          </button>
        ))}
      </div>

      {/* 2D/3D Particle Canvas Viewport */}
      <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 mb-6 shadow-inner">
        <canvas ref={canvasRef} className="w-full h-64 block" />

        {/* Live HUD Overlay */}
        <div className="absolute top-4 right-4 bg-slate-950/90 border border-slate-800 p-3 rounded-xl backdrop-blur-md font-mono text-xs text-right">
          <span className="text-[10px] text-slate-400 block uppercase">Gas Concentration</span>
          <span className={`text-xl font-black ${isExplosive ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
            {gasConcentration} {GAS_TYPES[selectedGas].unit}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            LEL Limit: {GAS_TYPES[selectedGas].lel} {GAS_TYPES[selectedGas].unit}
          </span>
        </div>
      </div>

      {/* Interactive Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        {/* Control 1: Ventilation CFM */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-emerald-400" />
              <span>Vent Fan Airflow</span>
            </label>
            <span className="text-xs font-mono text-emerald-400 font-bold">{airflowCFM} CFM</span>
          </div>
          <input
            type="range"
            min="200"
            max="4000"
            step="100"
            value={airflowCFM}
            onChange={(e) => setAirflowCFM(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-[10px] text-slate-400">Main Ventilation Fan</span>
            <button
              onClick={() => setFanStatus(!fanStatus)}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
                fanStatus ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}
            >
              {fanStatus ? 'FAN ONLINE' : 'TOGGLE FAN POWER'}
            </button>
          </div>
        </div>

        {/* Control 2: Gas Leak Volume */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Gas Seepage Leak Rate</span>
            </label>
            <span className="text-xs font-mono text-amber-400 font-bold">{leakRate} L/min</span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            step="5"
            value={leakRate}
            onChange={(e) => setLeakRate(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Control 3: Strata Temp */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-purple-400" />
              <span>Strata Air Temperature</span>
            </label>
            <span className="text-xs font-mono text-purple-400 font-bold">{tempC} °C</span>
          </div>
          <input
            type="range"
            min="15"
            max="55"
            step="1"
            value={tempC}
            onChange={(e) => setTempC(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
