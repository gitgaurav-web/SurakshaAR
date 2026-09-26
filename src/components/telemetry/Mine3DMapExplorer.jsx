import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Activity, Wind, Flame, Droplets, ShieldCheck, Zap, AlertTriangle, 
  MapPin, RefreshCw, ChevronRight, Layers, Eye, Smartphone
} from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { playAudioBeep, speakInstruction } from '../../utils/audioEngine';

// Recursive Three.js Memory Disposal Cleanup Helper for low-RAM devices
function disposeThreeObject(obj) {
  if (!obj) return;
  if (obj.children) {
    while (obj.children.length > 0) {
      disposeThreeObject(obj.children[0]);
      obj.remove(obj.children[0]);
    }
  }
  if (obj.geometry) {
    obj.geometry.dispose();
  }
  if (obj.material) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach(m => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    } else {
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  }
}

export default function Mine3DMapExplorer({ currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const canvasRef = useRef(null);

  const [selectedPit, setSelectedPit] = useState('jharia'); // 'jharia', 'moonidih', 'digwadih'
  const [telemetry, setTelemetry] = useState({
    methane: 0.85,
    oxygen: 20.9,
    strataTemp: 29.4,
    airflowCFM: 4200,
    waterPumpStatus: 'NORMAL OPERATIONAL',
    alertLevel: 'NORMAL'
  });

  const [gyroEnabled, setGyroEnabled] = useState(false);

  // Pit Configurations
  const pits = [
    { id: 'jharia', name: 'Jharia Coalfield Pit #7', depth: '420m Below Surface', color: 'border-amber-500/50' },
    { id: 'moonidih', name: 'Moonidih Deep Shaft #3', depth: '560m Underground', color: 'border-cyan-500/50' },
    { id: 'digwadih', name: 'Digwadih Colliery Seam 14', depth: '380m Below Surface', color: 'border-emerald-500/50' }
  ];

  // Request Explicit Gyroscope Permission for iOS 13+ and Android 13+
  const requestGyroPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setGyroEnabled(true);
        }
      } catch (err) {
        console.warn('Gyro permission request:', err);
      }
    } else {
      setGyroEnabled(true);
    }
  };

  // Live Telemetry Stream Simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const noise = (Math.random() - 0.5) * 0.05;
      setTelemetry(prev => {
        const nextCH4 = Math.max(0.2, Math.min(2.5, prev.methane + noise));
        const isHighGas = nextCH4 > 1.25;
        return {
          ...prev,
          methane: Number(nextCH4.toFixed(2)),
          strataTemp: Number((29.4 + Math.sin(Date.now() * 0.001) * 1.5).toFixed(1)),
          airflowCFM: Math.floor(4200 + (Math.random() - 0.5) * 150),
          alertLevel: isHighGas ? 'WARNING' : 'NORMAL'
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Three.js 3D Pit Shaft Mesh Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 450;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 3.5, 5.0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);

    // Context Loss / Restoration Event Handlers
    const handleContextLost = (e) => {
      e.preventDefault();
      console.warn('WebGL Context Lost in Mine3DMapExplorer');
    };
    const handleContextRestored = () => {
      console.log('WebGL Context Restored');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xf59e0b, 2.0, 15);
    pointLight.position.set(0, 4, 2);
    scene.add(pointLight);

    // 3D Pit Shaft Underground Level Base
    const pitGroup = new THREE.Group();
    scene.add(pitGroup);

    // Shaft Vertical Columns
    for (let i = 0; i < 3; i++) {
      const columnGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.2, 16);
      const columnMat = new THREE.MeshStandardMaterial({
        color: i === 0 ? 0xf59e0b : i === 1 ? 0x06b6d4 : 0x10b981,
        wireframe: true
      });
      const columnMesh = new THREE.Mesh(columnGeo, columnMat);
      columnMesh.position.set(-2.0 + i * 2.0, 0, -1.0);
      pitGroup.add(columnMesh);
    }

    // Ground Grid Line
    const gridHelper = new THREE.GridHelper(8, 16, 0xf59e0b, 0x334155);
    gridHelper.position.y = -1.1;
    scene.add(gridHelper);

    // Animation Loop
    let animId;
    const animate = () => {
      pitGroup.rotation.y += 0.005;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      cancelAnimationFrame(animId);
      disposeThreeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [selectedPit]);

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-amber-500/40 p-4 rounded-3xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black rounded-2xl shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">3D Mine Telemetry Map Explorer</h2>
            <p className="text-[11px] text-slate-400">DGMS Dhanbad Cluster Shaft Telemetry Console</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!gyroEnabled && (
            <button
              onClick={requestGyroPermission}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 flex items-center space-x-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Enable Motion Gyro</span>
            </button>
          )}

          {pits.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPit(p.id);
                playAudioBeep('pass');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedPit === p.id 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black' 
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Viewport & Live Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 3D WebGL Mine Shaft Viewport */}
        <div className="lg:col-span-2 relative h-[380px] bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />

          <div className="absolute top-3 left-3 bg-slate-950/90 px-3.5 py-1.5 rounded-full border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center space-x-2 shadow-lg">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">{pits.find(p => p.id === selectedPit)?.name}</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400 font-bold">{pits.find(p => p.id === selectedPit)?.depth}</span>
          </div>

          <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2.5 py-1 rounded-md">
            Interactive 3D Telemetry WebGL Engine
          </div>
        </div>

        {/* Live Telemetry Sensor Cards */}
        <div className="space-y-3 flex flex-col justify-between">
          {/* Sensor 1: Methane Gas */}
          <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-xl transition-all ${
            telemetry.methane > 1.25 ? 'bg-red-950/40 border-red-500/60' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-bold text-slate-400 flex items-center space-x-1">
                <Wind className="w-4 h-4 text-red-400" />
                <span>METHANE (CH4) CONCENTRATION</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase border ${
                telemetry.methane > 1.25 ? 'bg-red-500/30 text-red-300 border-red-500' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {telemetry.methane > 1.25 ? 'HIGH RISK' : 'SAFE'}
              </span>
            </div>
            <div className="text-2xl font-mono font-black text-white">
              {telemetry.methane}% <span className="text-xs text-slate-400 font-normal">VOL (Limit 1.25%)</span>
            </div>
          </div>

          {/* Sensor 2: Strata Temperature */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-bold text-slate-400 flex items-center space-x-1">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>STRATA AMBIENT TEMPERATURE</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-extrabold">OPTIMAL</span>
            </div>
            <div className="text-2xl font-mono font-black text-white">
              {telemetry.strataTemp}°C <span className="text-xs text-slate-400 font-normal">({((telemetry.strataTemp * 9/5) + 32).toFixed(1)}°F)</span>
            </div>
          </div>

          {/* Sensor 3: Airflow & Pump */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 flex items-center space-x-1">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>VENTILATION AIRFLOW</span>
              </span>
              <span className="text-xs font-mono font-extrabold text-cyan-300">{telemetry.airflowCFM} CFM</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">PIT SUMP PUMPS:</span>
              <span className="text-emerald-400 font-bold">{telemetry.waterPumpStatus}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
