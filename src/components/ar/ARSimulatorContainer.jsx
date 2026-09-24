import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { 
  Camera, Volume2, VolumeX, ShieldAlert, CheckCircle2, RotateCcw, 
  ChevronRight, ChevronLeft, Flame, Wind, Cog, AlertTriangle, 
  Lock, RefreshCw, Layers, Eye, Sun, Moon, Activity, Zap, CheckSquare
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
  const extinguisherSprayRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [filterMode, setFilterMode] = useState('ar'); // 'ar', 'thermal', 'virtual'
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [selectedModule, setSelectedModule] = useState('fire'); // 'fire', 'gas', 'machinery'
  const [currentStep, setCurrentStep] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [moduleFinished, setModuleFinished] = useState(false);
  
  // 360° Orbit Rotation States for 3D View
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const previousTouchRef = useRef({ x: 0, y: 0 });
  const [gyroAngle, setGyroAngle] = useState(0);

  // Module 1: Fire Safety Drill States
  const [extinguisherType, setExtinguisherType] = useState('dcp');
  const [passState, setPassState] = useState({ pullPin: false, aimBase: false, squeezeTrigger: false, sweepProgress: 0 });

  // Module 2: Gas SCBA Drill States
  const [gasPpm, setGasPpm] = useState(1.85);
  const [gasCalibrated, setGasCalibrated] = useState(false);
  const [scbaMaskEquipped, setScbaMaskEquipped] = useState(false);
  const [gasCutoffDone, setGasCutoffDone] = useState(false);
  const [buddySignalSent, setBuddySignalSent] = useState(false);

  // Module 3: Machinery LOTO Drill States
  const [boundaryIdentified, setBoundaryIdentified] = useState(false);
  const [breakerIsolated, setBreakerIsolated] = useState(false);
  const [lotoApplied, setLotoApplied] = useState(false);
  const [zeroEnergyVerified, setZeroEnergyVerified] = useState(false);

  // Start Camera Function
  const startCamera = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
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
  };

  // Initialize Camera Stream on Mount
  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Gyroscope / DeviceOrientation Listener
  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.gamma !== null) {
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

  // Touch & Mouse Drag Handlers for 360° Orbit Rotation
  const handleMouseDown = (e) => {
    setIsDragging(true);
    previousTouchRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - previousTouchRef.current.x;
    const deltaY = e.clientY - previousTouchRef.current.y;
    setRotation(prev => ({
      x: Math.max(-1, Math.min(1, prev.x + deltaY * 0.008)),
      y: prev.y + deltaX * 0.01
    }));
    previousTouchRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      previousTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousTouchRef.current.x;
    const deltaY = e.touches[0].clientY - previousTouchRef.current.y;
    setRotation(prev => ({
      x: Math.max(-1, Math.min(1, prev.x + deltaY * 0.008)),
      y: prev.y + deltaX * 0.01
    }));
    previousTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 3.2);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffaa00, 2.5, 12);
    pointLight.position.set(0, 2.5, 1);
    scene.add(pointLight);

    const arGroup = new THREE.Group();
    arGroup.name = "arGroup";
    scene.add(arGroup);

    // Ambient Environmental Particle System
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 3;
      positions[i + 1] = Math.random() * 2;
      positions[i + 2] = -0.5 - Math.random() * 2;

      colors[i] = 1.0;
      colors[i + 1] = 0.5 + Math.random() * 0.4;
      colors[i + 2] = 0.1;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
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
          posAttr.array[i] += 0.012;
          if (posAttr.array[i] > 2.2) posAttr.array[i] = 0;
        }
        posAttr.needsUpdate = true;
      }

      const group = scene.getObjectByName("arGroup");
      if (group) {
        group.rotation.y = rotation.y + (gyroAngle * Math.PI / 180) + Math.sin(elapsedTime * 0.5) * 0.04;
        group.rotation.x = rotation.x;
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
  }, [rotation, gyroAngle]);

  // Update 3D Geometries & Visual Effects on Module/Step Changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    let arGroup = scene.getObjectByName("arGroup");
    if (!arGroup) return;

    // Memory Disposal of previous 3D meshes
    disposeThreeObject(arGroup);

    if (selectedModule === 'fire') {
      // 1. Fire Safety 3D Scene
      if (passState.sweepProgress < 100) {
        // Fire Flames geometry
        const fireGeo = new THREE.ConeGeometry(0.45, 0.9, 16);
        const fireMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.8,
          roughness: 0.3
        });
        const fireMesh = new THREE.Mesh(fireGeo, fireMat);
        fireMesh.position.set(-0.2, 0.1, -1.5);
        arGroup.add(fireMesh);
      }

      // Extinguisher Tank geometry
      const tankGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.85, 32);
      const tankMat = new THREE.MeshStandardMaterial({
        color: extinguisherType === 'dcp' ? 0xdc2626 : 0x0284c7,
        metalness: 0.75,
        roughness: 0.25
      });
      const tankMesh = new THREE.Mesh(tankGeo, tankMat);
      tankMesh.position.set(0.5, -0.2, -1.2);
      arGroup.add(tankMesh);

      // Extinguisher Hose
      const hoseGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.55, 16);
      const hoseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const hoseMesh = new THREE.Mesh(hoseGeo, hoseMat);
      hoseMesh.rotation.z = Math.PI / 3;
      hoseMesh.position.set(0.25, 0.2, -1.2);
      arGroup.add(hoseMesh);

      // Floor AR Arrows for Exit Vector
      for (let i = 0; i < 3; i++) {
        const arrowGeo = new THREE.ConeGeometry(0.18, 0.45, 4);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
        arrowMesh.rotation.z = -Math.PI / 2;
        arrowMesh.position.set(-1.0 + i * 0.7, -0.6, -1 - i * 0.2);
        arGroup.add(arrowMesh);
      }
    } else if (selectedModule === 'gas') {
      // 2. Gas & SCBA 3D Scene
      // Toxic Gas Cloud Mesh
      const gasCloudGeo = new THREE.SphereGeometry(0.85, 24, 24);
      const gasCloudMat = new THREE.MeshStandardMaterial({
        color: gasCutoffDone ? 0x10b981 : 0xeab308,
        emissive: gasCutoffDone ? 0x047857 : 0xa16207,
        transparent: true,
        opacity: gasCutoffDone ? 0.12 : 0.65,
        wireframe: true
      });
      const gasCloudMesh = new THREE.Mesh(gasCloudGeo, gasCloudMat);
      gasCloudMesh.position.set(0, 0.4, -1.5);
      arGroup.add(gasCloudMesh);

      // SCBA Tank Mesh
      const scbaGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.8, 24);
      const scbaMat = new THREE.MeshStandardMaterial({ 
        color: scbaMaskEquipped ? 0x10b981 : 0x0284c7, 
        metalness: 0.8 
      });
      const scbaMesh = new THREE.Mesh(scbaGeo, scbaMat);
      scbaMesh.position.set(-0.6, -0.1, -1.2);
      arGroup.add(scbaMesh);

      // Multi-Gas Detector Box
      const detectorGeo = new THREE.BoxGeometry(0.25, 0.35, 0.12);
      const detectorMat = new THREE.MeshStandardMaterial({ 
        color: gasCalibrated ? 0x10b981 : 0xef4444, 
        metalness: 0.5 
      });
      const detectorMesh = new THREE.Mesh(detectorGeo, detectorMat);
      detectorMesh.position.set(0.6, -0.1, -1.2);
      arGroup.add(detectorMesh);
    } else if (selectedModule === 'machinery') {
      // 3. Heavy Machinery LOTO 3D Scene
      // Conveyor Belt Roller Pulley
      const beltGeo = new THREE.CylinderGeometry(0.45, 0.45, 2.4, 32);
      const beltMat = new THREE.MeshStandardMaterial({ 
        color: breakerIsolated ? 0x475569 : 0x0284c7, 
        metalness: 0.8, 
        roughness: 0.2 
      });
      const beltMesh = new THREE.Mesh(beltGeo, beltMat);
      beltMesh.rotation.z = Math.PI / 2;
      beltMesh.position.set(0, -0.1, -1.5);
      arGroup.add(beltMesh);

      // LOTO Padlock Geometry
      const lockGeo = new THREE.BoxGeometry(0.25, 0.32, 0.15);
      const lockMat = new THREE.MeshStandardMaterial({ 
        color: lotoApplied ? 0x10b981 : 0xef4444, 
        metalness: 0.9 
      });
      const lockMesh = new THREE.Mesh(lockGeo, lockMat);
      lockMesh.position.set(0, 0.4, -1.3);
      arGroup.add(lockMesh);

      // Danger Zone Boundary Box
      const boundGeo = new THREE.BoxGeometry(2.6, 1.2, 1.5);
      const boundMat = new THREE.MeshBasicMaterial({ 
        color: boundaryIdentified ? 0x10b981 : 0xef4444, 
        wireframe: true 
      });
      const boundMesh = new THREE.Mesh(boundGeo, boundMat);
      boundMesh.position.set(0, -0.1, -1.5);
      arGroup.add(boundMesh);
    }

    // Audio Voiceover Narration
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
  }, [
    selectedModule, currentStep, currentLang, audioEnabled, extinguisherType, 
    passState.sweepProgress, gasCalibrated, scbaMaskEquipped, gasCutoffDone, 
    boundaryIdentified, breakerIsolated, lotoApplied
  ]);

  // Handle Fire PASS Actions
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

  // Handle Gas SCBA Actions
  const handleGasAction = (action) => {
    if (action === 'calibrate') {
      setGasCalibrated(true);
      setGasPpm(0.42);
      playAudioBeep('pass');
    } else if (action === 'donScba') {
      setScbaMaskEquipped(true);
      playAudioBeep('pass');
    } else if (action === 'gasCutoff') {
      setGasCutoffDone(true);
      playAudioBeep('success');
    } else if (action === 'buddySignal') {
      setBuddySignalSent(true);
      playAudioBeep('success');
    }
  };

  // Handle Machinery LOTO Actions
  const handleLotoAction = (action) => {
    if (action === 'boundary') {
      setBoundaryIdentified(true);
      playAudioBeep('pass');
    } else if (action === 'breaker') {
      setBreakerIsolated(true);
      playAudioBeep('pass');
    } else if (action === 'lockout') {
      setLotoApplied(true);
      playAudioBeep('pass');
    } else if (action === 'zeroEnergy') {
      setZeroEnergyVerified(true);
      playAudioBeep('success');
    }
  };

  // Advance Module Step
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
    <div className={`w-full border rounded-2xl shadow-xl overflow-hidden flex flex-col space-y-2 select-none ${
      highContrastMode ? 'bg-black text-yellow-300 border-yellow-400' : 'bg-slate-950 text-slate-100 border-slate-800'
    }`}>
      {/* 1. Module Selector Tabs (48px Touch Targets for gloves) */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-2 border-b border-slate-800">
        <button
          onClick={() => { setSelectedModule('fire'); setCurrentStep(1); setModuleFinished(false); }}
          className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
            selectedModule === 'fire'
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg ring-2 ring-red-500/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
          }`}
        >
          <Flame className="w-4 h-4 text-red-300" />
          <span className="truncate">Fire Safety</span>
        </button>

        <button
          onClick={() => { setSelectedModule('gas'); setCurrentStep(1); setModuleFinished(false); }}
          className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
            selectedModule === 'gas'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-lg ring-2 ring-amber-400/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
          }`}
        >
          <Wind className="w-4 h-4 text-slate-950" />
          <span className="truncate">Gas SCBA</span>
        </button>

        <button
          onClick={() => { setSelectedModule('machinery'); setCurrentStep(1); setModuleFinished(false); }}
          className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
            selectedModule === 'machinery'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg ring-2 ring-cyan-400/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
          }`}
        >
          <Cog className="w-4 h-4 text-cyan-200" />
          <span className="truncate">Machinery</span>
        </button>
      </div>

      {/* 2. Mode Controls Bar (AR Camera, Thermal Heatmap, 3D Virtual View) */}
      <div className="flex items-center justify-between px-3 py-1 text-xs">
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setFilterMode('ar');
              if (!cameraActive) startCamera();
            }}
            className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              filterMode === 'ar' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AR Camera</span>
          </button>

          <button
            onClick={() => setFilterMode('thermal')}
            className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              filterMode === 'thermal' ? 'bg-red-600 text-white shadow ring-1 ring-red-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Thermal View</span>
          </button>

          <button
            onClick={() => setFilterMode('virtual')}
            className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              filterMode === 'virtual' ? 'bg-cyan-600 text-white shadow ring-1 ring-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D View</span>
          </button>
        </div>

        {/* High-Contrast Outdoor Mode & Audio Toggle */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setHighContrastMode(!highContrastMode)}
            className={`p-2 min-h-[40px] rounded-xl border font-bold text-xs flex items-center justify-center ${
              highContrastMode ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
            title="High-Contrast Outdoor Sunlight Mode"
          >
            <Sun className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 min-h-[40px] rounded-xl border text-xs font-semibold flex items-center justify-center ${
              audioEnabled ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. AR Camera, Thermal & 3D Interactive Viewport */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[360px] bg-slate-950 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
      >
        {/* Live Camera Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            filter: filterMode === 'thermal' ? 'invert(0.85) hue-rotate(190deg) saturate(3.5) contrast(1.8)' : 'none'
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-all ${
            cameraActive && filterMode !== 'virtual' ? 'opacity-85' : 'hidden'
          }`}
        />

        {/* 3D Virtual Mine Background Grid */}
        {(!cameraActive || filterMode === 'virtual') && (
          <div className="absolute inset-0 mine-grid-bg flex items-center justify-center">
            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-500">
              3D VIRTUAL SIMULATOR (Drag to Orbit 360°)
            </div>
          </div>
        )}

        {/* WebGL 3D Canvas Layer */}
        <canvas 
          ref={canvasRef} 
          style={{
            filter: filterMode === 'thermal' ? 'sepia(0.8) hue-rotate(140deg) saturate(3) contrast(1.5)' : 'none'
          }}
          className="absolute inset-0 w-full h-full pointer-events-none z-10" 
        />

        {/* Dynamic HUD Overlay: Gas CH4 PPM & Thermal Heatmap crosshair */}
        <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 bg-slate-950/90 px-3 py-1.5 rounded-full border border-red-500/40 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-[11px] font-mono font-bold text-red-400">CH4: {gasPpm}% VOL</span>
          <span className="text-[10px] text-slate-400">|</span>
          <span className="text-[11px] font-mono font-bold text-amber-400">O2: 20.9%</span>
        </div>

        {/* Thermal Heatmap Crosshair Overlay when Thermal View is active */}
        {filterMode === 'thermal' && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center">
            <div className="w-24 h-24 border-2 border-red-500/80 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
            </div>
            <div className="mt-2 bg-slate-950/90 px-3 py-1 rounded-md border border-red-500 text-[11px] font-mono font-bold text-yellow-300 shadow-md">
              THERMAL TEMP: {(185.4 + Math.sin(Date.now() * 0.003) * 15).toFixed(1)}°C HEAT ANOMALY
            </div>
          </div>
        )}

        {/* --- MODULE 1: FIRE SAFETY INTERACTIVE DRILL UI --- */}
        {selectedModule === 'fire' && currentStep === 2 && (
          <div className="absolute bottom-3 left-3 right-3 z-30 bg-slate-950/95 border border-amber-500/50 p-3 rounded-xl space-y-2 shadow-2xl">
            <span className="text-xs font-bold text-amber-400 block">Select Extinguisher Type for Hazard</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExtinguisherType('dcp')}
                className={`min-h-[48px] p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                  extinguisherType === 'dcp' ? 'bg-red-600/40 border-red-500 text-white shadow' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🧯 DCP Powder (Recommended)
              </button>
              <button
                onClick={() => setExtinguisherType('co2')}
                className={`min-h-[48px] p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                  extinguisherType === 'co2' ? 'bg-blue-600/40 border-blue-500 text-white shadow' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🧯 CO2 Gas Canister
              </button>
            </div>
            <button
              onClick={advanceStep}
              className="w-full min-h-[48px] py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Start P.A.S.S. Drill
            </button>
          </div>
        )}

        {selectedModule === 'fire' && currentStep === 3 && (
          <div className="absolute bottom-3 left-3 right-3 z-30 bg-slate-950/95 border border-amber-500/50 p-3 rounded-xl space-y-2 shadow-2xl">
            <span className="text-xs font-bold text-amber-400 block">P.A.S.S. Fire Extinguishing Drill</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handlePassAction('pullPin')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border transition-all ${
                  passState.pullPin ? 'bg-emerald-600 text-white border-emerald-400 shadow' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                1. Pull Pin {passState.pullPin ? '✓' : ''}
              </button>
              <button
                disabled={!passState.pullPin}
                onClick={() => handlePassAction('aimBase')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border transition-all ${
                  passState.aimBase ? 'bg-emerald-600 text-white border-emerald-400 shadow' : 'bg-slate-900 border-slate-800 text-slate-300 disabled:opacity-40'
                }`}
              >
                2. Aim Base {passState.aimBase ? '✓' : ''}
              </button>
              <button
                disabled={!passState.aimBase}
                onClick={() => handlePassAction('squeezeTrigger')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border transition-all ${
                  passState.squeezeTrigger ? 'bg-emerald-600 text-white border-emerald-400 shadow' : 'bg-slate-900 border-slate-800 text-slate-300 disabled:opacity-40'
                }`}
              >
                3. Squeeze {passState.squeezeTrigger ? '✓' : ''}
              </button>
              <button
                disabled={!passState.squeezeTrigger}
                onClick={() => handlePassAction('sweep')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border transition-all ${
                  passState.sweepProgress >= 100 
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow' 
                    : 'bg-amber-500 text-slate-950 border-amber-400 disabled:opacity-40'
                }`}
              >
                4. Sweep ({passState.sweepProgress}%)
              </button>
            </div>
          </div>
        )}

        {/* --- MODULE 2: GAS SCBA INTERACTIVE DRILL UI --- */}
        {selectedModule === 'gas' && (
          <div className="absolute bottom-3 left-3 right-3 z-30 bg-slate-950/95 border border-amber-500/50 p-3 rounded-xl space-y-2 shadow-2xl">
            <span className="text-xs font-bold text-amber-400 block">Gas SCBA Safety Protocol Action</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleGasAction('calibrate')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border text-left transition-all ${
                  gasCalibrated ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                1. Calibrate Detector {gasCalibrated ? '✓' : ''}
              </button>

              <button
                disabled={!gasCalibrated}
                onClick={() => handleGasAction('donScba')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border text-left transition-all ${
                  scbaMaskEquipped ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 disabled:opacity-40'
                }`}
              >
                2. Don SCBA Mask {scbaMaskEquipped ? '✓' : ''}
              </button>

              <button
                disabled={!scbaMaskEquipped}
                onClick={() => handleGasAction('gasCutoff')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border text-left transition-all ${
                  gasCutoffDone ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 disabled:opacity-40'
                }`}
              >
                3. Isolate Gas Valve {gasCutoffDone ? '✓' : ''}
              </button>

              <button
                disabled={!gasCutoffDone}
                onClick={() => handleGasAction('buddySignal')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border text-left transition-all ${
                  buddySignalSent ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 disabled:opacity-40'
                }`}
              >
                4. Buddy Tug Signal {buddySignalSent ? '✓' : ''}
              </button>
            </div>
          </div>
        )}

        {/* --- MODULE 3: MACHINERY LOTO INTERACTIVE DRILL UI --- */}
        {selectedModule === 'machinery' && (
          <div className="absolute bottom-3 left-3 right-3 z-30 bg-slate-950/95 border border-amber-500/50 p-3 rounded-xl space-y-2 shadow-2xl">
            <span className="text-xs font-bold text-amber-400 block">Machinery LOTO Safety Protocol Action</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleLotoAction('boundary')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border text-left transition-all ${
                  boundaryIdentified ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                1. Stay-Clear Zone {boundaryIdentified ? '✓' : ''}
              </button>

              <button
                disabled={!boundaryIdentified}
                onClick={() => handleLotoAction('breaker')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border text-left transition-all ${
                  breakerIsolated ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 disabled:opacity-40'
                }`}
              >
                2. Circuit Breaker OFF {breakerIsolated ? '✓' : ''}
              </button>

              <button
                disabled={!breakerIsolated}
                onClick={() => handleLotoAction('lockout')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border text-left transition-all ${
                  lotoApplied ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 disabled:opacity-40'
                }`}
              >
                3. Apply Padlock & Tag {lotoApplied ? '✓' : ''}
              </button>

              <button
                disabled={!lotoApplied}
                onClick={() => handleLotoAction('zeroEnergy')}
                className={`min-h-[48px] p-2.5 rounded-xl font-bold border text-left transition-all ${
                  zeroEnergyVerified ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 disabled:opacity-40'
                }`}
              >
                4. Test 0V Energy {zeroEnergyVerified ? '✓' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Module Completion Modal Overlay */}
        {moduleFinished && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h3 className="text-lg font-extrabold text-white">AR Safety Module Passed!</h3>
            <p className="text-xs text-slate-300 max-w-xs">
              Great job! You completed all practical safety protocols in compliance with DGMS rules.
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => { setModuleFinished(false); setCurrentStep(1); }}
                className="min-h-[48px] px-4 py-2.5 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold border border-slate-700"
              >
                Re-drill Scenario
              </button>
              <button
                onClick={advanceStep}
                className="min-h-[48px] px-6 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg"
              >
                Proceed to Quiz
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Navigation & Instructions */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
        <div className="text-xs max-w-[65%]">
          <span className="text-amber-400 font-extrabold block truncate">
            {selectedModule === 'fire' 
              ? (currentStep === 1 ? t.m1Step1 : currentStep === 2 ? t.m1Step2 : currentStep === 3 ? t.m1Step3 : t.m1Step4)
              : selectedModule === 'gas'
              ? (currentStep === 1 ? t.m2Step1 : currentStep === 2 ? t.m2Step2 : currentStep === 3 ? t.m2Step3 : t.m2Step4)
              : (currentStep === 1 ? t.m3Step1 : t.m3Step2)}
          </span>
          <span className="text-slate-400 text-[10px] truncate block">
            {selectedModule === 'fire' 
              ? (currentStep === 1 ? t.m1Step1Detail : currentStep === 2 ? t.m1Step2Detail : currentStep === 3 ? t.m1Step3Detail : t.m1Step4Detail)
              : selectedModule === 'gas'
              ? (currentStep === 1 ? t.m2Step1Detail : currentStep === 2 ? t.m2Step2Detail : currentStep === 3 ? t.m2Step3Detail : t.m2Step4Detail)
              : (currentStep === 1 ? t.m3Step1Detail : t.m3Step2Detail)}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="min-h-[48px] min-w-[48px] p-2 bg-slate-800 text-slate-300 rounded-xl disabled:opacity-30 flex items-center justify-center border border-slate-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={advanceStep}
            className="min-h-[48px] px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1 shadow-md transition-all"
          >
            <span>{t.nextStep}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
