import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { 
  Camera, Volume2, VolumeX, ShieldAlert, CheckCircle2, RotateCcw, 
  ChevronRight, ChevronLeft, Flame, Wind, Cog, AlertTriangle, 
  Lock, RefreshCw, Layers, Eye, Sun, Moon
} from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { speakInstruction, playAudioBeep } from '../../utils/audioEngine';

// Recursive Three.js Memory Disposal Cleanup Helper to prevent RAM leaks on low-RAM phones
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

export default function ARSimulatorContainer({ currentLang, onModuleComplete }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const particlesRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [filterMode, setFilterMode] = useState('ar');
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [selectedModule, setSelectedModule] = useState('fire');
  const [currentStep, setCurrentStep] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [moduleFinished, setModuleFinished] = useState(false);
  
  // Interactive Drill States
  const [extinguisherType, setExtinguisherType] = useState('dcp');
  const [passState, setPassState] = useState({ pullPin: false, aimBase: false, squeezeTrigger: false, sweepProgress: 0 });
  const [scbaSelected, setScbaSelected] = useState(false);
  const [gasCutoffDone, setGasCutoffDone] = useState(false);
  const [gasPpm, setGasPpm] = useState(1.85);
  const [lotoApplied, setLotoApplied] = useState(false);
  const [gyroAngle, setGyroAngle] = useState(0);

  // Initialize Camera Stream
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Camera stream unavailable, switching to 3D Virtual mode.', err);
        setCameraActive(false);
        setFilterMode('virtual');
      }
    }
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Gyroscope / DeviceOrientation Tracking Listener
  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.gamma !== null) {
        // Tilt left/right
        setGyroAngle(event.gamma * 0.5);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // Initialize Three.js Scene with memory cleanup & disposal
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 3);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffaa00, 2.5, 12);
    pointLight.position.set(0, 2.5, 1);
    scene.add(pointLight);

    const arGroup = new THREE.Group();
    arGroup.name = "arGroup";
    scene.add(arGroup);

    // Particle System
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2;
      positions[i + 1] = Math.random() * 1.5;
      positions[i + 2] = -1 - Math.random() * 1.2;

      colors[i] = 1.0;
      colors[i + 1] = 0.4 + Math.random() * 0.4;
      colors[i + 2] = 0.0;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    particles.name = "particles";
    scene.add(particles);
    particlesRef.current = particles;

    let clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      if (particlesRef.current) {
        const posAttr = particlesRef.current.geometry.attributes.position;
        for (let i = 1; i < posAttr.count * 3; i += 3) {
          posAttr.array[i] += 0.015;
          if (posAttr.array[i] > 2) posAttr.array[i] = 0;
        }
        posAttr.needsUpdate = true;
      }

      const group = scene.getObjectByName("arGroup");
      if (group) {
        group.rotation.y = (gyroAngle * Math.PI / 180) + Math.sin(elapsedTime * 0.5) * 0.1;
        group.position.y = Math.sin(elapsedTime * 1.5) * 0.04;
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      disposeThreeObject(scene);
      renderer.dispose();
    };
  }, [gyroAngle]);

  // Update 3D Geometry with Memory Disposal on switch
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    let arGroup = scene.getObjectByName("arGroup");
    if (!arGroup) return;

    // Flush & Dispose previous 3D Geometries & Materials to avoid RAM leaks
    disposeThreeObject(arGroup);

    if (selectedModule === 'fire') {
      const tankGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.9, 32);
      const tankMat = new THREE.MeshStandardMaterial({
        color: extinguisherType === 'dcp' ? 0xdc2626 : 0x0284c7,
        metalness: 0.7,
        roughness: 0.2
      });
      const tankMesh = new THREE.Mesh(tankGeo, tankMat);
      tankMesh.position.set(0.5, -0.2, -1.2);
      arGroup.add(tankMesh);

      const hoseGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 16);
      const hoseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const hoseMesh = new THREE.Mesh(hoseGeo, hoseMat);
      hoseMesh.rotation.z = Math.PI / 3;
      hoseMesh.position.set(0.3, 0.2, -1.2);
      arGroup.add(hoseMesh);

      for (let i = 0; i < 3; i++) {
        const arrowGeo = new THREE.ConeGeometry(0.18, 0.45, 4);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
        arrowMesh.rotation.z = -Math.PI / 2;
        arrowMesh.position.set(-1.0 + i * 0.7, -0.5, -1 - i * 0.2);
        arGroup.add(arrowMesh);
      }
    } else if (selectedModule === 'gas') {
      const gasCloudGeo = new THREE.SphereGeometry(0.75, 24, 24);
      const gasCloudMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        emissive: 0xa16207,
        transparent: true,
        opacity: gasCutoffDone ? 0.15 : 0.65,
        wireframe: true
      });
      const gasCloudMesh = new THREE.Mesh(gasCloudGeo, gasCloudMat);
      gasCloudMesh.position.set(0, 0.5, -1.5);
      arGroup.add(gasCloudMesh);

      const scbaGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.8, 24);
      const scbaMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8 });
      const scbaMesh = new THREE.Mesh(scbaGeo, scbaMat);
      scbaMesh.position.set(-0.6, -0.1, -1.2);
      arGroup.add(scbaMesh);
    } else if (selectedModule === 'machinery') {
      const beltGeo = new THREE.CylinderGeometry(0.45, 0.45, 2.3, 32);
      const beltMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
      const beltMesh = new THREE.Mesh(beltGeo, beltMat);
      beltMesh.rotation.z = Math.PI / 2;
      beltMesh.position.set(0, -0.1, -1.5);
      arGroup.add(beltMesh);

      const lockGeo = new THREE.BoxGeometry(0.25, 0.3, 0.15);
      const lockMat = new THREE.MeshStandardMaterial({ color: lotoApplied ? 0x10b981 : 0xef4444, metalness: 0.9 });
      const lockMesh = new THREE.Mesh(lockGeo, lockMat);
      lockMesh.position.set(0, 0.3, -1.3);
      arGroup.add(lockMesh);
    }

    if (audioEnabled) {
      let promptText = "";
      if (selectedModule === 'fire') {
        promptText = currentStep === 1 ? t.m1Step1Detail : currentStep === 2 ? t.m1Step2Detail : currentStep === 3 ? t.m1Step3Detail : t.m1Step4Detail;
      } else if (selectedModule === 'gas') {
        promptText = currentStep === 1 ? t.m2Step1Detail : currentStep === 2 ? t.m2Step2Detail : currentStep === 3 ? t.m2Step3Detail : t.m2Step4Detail;
      } else {
        promptText = currentStep === 1 ? t.m3Step1Detail : t.m3Step2Detail;
      }
      speakInstruction(promptText, currentLang);
    }
  }, [selectedModule, currentStep, currentLang, audioEnabled, extinguisherType, gasCutoffDone, lotoApplied]);

  // Handle P.A.S.S. Actions
  const handlePassAction = (action) => {
    if (action === 'pullPin') {
      setPassState(prev => ({ ...prev, pullPin: true }));
      playAudioBeep('pass');
    } else if (action === 'aimBase') {
      setPassState(prev => ({ ...prev, aimBase: true }));
      playAudioBeep('pass');
    } else if (action === 'squeezeTrigger') {
      setPassState(prev => ({ ...prev, squeezeTrigger: true }));
      playAudioBeep('pass');
    } else if (action === 'sweep') {
      setPassState(prev => {
        const nextSweep = Math.min(100, prev.sweepProgress + 25);
        if (nextSweep >= 100) playAudioBeep('success');
        else playAudioBeep('pass');
        return { ...prev, sweepProgress: nextSweep };
      });
    }
  };

  const advanceStep = () => {
    const totalSteps = selectedModule === 'fire' ? 4 : selectedModule === 'gas' ? 4 : 2;
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      setModuleFinished(true);
      playAudioBeep('success');
      if (onModuleComplete) onModuleComplete(selectedModule, 95);
    }
  };

  return (
    <div className={`w-full border rounded-2xl shadow-xl overflow-hidden flex flex-col space-y-2 ${
      highContrastMode ? 'bg-black text-yellow-300 border-yellow-400' : 'bg-slate-950 text-slate-100 border-slate-800'
    }`}>
      {/* 1. Module Selector Tabs with 48px Touch Targets for gloves */}
      <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1.5 border-b border-slate-800">
        <button
          onClick={() => { setSelectedModule('fire'); setCurrentStep(1); setModuleFinished(false); }}
          className={`min-h-[48px] py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center space-x-1 transition-all ${
            selectedModule === 'fire'
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="truncate">Fire Safety</span>
        </button>

        <button
          onClick={() => { setSelectedModule('gas'); setCurrentStep(1); setModuleFinished(false); }}
          className={`min-h-[48px] py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center space-x-1 transition-all ${
            selectedModule === 'gas'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span className="truncate">Gas SCBA</span>
        </button>

        <button
          onClick={() => { setSelectedModule('machinery'); setCurrentStep(1); setModuleFinished(false); }}
          className={`min-h-[48px] py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center space-x-1 transition-all ${
            selectedModule === 'machinery'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cog className="w-4 h-4" />
          <span className="truncate">Machinery</span>
        </button>
      </div>

      {/* 2. Mode Controls Bar */}
      <div className="flex items-center justify-between px-3 text-xs">
        <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterMode('ar')}
            className={`px-2 py-1 min-h-[36px] rounded-md text-[10px] font-bold ${
              filterMode === 'ar' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            AR Camera
          </button>
          <button
            onClick={() => setFilterMode('thermal')}
            className={`px-2 py-1 min-h-[36px] rounded-md text-[10px] font-bold ${
              filterMode === 'thermal' ? 'bg-red-600 text-white' : 'text-slate-400'
            }`}
          >
            Thermal
          </button>
          <button
            onClick={() => setFilterMode('virtual')}
            className={`px-2 py-1 min-h-[36px] rounded-md text-[10px] font-bold ${
              filterMode === 'virtual' ? 'bg-cyan-600 text-white' : 'text-slate-400'
            }`}
          >
            3D View
          </button>
        </div>

        {/* High-Contrast Outdoor Sunlight Mode Toggle */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setHighContrastMode(!highContrastMode)}
            className={`p-2 min-h-[40px] rounded-lg border font-bold text-xs flex items-center space-x-1 ${
              highContrastMode ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
            title="High-Contrast Outdoor Sunlight Mode"
          >
            <Sun className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 min-h-[40px] rounded-lg border text-xs font-semibold ${
              audioEnabled ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. AR Camera & 3D Canvas Viewport */}
      <div className={`relative w-full h-[340px] bg-slate-950 overflow-hidden flex items-center justify-center ${
        filterMode === 'thermal' ? 'thermal-filter' : ''
      }`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${cameraActive && filterMode !== 'virtual' ? 'opacity-85' : 'hidden'}`}
        />

        {(!cameraActive || filterMode === 'virtual') && (
          <div className="absolute inset-0 mine-grid-bg flex items-center justify-center" />
        )}

        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        <div className="absolute top-2 left-2 z-20 flex items-center space-x-1.5 bg-slate-950/90 px-2.5 py-1 rounded-full border border-red-500/30">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[10px] font-mono font-bold text-red-400">CH4: {gasPpm}% VOL</span>
        </div>

        {/* Extinguisher Selection UI with 48px touch targets */}
        {selectedModule === 'fire' && currentStep === 2 && (
          <div className="absolute bottom-3 left-3 right-3 z-30 bg-slate-950/95 border border-amber-500/40 p-3 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-amber-400 block">Select Extinguisher Type</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExtinguisherType('dcp')}
                className={`min-h-[48px] p-2 rounded-lg text-[10px] font-bold text-left border ${
                  extinguisherType === 'dcp' ? 'bg-red-600/30 border-red-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                DCP Powder (Recommended)
              </button>
              <button
                onClick={() => setExtinguisherType('co2')}
                className={`min-h-[48px] p-2 rounded-lg text-[10px] font-bold text-left border ${
                  extinguisherType === 'co2' ? 'bg-blue-600/30 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                CO2 Gas Canister
              </button>
            </div>
            <button
              onClick={advanceStep}
              className="w-full min-h-[48px] py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-lg"
            >
              Start P.A.S.S. Drill
            </button>
          </div>
        )}

        {/* P.A.S.S. Controls UI with 48px touch targets */}
        {selectedModule === 'fire' && currentStep === 3 && (
          <div className="absolute bottom-3 left-3 right-3 z-30 bg-slate-950/95 border border-amber-500/40 p-3 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-amber-400 block">P.A.S.S. Fire Drill</span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <button
                onClick={() => handlePassAction('pullPin')}
                className={`min-h-[48px] p-2 rounded-lg font-bold border ${passState.pullPin ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
              >
                1. Pull Pin
              </button>
              <button
                disabled={!passState.pullPin}
                onClick={() => handlePassAction('aimBase')}
                className={`min-h-[48px] p-2 rounded-lg font-bold border ${passState.aimBase ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 disabled:opacity-40'}`}
              >
                2. Aim Base
              </button>
              <button
                disabled={!passState.aimBase}
                onClick={() => handlePassAction('squeezeTrigger')}
                className={`min-h-[48px] p-2 rounded-lg font-bold border ${passState.squeezeTrigger ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 disabled:opacity-40'}`}
              >
                3. Squeeze
              </button>
              <button
                disabled={!passState.squeezeTrigger}
                onClick={() => handlePassAction('sweep')}
                className={`min-h-[48px] p-2 rounded-lg font-bold border ${passState.sweepProgress >= 100 ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-amber-500 text-slate-950 disabled:opacity-40'}`}
              >
                4. Sweep ({passState.sweepProgress}%)
              </button>
            </div>
          </div>
        )}

        {/* Finished Module Overlay */}
        {moduleFinished && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
            <h3 className="text-base font-bold text-white">Module Passed!</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => { setModuleFinished(false); setCurrentStep(1); }}
                className="min-h-[48px] px-4 py-2 bg-slate-900 text-slate-300 rounded-lg text-xs font-bold"
              >
                Re-drill
              </button>
              <button
                onClick={advanceStep}
                className="min-h-[48px] px-5 py-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
              >
                Take Quiz
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Step Navigation */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
        <div className="text-xs">
          <span className="text-amber-400 font-bold block">
            {selectedModule === 'fire' 
              ? (currentStep === 1 ? t.m1Step1 : currentStep === 2 ? t.m1Step2 : currentStep === 3 ? t.m1Step3 : t.m1Step4)
              : selectedModule === 'gas'
              ? (currentStep === 1 ? t.m2Step1 : currentStep === 2 ? t.m2Step2 : currentStep === 3 ? t.m2Step3 : t.m2Step4)
              : (currentStep === 1 ? t.m3Step1 : t.m3Step2)}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="min-h-[48px] min-w-[48px] p-2 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-40 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={advanceStep}
            className="min-h-[48px] px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center space-x-1"
          >
            <span>{t.nextStep}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
