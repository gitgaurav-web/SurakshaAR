import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Activity, Wind, Flame, Droplets, ShieldCheck, Zap, AlertTriangle, 
  MapPin, RefreshCw, ChevronRight, Layers, Eye, Smartphone, Compass,
  Sliders, Maximize2, RotateCw, Navigation, Radio, Box, Info
} from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { playAudioBeep, speakInstruction } from '../../utils/audioEngine';

// Multilingual labels for Telemetry Explorer
const LABELS = {
  en: {
    title: "3D Mine Telemetry Map Explorer",
    subtitle: "DGMS Dhanbad Cluster Shaft Telemetry Console",
    gyroEnable: "Enable Gyro",
    gyroActive: "Gyro Active",
    viewModeWireframe: "Cyber Grid",
    viewModeThermal: "Thermal View",
    viewModeStrata: "Geological Seams",
    ch4Label: "METHANE (CH4) CONCENTRATION",
    ch4Limit: "Safety Limit: 1.25% VOL",
    tempLabel: "STRATA AMBIENT TEMPERATURE",
    airflowLabel: "VENTILATION AIRFLOW",
    pumpLabel: "UNDERGROUND SUMP PUMPS",
    normal: "SAFE OPERATIONAL",
    warning: "HIGH GAS WARNING",
    depth: "Depth Below Surface",
    shaftStatus: "LIVE TELEMETRY STREAM",
    dragHint: "Touch & Drag to rotate 3D Mine Shaft",
    autoRotate: "Auto Orbit",
    focusNode: "Focus Sensor Node"
  },
  hi: {
    title: "3D खदान टेलीमेट्री मानचित्र एक्सप्लोरर",
    subtitle: "DGMS धनबाद क्लस्टर शाफ्ट टेलीमेट्री कंसोल",
    gyroEnable: "गाइरो चालू करें",
    gyroActive: "गाइरो सक्रिय",
    viewModeWireframe: "साइबर ग्रिड",
    viewModeThermal: "थर्मल दृश्य",
    viewModeStrata: "भूवैज्ञानिक परतें",
    ch4Label: "मीथेन (CH4) सांद्रता",
    ch4Limit: "सुरक्षा सीमा: 1.25% VOL",
    tempLabel: "खदान परिवेश तापमान",
    airflowLabel: "वेंटिलेशन वायु प्रवाह",
    pumpLabel: "भूमिगत संप पंप स्थिति",
    normal: "सुरक्षित संचालन",
    warning: "उच्च गैस चेतावनी",
    depth: "सतह से गहराई",
    shaftStatus: "लाइव टेलीमेट्री स्ट्रीम",
    dragHint: "3D शाफ्ट घुमाने के लिए ड्रैग करें",
    autoRotate: "ऑटो ऑर्बिट",
    focusNode: "सेंसर फोकस"
  },
  sat: {
    title: "3D ᱠᱷᱟᱫᱟᱱ ᱴᱮᱞᱤᱢᱮᱴᱨᱤ ᱱᱚᱠᱥᱟ",
    subtitle: "DGMS ᱫᱷᱟᱱᱵᱟᱫᱽ ᱠᱞᱚᱥᱴᱚᱨ ᱥᱟᱯᱷᱴ ᱠᱚᱱᱥᱚᱞ",
    gyroEnable: "ᱜᱟᱭᱨᱚ ᱪᱟᱹᱞᱩ",
    gyroActive: "ᱜᱟᱭᱨᱚ ᱥᱟᱹᱨᱤ",
    viewModeWireframe: "ᱥᱟᱭᱵᱚᱨ ᱜᱽᱨᱤᱰ",
    viewModeThermal: "ᱛᱷᱚᱨᱢᱟᱞ ᱧᱮᱞ",
    viewModeStrata: "ᱦᱟᱥᱟ ᱯᱚᱨᱚᱛ",
    ch4Label: "ᱢᱤᱛᱷᱮᱱ (CH4) ᱯᱚᱨᱚᱢ",
    ch4Limit: "ᱥᱤᱢᱟᱹ: 1.25% VOL",
    tempLabel: "ᱠᱷᱟᱫᱟᱱ ᱞᱚᱞᱚᱥᱚᱝ",
    airflowLabel: "ᱦᱚᱭ ᱪᱟᱞᱟᱣ",
    pumpLabel: "ᱯᱟᱢᱯ ᱥᱛᱷᱤᱛᱤ",
    normal: "ᱵᱩᱜᱤᱭᱟ",
    warning: "ᱪᱮᱛᱟᱣᱱᱤ",
    depth: "ᱞᱟᱛᱟᱨ ᱜᱟᱹᱦᱤᱨ",
    shaftStatus: "ᱞᱟᱭᱤᱵᱽ ᱴᱮᱞᱤᱢᱮᱴᱨᱤ",
    dragHint: "3D ᱥᱟᱯᱷᱴ ᱟᱹᱪᱩᱨ ᱞᱟᱹᱜᱤᱫ ᱴᱤᱯᱟᱹᱣ ᱢᱮ",
    autoRotate: "ᱚᱴᱚ ᱚᱨᱵᱤᱴ",
    focusNode: "ᱥᱮᱱᱥᱚᱨ"
  }
};

// Memory Disposal Helper for Three.js
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

export default function Mine3DMapExplorer({ currentLang = 'en' }) {
  const lbl = LABELS[currentLang] || LABELS.en;
  const canvasRef = useRef(null);

  const [selectedPit, setSelectedPit] = useState('jharia'); // 'jharia', 'moonidih', 'digwadih'
  const [viewMode, setViewMode] = useState('wireframe'); // 'wireframe', 'thermal', 'strata'
  const [autoRotate, setAutoRotate] = useState(true);
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [activeNode, setActiveNode] = useState(null); // focused 3D telemetry node

  const [telemetry, setTelemetry] = useState({
    methane: 0.85,
    oxygen: 20.9,
    strataTemp: 29.4,
    airflowCFM: 4200,
    waterPumpStatus: 'NORMAL OPERATIONAL',
    alertLevel: 'NORMAL',
    fanSpeedRPM: 1450,
    hoistDepthMeters: 420
  });

  // Pit Configurations with Mining Context
  const pits = [
    { 
      id: 'jharia', 
      name: 'Jharia Coalfield Pit #7', 
      shortName: 'Jharia Pit #7',
      depth: '420m Below Surface', 
      seam: 'Seam 14 (Thick Seam Mining)',
      color: 'amber',
      accentHex: 0xf59e0b,
      ch4Baseline: 0.85
    },
    { 
      id: 'moonidih', 
      name: 'Moonidih Deep Shaft #3', 
      shortName: 'Moonidih Shaft #3',
      depth: '560m Underground', 
      seam: 'Seam 16 (Automated Longwall)',
      color: 'cyan',
      accentHex: 0x06b6d4,
      ch4Baseline: 0.62
    },
    { 
      id: 'digwadih', 
      name: 'Digwadih Colliery Seam 11', 
      shortName: 'Digwadih Seam 11',
      depth: '380m Below Surface', 
      seam: 'Seam 11 (Continuous Miner Panel)',
      color: 'emerald',
      accentHex: 0x10b981,
      ch4Baseline: 0.45
    }
  ];

  const currentPitObj = pits.find(p => p.id === selectedPit) || pits[0];

  // Request Gyroscope Permission
  const requestGyroPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setGyroEnabled(true);
          playAudioBeep('pass');
        }
      } catch (err) {
        console.warn('Gyro permission request:', err);
      }
    } else {
      setGyroEnabled(prev => !prev);
      playAudioBeep('pass');
    }
  };

  // Live Telemetry Stream Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const noise = (Math.random() - 0.5) * 0.06;
      setTelemetry(prev => {
        const base = currentPitObj.ch4Baseline;
        const nextCH4 = Math.max(0.2, Math.min(2.4, base + noise + (Math.sin(Date.now() * 0.0008) * 0.2)));
        const isHighGas = nextCH4 > 1.25;

        if (isHighGas && prev.alertLevel !== 'WARNING') {
          playAudioBeep('fail');
        }

        return {
          ...prev,
          methane: Number(nextCH4.toFixed(2)),
          strataTemp: Number((29.4 + Math.sin(Date.now() * 0.001) * 1.8).toFixed(1)),
          airflowCFM: Math.floor(4200 + (Math.random() - 0.5) * 180),
          alertLevel: isHighGas ? 'WARNING' : 'NORMAL',
          fanSpeedRPM: isHighGas ? 1800 : 1450,
          hoistDepthMeters: Math.floor(200 + Math.sin(Date.now() * 0.0005) * 200)
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedPit]);

  // Mouse / Touch Interaction Refs
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.2, y: 0 });

  // Three.js 3D Shaft Engine Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.08);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 3.8, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainSpotLight = new THREE.SpotLight(currentPitObj.accentHex, 3.5, 25, Math.PI / 4, 0.5);
    mainSpotLight.position.set(3, 8, 5);
    scene.add(mainSpotLight);

    const bottomGlowLight = new THREE.PointLight(0x06b6d4, 2.0, 10);
    bottomGlowLight.position.set(0, -3, 0);
    scene.add(bottomGlowLight);

    // Root Group
    const shaftRootGroup = new THREE.Group();
    scene.add(shaftRootGroup);

    // Color Theme determination based on View Mode & Selected Pit
    let primaryColorHex = currentPitObj.accentHex;
    let shaftWireframe = true;
    let nodeColorHex = 0x10b981;

    if (viewMode === 'thermal') {
      primaryColorHex = telemetry.methane > 1.25 ? 0xef4444 : 0xf97316;
      nodeColorHex = 0xef4444;
    } else if (viewMode === 'strata') {
      primaryColorHex = 0xd97706;
      nodeColorHex = 0x3b82f6;
    }

    // 1. Central Mine Shaft Main Vertical Column
    const shaftGeo = new THREE.CylinderGeometry(1.2, 1.2, 5.0, 24, 10, true);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: primaryColorHex,
      wireframe: viewMode === 'wireframe' || viewMode === 'strata',
      transparent: true,
      opacity: viewMode === 'thermal' ? 0.65 : 0.45,
      side: THREE.DoubleSide
    });
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftRootGroup.add(shaftMesh);

    // Shaft Ring Rib Supports (Depth Markers)
    const ringDepths = [2.0, 1.0, 0.0, -1.0, -2.0];
    const ringGroup = new THREE.Group();
    ringDepths.forEach((yPos) => {
      const ringGeo = new THREE.TorusGeometry(1.22, 0.03, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: primaryColorHex });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = yPos;
      ringGroup.add(ringMesh);
    });
    shaftRootGroup.add(ringGroup);

    // 2. Geological Stratum Seams (3 Horizontal Disks)
    const stratumGroup = new THREE.Group();
    
    // Topsoil / Surface Layer
    const topStrataGeo = new THREE.CylinderGeometry(3.2, 3.2, 0.1, 32);
    const topStrataMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      transparent: true,
      opacity: 0.6,
      wireframe: viewMode === 'wireframe'
    });
    const topStrataMesh = new THREE.Mesh(topStrataGeo, topStrataMat);
    topStrataMesh.position.y = 2.2;
    stratumGroup.add(topStrataMesh);

    // Intermediate Strata (Sandstone & Shale)
    const midStrataGeo = new THREE.CylinderGeometry(3.6, 3.6, 0.1, 32);
    const midStrataMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.5,
      wireframe: viewMode === 'wireframe'
    });
    const midStrataMesh = new THREE.Mesh(midStrataGeo, midStrataMat);
    midStrataMesh.position.y = 0.2;
    stratumGroup.add(midStrataMesh);

    // Main Working Coal Seam (Bottom)
    const coalSeamGeo = new THREE.CylinderGeometry(4.0, 4.0, 0.15, 32);
    const coalSeamMat = new THREE.MeshStandardMaterial({
      color: viewMode === 'thermal' ? 0xef4444 : 0xf59e0b,
      transparent: true,
      opacity: 0.8,
      wireframe: viewMode === 'wireframe'
    });
    const coalSeamMesh = new THREE.Mesh(coalSeamGeo, coalSeamMat);
    coalSeamMesh.position.y = -1.8;
    stratumGroup.add(coalSeamMesh);

    shaftRootGroup.add(stratumGroup);

    // 3. Underground Mine Horizontal Galleries (Tunnel Extensions)
    const tunnelGroup = new THREE.Group();
    const tunnelDirections = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

    tunnelDirections.forEach((angle) => {
      const tunnelGeo = new THREE.BoxGeometry(0.8, 0.8, 2.5);
      const tunnelMat = new THREE.MeshStandardMaterial({
        color: primaryColorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });
      const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
      tunnelMesh.position.set(Math.sin(angle) * 2.2, -1.8, Math.cos(angle) * 2.2);
      tunnelMesh.rotation.y = angle;
      tunnelGroup.add(tunnelMesh);
    });
    shaftRootGroup.add(tunnelGroup);

    // 4. Elevator Hoist Cage Mesh moving inside shaft
    const cageGeo = new THREE.BoxGeometry(0.7, 0.9, 0.7);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      wireframe: true,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.5
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    shaftRootGroup.add(cageMesh);

    // 5. Radar / Telemetry Scanner Ring Beam
    const scanBeamGeo = new THREE.CylinderGeometry(1.24, 1.24, 0.08, 24);
    const scanBeamMat = new THREE.MeshBasicMaterial({
      color: telemetry.methane > 1.25 ? 0xef4444 : 0x06b6d4,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const scanBeamMesh = new THREE.Mesh(scanBeamGeo, scanBeamMat);
    shaftRootGroup.add(scanBeamMesh);

    // 6. Live Telemetry Node Markers in 3D Space
    const nodeGroup = new THREE.Group();
    const sensorNodes = [
      { id: 'ch4', pos: [1.3, -1.8, 0.8], label: 'CH4 Node #01' },
      { id: 'temp', pos: [-1.3, 0.2, -0.8], label: 'Temp Probe #04' },
      { id: 'airflow', pos: [0.0, 2.0, 1.3], label: 'Fan Vent #02' },
      { id: 'pump', pos: [0.0, -2.4, -1.2], label: 'Sump Pump #07' }
    ];

    sensorNodes.forEach((node) => {
      const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const isWarn = node.id === 'ch4' && telemetry.methane > 1.25;
      const sphereMat = new THREE.MeshBasicMaterial({
        color: isWarn ? 0xef4444 : node.id === activeNode ? 0x38bdf8 : nodeColorHex
      });
      const nodeMesh = new THREE.Mesh(sphereGeo, sphereMat);
      nodeMesh.position.set(...node.pos);
      nodeGroup.add(nodeMesh);

      // Node Outer Pulse Ring
      const pulseGeo = new THREE.RingGeometry(0.2, 0.32, 16);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: isWarn ? 0xef4444 : 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.position.set(...node.pos);
      pulseGroup.current = pulseMesh;
      nodeGroup.add(pulseMesh);
    });

    shaftRootGroup.add(nodeGroup);

    // 7. Ground Coordinate Grid Helper
    const gridHelper = new THREE.GridHelper(10, 20, primaryColorHex, 0x1e293b);
    gridHelper.position.y = -2.5;
    scene.add(gridHelper);

    // Handle Gyro Device Orientation Event
    const handleDeviceOrientation = (e) => {
      if (!gyroEnabled || !e.beta || !e.gamma) return;
      const pitch = (e.beta - 45) * (Math.PI / 180) * 0.3;
      const roll = e.gamma * (Math.PI / 180) * 0.3;
      shaftRootGroup.rotation.x = pitch;
      shaftRootGroup.rotation.y = roll;
    };

    if (gyroEnabled) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    // Animation Render Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Auto Orbit Rotation if not manually dragging
      if (autoRotate && !isDraggingRef.current && !gyroEnabled) {
        rotationRef.current.y += 0.006;
      }

      shaftRootGroup.rotation.y = rotationRef.current.y;
      shaftRootGroup.rotation.x = rotationRef.current.x;

      // Elevator Cage Animation (Bouncing up and down shaft)
      cageMesh.position.y = Math.sin(elapsedTime * 0.8) * 1.8;

      // Scanner Ring Sweeping down shaft
      scanBeamMesh.position.y = Math.sin(elapsedTime * 1.5) * 2.2;

      // Render Scene
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    // Canvas Resize Handler
    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (gyroEnabled) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
      }
      cancelAnimationFrame(animId);
      disposeThreeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [selectedPit, viewMode, autoRotate, gyroEnabled, activeNode, telemetry.methane]);

  const pulseGroup = useRef(null);

  // Drag Pointer Handlers for 3D Orbiting
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX || e.touches?.[0]?.clientX || 0, y: e.clientY || e.touches?.[0]?.clientY || 0 };
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    const deltaX = clientX - previousMousePositionRef.current.x;
    const deltaY = clientY - previousMousePositionRef.current.y;

    rotationRef.current.y += deltaX * 0.008;
    rotationRef.current.x = Math.max(-0.6, Math.min(0.8, rotationRef.current.x + deltaY * 0.008));

    previousMousePositionRef.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6 space-y-4 select-none">
      
      {/* Smart High-Tech Header Console */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 backdrop-blur-xl">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center p-3 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 shrink-0">
              <Activity className="w-6 h-6 text-slate-950 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">{lbl.title}</h2>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                  DGMS 3D WEBGL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{lbl.subtitle}</p>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            {/* Auto Orbit Toggle */}
            <button
              onClick={() => {
                setAutoRotate(!autoRotate);
                playAudioBeep('pass');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                autoRotate 
                  ? 'bg-slate-800 text-amber-400 border-amber-500/40 shadow-sm' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
              <span>{lbl.autoRotate}</span>
            </button>

            {/* Gyro Toggle */}
            <button
              onClick={requestGyroPermission}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                gyroEnabled 
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-md' 
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/40'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{gyroEnabled ? lbl.gyroActive : lbl.gyroEnable}</span>
            </button>
          </div>

        </div>

        {/* Second Row: Location Tabs Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Location Selection Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar shrink-0">
            {pits.map((p) => {
              const isSelected = selectedPit === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPit(p.id);
                    playAudioBeep('pass');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border whitespace-nowrap ${
                    isSelected 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20' 
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>{p.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher Pills */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0 self-end sm:self-center">
            {[
              { id: 'wireframe', label: lbl.viewModeWireframe, icon: Layers },
              { id: 'thermal', label: lbl.viewModeThermal, icon: Flame },
              { id: 'strata', label: lbl.viewModeStrata, icon: Box }
            ].map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setViewMode(mode.id);
                    playAudioBeep('pass');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1.5 ${
                    isActive 
                      ? 'bg-slate-800 text-amber-400 shadow border border-amber-500/30 font-black' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Main Grid: 3D WebGL Canvas Viewport + Sensor SCADA Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* 3D WebGL Mine Shaft Viewport (8 Cols on LG) */}
        <div 
          className="lg:col-span-8 relative h-[420px] sm:h-[460px] bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          {/* WebGL Canvas */}
          <canvas ref={canvasRef} className="w-full h-full" />

          {/* Top Left Pit Details Overlay */}
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 text-xs font-mono text-slate-200 flex flex-col space-y-0.5 shadow-xl">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold text-white text-sm">{currentPitObj.name}</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span className="text-amber-400 font-extrabold">{currentPitObj.depth}</span>
              <span>•</span>
              <span className="text-slate-300">{currentPitObj.seam}</span>
            </div>
          </div>

          {/* Top Right Live Telemetry Radar Status */}
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center space-x-2 shadow-lg">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="font-bold text-cyan-300">{lbl.shaftStatus}</span>
          </div>

          {/* Bottom Drag Guidance Banner */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center space-x-2 shadow-lg pointer-events-none">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>{lbl.dragHint}</span>
          </div>

          {/* Bottom Right Depth Indicator Badge */}
          <div className="absolute bottom-3 right-3 hidden sm:flex bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 flex-col items-end">
            <span className="text-slate-300 font-bold">HOIST CAGE DEPTH:</span>
            <span className="text-amber-400 font-black text-xs">{telemetry.hoistDepthMeters}m</span>
          </div>
        </div>

        {/* Live Telemetry SCADA Sensor Cards (4 Cols on LG) */}
        <div className="lg:col-span-4 space-y-3 flex flex-col justify-between">
          
          {/* Card 1: Methane Gas CH4 Sensor */}
          <div 
            onClick={() => {
              setActiveNode('ch4');
              playAudioBeep('pass');
            }}
            className={`p-4 rounded-2xl border backdrop-blur-xl shadow-xl transition-all cursor-pointer ${
              telemetry.methane > 1.25 
                ? 'bg-red-950/50 border-red-500/70 animate-pulse' 
                : activeNode === 'ch4' 
                  ? 'bg-slate-900/90 border-amber-500 shadow-amber-500/10' 
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center space-x-1.5">
                <Wind className={`w-4 h-4 ${telemetry.methane > 1.25 ? 'text-red-400 animate-bounce' : 'text-amber-400'}`} />
                <span>{lbl.ch4Label}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase border ${
                telemetry.methane > 1.25 
                  ? 'bg-red-500/30 text-red-200 border-red-500' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {telemetry.methane > 1.25 ? lbl.warning : lbl.normal}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div className="text-3xl font-mono font-black text-white tracking-tight">
                {telemetry.methane}% <span className="text-xs text-slate-400 font-normal">VOL</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{lbl.ch4Limit}</span>
            </div>

            {/* CH4 Progress Visual Bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mt-2">
              <div 
                className={`h-full transition-all duration-500 ${
                  telemetry.methane > 1.25 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                }`}
                style={{ width: `${Math.min(100, (telemetry.methane / 2.5) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Card 2: Strata Ambient Temperature */}
          <div 
            onClick={() => {
              setActiveNode('temp');
              playAudioBeep('pass');
            }}
            className={`p-4 bg-slate-900/90 border rounded-2xl shadow-xl transition-all cursor-pointer ${
              activeNode === 'temp' ? 'border-amber-500' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>{lbl.tempLabel}</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                STABLE STRATA
              </span>
            </div>
            <div className="text-3xl font-mono font-black text-white tracking-tight">
              {telemetry.strataTemp}°C <span className="text-xs text-slate-400 font-normal">({((telemetry.strataTemp * 9/5) + 32).toFixed(1)}°F)</span>
            </div>
          </div>

          {/* Card 3: Ventilation Airflow & Sump Pump Console */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-3">
            
            {/* Ventilation Airflow */}
            <div 
              onClick={() => {
                setActiveNode('airflow');
                playAudioBeep('pass');
              }}
              className="flex items-center justify-between cursor-pointer pb-2.5 border-b border-slate-800/80"
            >
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-300">{lbl.airflowLabel}</span>
              </div>
              <div className="text-right font-mono">
                <div className="text-base font-black text-cyan-300">{telemetry.airflowCFM} CFM</div>
                <div className="text-[10px] text-slate-400">{telemetry.fanSpeedRPM} RPM FAN</div>
              </div>
            </div>

            {/* Underground Sump Pumps */}
            <div 
              onClick={() => {
                setActiveNode('pump');
                playAudioBeep('pass');
              }}
              className="flex items-center justify-between cursor-pointer pt-0.5"
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-300">{lbl.pumpLabel}</span>
              </div>
              <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {telemetry.waterPumpStatus}
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
