import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { 
  Camera, Volume2, VolumeX, ShieldAlert, CheckCircle2, RotateCcw, 
  ChevronRight, ChevronLeft, Flame, Wind, Cog, AlertTriangle, 
  Lock, RefreshCw, Layers, Eye, Sun, Moon, Activity, Zap, CheckSquare, Award as LucideAward, Target, Thermometer, ShieldCheck, Sparkles, Smartphone, Info
} from 'lucide-react';

const Award = LucideAward || ShieldCheck;
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

export default function ARSimulatorContainer({ currentLang, onModuleComplete, onNavigateToQuiz, onNavigateToCertificate }) {
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
  
  // Thermal Inspection Sub-Target Selection ('equipment', 'ambient', 'gear')
  const [thermalTarget, setThermalTarget] = useState('equipment');

  // 360° Orbit Rotation States & Refs for 3D View
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const previousTouchRef = useRef({ x: 0, y: 0 });
  const [gyroAngle, setGyroAngle] = useState(0);
  const gyroAngleRef = useRef(0);

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

  const [cameraFacing, setCameraFacing] = useState('environment');
  const [cameraError, setCameraError] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  // Start Camera Function with Capacitor Native Permissions & Webview Compatibility
  const startCamera = async (facing = cameraFacing) => {
    setCameraError(false);
    setIsCameraLoading(true);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }

      // Check Capacitor Native Camera Permissions if running on mobile device
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera) {
        try {
          await window.Capacitor.Plugins.Camera.requestPermissions();
        } catch (capErr) {
          console.warn('Capacitor native camera permission request:', capErr);
        }
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch (idealErr) {
        console.warn('Ideal facingMode camera failed, trying basic video constraint.', idealErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play().catch(e => console.warn('Video play auto-start:', e));
        setCameraActive(true);
        setCameraFacing(facing);
      }
    } catch (err) {
      console.warn('Camera stream unavailable, switching to 3D Virtual mode.', err);
      setCameraActive(false);
      setCameraError(true);
    } finally {
      setIsCameraLoading(false);
    }
  };

  // Toggle Rear / Front Camera Facing Mode
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
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
        const val = event.gamma * 0.5;
        gyroAngleRef.current = val;
        setGyroAngle(val);
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
    const newRot = {
      x: Math.max(-1, Math.min(1, rotationRef.current.x + deltaY * 0.008)),
      y: rotationRef.current.y + deltaX * 0.01
    };
    rotationRef.current = newRot;
    setRotation(newRot);
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
    const newRot = {
      x: Math.max(-1, Math.min(1, rotationRef.current.x + deltaY * 0.008)),
      y: rotationRef.current.y + deltaX * 0.01
    };
    rotationRef.current = newRot;
    setRotation(newRot);
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
    let renderer = null;
    try {
      if (canvasRef.current) {
        const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl') || canvasRef.current.getContext('experimental-webgl');
        if (gl) {
          renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false
          });
          renderer.setSize(width, height);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          rendererRef.current = renderer;
        }
      }
    } catch (err) {
      console.warn('AR WebGLRenderer init failed gracefully:', err);
    }

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

    // --- MODULE 1: FIRE DRILL 3D SCENE ---
    if (selectedModule === 'fire') {
      const extGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.95, 32);
      const extMat = new THREE.MeshStandardMaterial({
        color: extinguisherType === 'co2' ? 0x0284c7 : 0xdc2626,
        metalness: 0.85,
        roughness: 0.2
      });
      const extMesh = new THREE.Mesh(extGeo, extMat);
      extMesh.position.set(0.7, -0.2, -1.5);
      arGroup.add(extMesh);

      const nozzleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 16);
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
      nozzleMesh.rotation.z = Math.PI / 3;
      nozzleMesh.position.set(0.55, 0.2, -1.4);
      arGroup.add(nozzleMesh);

      const pinGeo = new THREE.RingGeometry(0.04, 0.07, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: passState.pullPin ? 0x10b981 : 0xf59e0b,
        side: THREE.DoubleSide
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(0.7, 0.32, -1.35);
      arGroup.add(pinMesh);

      // Fire Flame Hazards (Base Fire Mesh)
      const fireCount = 45;
      const fireGeo = new THREE.BufferGeometry();
      const firePositions = new Float32Array(fireCount * 3);
      const fireColors = new Float32Array(fireCount * 3);

      const isFireExtinguished = passState.sweepProgress >= 100;

      for (let i = 0; i < fireCount; i++) {
        firePositions[i * 3] = (Math.random() - 0.5) * (isFireExtinguished ? 0.1 : 0.85);
        firePositions[i * 3 + 1] = Math.random() * (isFireExtinguished ? 0.05 : 0.9) - 0.4;
        firePositions[i * 3 + 2] = -1.6 + (Math.random() - 0.5) * 0.5;

        fireColors[i * 3] = 1.0;
        fireColors[i * 3 + 1] = isFireExtinguished ? 0.3 : Math.random() * 0.5 + 0.3;
        fireColors[i * 3 + 2] = 0.0;
      }

      fireGeo.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
      fireGeo.setAttribute('color', new THREE.BufferAttribute(fireColors, 3));

      const fireMat = new THREE.PointsMaterial({
        size: isFireExtinguished ? 0.02 : 0.12,
        vertexColors: true,
        transparent: true,
        opacity: isFireExtinguished ? 0.15 : 0.85
      });
      const fireParticles = new THREE.Points(fireGeo, fireMat);
      particlesRef.current = fireParticles;
      arGroup.add(fireParticles);

      // DCP White Powder Extinguisher Spray Cloud Particles
      if (passState.squeezeTrigger) {
        const sprayCount = 80;
        const sprayGeo = new THREE.BufferGeometry();
        const sprayPos = new Float32Array(sprayCount * 3);
        for (let i = 0; i < sprayCount; i++) {
          sprayPos[i * 3] = (Math.random() - 0.5) * 0.6;
          sprayPos[i * 3 + 1] = (Math.random() - 0.5) * 0.5 - 0.2;
          sprayPos[i * 3 + 2] = -1.4 - Math.random() * 0.6;
        }
        sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
        const sprayMat = new THREE.PointsMaterial({
          size: 0.15,
          color: 0xffffff,
          transparent: true,
          opacity: 0.75
        });
        const sprayMesh = new THREE.Points(sprayGeo, sprayMat);
        extinguisherSprayRef.current = sprayMesh;
        arGroup.add(sprayMesh);
      }
    } else if (selectedModule === 'gas') {
      // --- MODULE 2: METHANE GAS SCBA DRILL 3D SCENE ---
      const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.5, 24);
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
      const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
      pipeMesh.rotation.z = Math.PI / 2;
      pipeMesh.position.set(0, 0.5, -1.8);
      arGroup.add(pipeMesh);

      const valveGeo = new THREE.TorusGeometry(0.22, 0.04, 16, 32);
      const valveMat = new THREE.MeshStandardMaterial({ color: gasCutoffDone ? 0x10b981 : 0xdc2626 });
      const valveMesh = new THREE.Mesh(valveGeo, valveMat);
      valveMesh.position.set(0, 0.5, -1.6);
      arGroup.add(valveMesh);

      // Methane Volumetric Cloud
      let cloudOpacity = gasCutoffDone ? 0.12 : (gasPpm / 2.5) * 0.7;
      let cloudColor = gasPpm > 1.25 ? 0xeab308 : 0x10b981;

      const cloudGeo = new THREE.SphereGeometry(0.85, 24, 24);
      const cloudMat = new THREE.MeshStandardMaterial({
        color: cloudColor,
        emissive: gasCutoffDone ? 0x047857 : 0x854d0e,
        transparent: true,
        opacity: cloudOpacity,
        wireframe: true
      });
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.position.set(0, 0.3, -1.5);
      arGroup.add(cloudMesh);

      // Twin SCBA Compressed Air Cylinder Pack
      [-0.65, -0.42].forEach(x => {
        const scbaGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.8, 24);
        const scbaMat = new THREE.MeshStandardMaterial({
          color: scbaMaskEquipped ? 0x10b981 : 0x0284c7,
          metalness: 0.9,
          roughness: 0.2
        });
        const scbaMesh = new THREE.Mesh(scbaGeo, scbaMat);
        scbaMesh.position.set(x, -0.1, -1.3);
        arGroup.add(scbaMesh);
      });

      // Handheld Multi-Gas Detector Scanner Box
      const detectorGeo = new THREE.BoxGeometry(0.26, 0.38, 0.12);
      const detectorMat = new THREE.MeshStandardMaterial({ color: gasCalibrated ? 0x10b981 : 0xef4444, metalness: 0.6 });
      const detectorMesh = new THREE.Mesh(detectorGeo, detectorMat);
      detectorMesh.position.set(0.65, -0.1, -1.2);
      arGroup.add(detectorMesh);

    } else if (selectedModule === 'machinery') {
      // --- MODULE 3: HEAVY MACHINERY LOTO 3D SCENE ---
      const drumGeo = new THREE.CylinderGeometry(0.48, 0.48, 2.4, 32);
      const drumMat = new THREE.MeshStandardMaterial({
        color: breakerIsolated ? 0x334155 : 0x0284c7,
        metalness: 0.9,
        roughness: 0.2
      });
      const drumMesh = new THREE.Mesh(drumGeo, drumMat);
      drumMesh.rotation.z = Math.PI / 2;
      drumMesh.position.set(0, -0.1, -1.6);
      arGroup.add(drumMesh);

      const motorGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.9, 24);
      const motorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
      const motorMesh = new THREE.Mesh(motorGeo, motorMat);
      motorMesh.position.set(1.15, -0.1, -1.6);
      arGroup.add(motorMesh);

      const lockGeo = new THREE.BoxGeometry(0.24, 0.32, 0.14);
      const lockMat = new THREE.MeshStandardMaterial({
        color: lotoApplied ? 0x10b981 : 0xdc2626,
        metalness: 0.95,
        roughness: 0.15
      });
      const lockMesh = new THREE.Mesh(lockGeo, lockMat);
      lockMesh.position.set(0, 0.42, -1.3);
      arGroup.add(lockMesh);

      const shackleGeo = new THREE.TorusGeometry(0.09, 0.02, 12, 24, Math.PI);
      const shackleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95 });
      const shackleMesh = new THREE.Mesh(shackleGeo, shackleMat);
      shackleMesh.position.set(0, 0.6, -1.3);
      arGroup.add(shackleMesh);

      const boundGeo = new THREE.BoxGeometry(2.8, 1.25, 1.6);
      const boundMat = new THREE.MeshBasicMaterial({
        color: boundaryIdentified ? 0x10b981 : 0xef4444,
        wireframe: true
      });
      const boundMesh = new THREE.Mesh(boundGeo, boundMat);
      boundMesh.position.set(0, -0.1, -1.6);
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
    passState.sweepProgress, passState.squeezeTrigger, gasCalibrated, scbaMaskEquipped, gasCutoffDone, 
    boundaryIdentified, breakerIsolated, lotoApplied
  ]);

  // Three.js Render Animation Loop
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current) return;
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const camera = scene.children.find(c => c.isPerspectiveCamera);
    const arGroup = scene.children.find(c => c.name === "arGroup");

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (arGroup) {
        arGroup.rotation.x = rotationRef.current.x;
        arGroup.rotation.y = rotationRef.current.y + gyroAngleRef.current * 0.01;
      }

      if (particlesRef.current && passState.sweepProgress < 100) {
        const positions = particlesRef.current.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += Math.sin(Date.now() * 0.005 + i) * 0.002;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      if (camera && renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [passState.sweepProgress]);

  // Handle PASS Fire Extinguisher Actions
  const handlePassStep = (step) => {
    if (step === 'pullPin') {
      setPassState(prev => ({ ...prev, pullPin: true }));
      playAudioBeep('pass');
    } else if (step === 'aimBase') {
      setPassState(prev => ({ ...prev, aimBase: true }));
      playAudioBeep('pass');
    } else if (step === 'squeezeTrigger') {
      setPassState(prev => ({ ...prev, squeezeTrigger: true }));
      playAudioBeep('spray');
      let p = 0;
      const interval = setInterval(() => {
        p += 25;
        setPassState(prev => ({ ...prev, sweepProgress: Math.min(100, p) }));
        if (p >= 100) {
          clearInterval(interval);
          playAudioBeep('success');
        }
      }, 500);
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

  // Explicit Proceed to Quiz Navigation Handler
  const handleProceedToQuiz = () => {
    setModuleFinished(false);
    playAudioBeep('success');
    if (onNavigateToQuiz) {
      onNavigateToQuiz();
    } else if (onModuleComplete) {
      onModuleComplete(selectedModule, 95);
    }
  };

  // Dynamic & Clear Equipment Thermal Telemetry Calculator
  const getThermalData = () => {
    const baseNoise = Math.sin(Date.now() * 0.002) * 0.3;

    if (thermalTarget === 'ambient') {
      const valC = 28.5 + baseNoise;
      return {
        targetName: 'Mine Tunnel Strata Ambient Air',
        targetNameHi: 'भूमिगत सुरंग हवा (Ambient Air)',
        tempC: valC.toFixed(1),
        tempF: ((valC * 9 / 5) + 32).toFixed(1),
        status: 'OPTIMAL STRATA AIR TEMP',
        description: 'DGMS Standard Mine Airflow Temp (<30°C)',
        level: 'normal',
        color: 'text-emerald-400 border-emerald-500/80 bg-slate-950/95',
        badge: 'AMBIENT AIR (28.5°C)',
        emissivity: 'ε: 0.98'
      };
    }

    if (thermalTarget === 'gear') {
      const valC = 29.8 + baseNoise;
      return {
        targetName: 'Safety Extinguisher & SCBA Gear Pack',
        targetNameHi: 'सुरक्षा उपकरण (Safety Extinguisher Gear)',
        tempC: valC.toFixed(1),
        tempF: ((valC * 9 / 5) + 32).toFixed(1),
        status: 'EQUIPMENT COOL & READY',
        description: 'Pressurized DCP Cylinder Storage Temp',
        level: 'normal',
        color: 'text-cyan-400 border-cyan-500/80 bg-slate-950/95',
        badge: 'SAFETY GEAR (29.8°C)',
        emissivity: 'ε: 0.92'
      };
    }

    // Default 'equipment' active drill hazard target
    if (selectedModule === 'fire') {
      if (currentStep === 1 || currentStep === 2) {
        const valC = 248.5 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          targetName: 'High-Voltage Mining Cable (Active Fire)',
          targetNameHi: 'इलेक्ट्रिक खनन केबल (आग का हॉटस्पॉट)',
          tempC,
          tempF,
          status: 'CRITICAL OVERHEAT FIRE HAZARD',
          description: 'Electrical Cable Short Circuit Burning at 248°C! Extinguish Immediately.',
          level: 'critical',
          color: 'text-red-400 border-red-500/90 bg-slate-950/95',
          badge: 'BURNING CABLE (248.5°C)',
          emissivity: 'ε: 0.95'
        };
      } else if (currentStep === 3) {
        const progress = passState.sweepProgress || 0;
        const valC = Math.max(31.5, 220.0 - (progress / 100) * 188.5 + baseNoise);
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        const isCool = valC < 45.0;
        return {
          targetName: 'Cable Fire Base (Extinguishing)',
          targetNameHi: 'केबल फायर बेस (P.A.S.S. बुझाने की प्रक्रिया)',
          tempC,
          tempF,
          status: isCool ? 'FLAME COOLED TO SAFE LEVEL' : 'P.A.S.S. DISCHARGE COOLING IN PROGRESS',
          description: isCool ? 'DCP Powder Smothered Flame. Heat Dissipated.' : 'DCP Chemical Cooling Reaction In Progress.',
          level: isCool ? 'normal' : 'warm',
          color: isCool ? 'text-emerald-400 border-emerald-500/80 bg-slate-950/95' : 'text-amber-400 border-amber-500/80 bg-slate-950/95',
          badge: isCool ? 'COOLED (31°C)' : 'COOLING IN PROGRESS',
          emissivity: 'ε: 0.95'
        };
      } else {
        const valC = 29.4 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          targetName: 'Electrical Cable (Post-Fire Cooled)',
          targetNameHi: 'केबल (बुझने के बाद सामान्य तापमान)',
          tempC,
          tempF,
          status: 'SAFE AMBIENT TEMPERATURE',
          description: 'Cable Flame Completely Extinguished & Cooled to Ambient.',
          level: 'normal',
          color: 'text-emerald-400 border-emerald-500/80 bg-slate-950/95',
          badge: 'SAFE (29.4°C)',
          emissivity: 'ε: 0.95'
        };
      }
    }

    if (selectedModule === 'gas') {
      if (!gasCutoffDone && gasPpm > 1.25) {
        const valC = 78.4 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          targetName: 'CH4 Gas Pipe Joint & Release Valve',
          targetNameHi: 'मीथेन गैस पाइप रिसाव वाल्व (घर्षण ताप)',
          tempC,
          tempF,
          status: 'WARM GAS SEEPAGE FRICTION',
          description: 'High-Pressure Methane Gas Escaping Valve Joint at 78°C.',
          level: 'warm',
          color: 'text-amber-400 border-amber-500/80 bg-slate-950/95',
          badge: 'GAS VALVE (78.4°C)',
          emissivity: 'ε: 0.91'
        };
      } else {
        const valC = 28.8 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          targetName: 'CH4 Gas Valve (Isolated & Sealed)',
          targetNameHi: 'मीथेन वाल्व (बंद व सुरक्षित)',
          tempC,
          tempF,
          status: 'VALVE SEALED & COOLED',
          description: 'Gas Flow Isolated. Valve Temperature Normal.',
          level: 'normal',
          color: 'text-emerald-400 border-emerald-500/80 bg-slate-950/95',
          badge: 'SEALED (28.8°C)',
          emissivity: 'ε: 0.91'
        };
      }
    }

    if (selectedModule === 'machinery') {
      if (!breakerIsolated && !zeroEnergyVerified) {
        const valC = 124.6 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          targetName: 'Conveyor Motor Electric Bearing',
          targetNameHi: 'कन्वेयर बेल्ट मोटर बियरिंग (अत्यधिक गर्म)',
          tempC,
          tempF,
          status: 'ENERGIZED BEARING OVERHEAT',
          description: 'Conveyor Motor Bearing Overheating at 124°C. Isolate Breaker Immediately.',
          level: 'critical',
          color: 'text-red-400 border-red-500/90 bg-slate-950/95',
          badge: 'MOTOR BEARING (124°C)',
          emissivity: 'ε: 0.96'
        };
      } else {
        const valC = 30.2 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          targetName: 'Conveyor Motor (LOTO De-energized)',
          targetNameHi: 'कन्वेयर मोटर (LOTO लॉक के बाद सुरक्षित)',
          tempC,
          tempF,
          status: 'ZERO ENERGY COOLED SAFE',
          description: 'Breaker Isolated. Motor Fully Cooled & Safe for Maintenance.',
          level: 'normal',
          color: 'text-emerald-400 border-emerald-500/80 bg-slate-950/95',
          badge: 'LOCKED SAFE (30.2°C)',
          emissivity: 'ε: 0.96'
        };
      }
    }

    const valC = 28.6 + baseNoise;
    const tempC = valC.toFixed(1);
    const tempF = ((valC * 9 / 5) + 32).toFixed(1);
    return {
      targetName: 'Underground Tunnel Wall Strata',
      targetNameHi: 'भूमिगत खदान की दीवार (Strata)',
      tempC,
      tempF,
      status: 'NORMAL AMBIENT TEMP',
      description: 'Strata Temperature Within Safe Operational Limits.',
      level: 'normal',
      color: 'text-emerald-400 border-emerald-500/80 bg-slate-950/95',
      badge: 'NORMAL'
    };
  };

  return (
    <div className={`w-full border rounded-2xl shadow-xl overflow-hidden flex flex-col space-y-2 select-none max-w-full ${
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
      <div className="flex flex-wrap items-center justify-between px-2 sm:px-3 py-1 gap-1 text-xs">
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setFilterMode('ar');
              if (!cameraActive) startCamera();
            }}
            className={`px-2.5 sm:px-3 py-1.5 min-h-[38px] rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center space-x-1 ${
              filterMode === 'ar' ? 'bg-amber-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AR Camera</span>
          </button>

          <button
            onClick={() => setFilterMode('thermal')}
            className={`px-2.5 sm:px-3 py-1.5 min-h-[38px] rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center space-x-1 ${
              filterMode === 'thermal' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow ring-2 ring-red-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Thermal View</span>
          </button>

          <button
            onClick={() => setFilterMode('virtual')}
            className={`px-2.5 sm:px-3 py-1.5 min-h-[38px] rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center space-x-1 ${
              filterMode === 'virtual' ? 'bg-cyan-600 text-white shadow ring-2 ring-cyan-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D View</span>
          </button>

          {/* Flip Camera Button */}
          {filterMode !== 'virtual' && (
            <button
              onClick={toggleCameraFacing}
              className="px-2 py-1.5 min-h-[38px] rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] sm:text-xs font-bold transition-all flex items-center space-x-1"
              title="Switch Rear/Front Camera"
            >
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="uppercase font-mono">{cameraFacing === 'environment' ? 'REAR' : 'FRONT'}</span>
            </button>
          )}
        </div>

        {/* High-Contrast Outdoor Mode & Audio Toggle */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setHighContrastMode(!highContrastMode)}
            className={`p-2 min-h-[38px] rounded-xl border font-bold text-xs flex items-center justify-center ${
              highContrastMode ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
            title="High-Contrast Outdoor Sunlight Mode"
          >
            <Sun className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 min-h-[38px] rounded-xl border text-xs font-semibold flex items-center justify-center ${
              audioEnabled ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Thermal View Specific Equipment Target Selector Pills (Shown when Thermal View is active) */}
      {filterMode === 'thermal' && (
        <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 shrink-0">
            <Thermometer className="w-3.5 h-3.5 text-red-400" />
            <span>FLIR TARGET:</span>
          </span>
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setThermalTarget('equipment')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                thermalTarget === 'equipment' ? 'bg-red-500 text-white border-red-400' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              🔥 Equipment Hazard
            </button>
            <button
              onClick={() => setThermalTarget('ambient')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                thermalTarget === 'ambient' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              🌡️ Mine Air (Ambient)
            </button>
            <button
              onClick={() => setThermalTarget('gear')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                thermalTarget === 'gear' ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              🧯 Extinguisher Pack
            </button>
          </div>
        </div>
      )}

      {/* 3. AR Camera, Thermal & 3D Interactive Viewport */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[400px] bg-slate-950 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none max-w-full"
      >
        {/* Live Camera Feed (WebRTC Binding with FLIR False Color Matrix Filter when Thermal is active) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            filter: filterMode === 'thermal'
              ? 'contrast(200%) brightness(120%) saturate(300%) invert(0.85) hue-rotate(185deg)'
              : 'contrast(105%) brightness(105%)'
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-all ${
            cameraActive && filterMode !== 'virtual' ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none -z-10'
          }`}
        />

        {/* Camera Permission / Loading / Standby Overlay */}
        {filterMode === 'ar' && (!cameraActive || cameraError || isCameraLoading) && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center space-y-3">
            {isCameraLoading ? (
              <>
                <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Accessing AR Camera Hardware...</h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Initializing real-time video feed. Please allow camera permissions if requested by your device.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Camera className="w-10 h-10 text-amber-400 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">AR Live Camera Standby</h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Tap below to grant camera access for live real-world safety overlay inspection, or switch to 3D mode.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startCamera('environment')}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center space-x-1.5 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Enable AR Camera</span>
                  </button>
                  <button
                    onClick={() => setFilterMode('virtual')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700"
                  >
                    Use 3D Mode
                  </button>
                </div>
              </>
            )}
          </div>
        )}

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
            filter: filterMode === 'thermal' ? 'sepia(0.9) hue-rotate(130deg) saturate(3) contrast(1.6)' : 'none'
          }}
          className="absolute inset-0 w-full h-full pointer-events-none z-10" 
        />

        {/* High-Tech AR Target Reticle Overlay (when AR Camera is active) */}
        {filterMode === 'ar' && cameraActive && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 border-2 border-dashed border-amber-500/30 rounded-xl m-2">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold flex items-center gap-1">
                <Target className="w-3 h-3 animate-spin" />
                <span>AR SPATIAL TARGET LOCKED</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-950/80 text-emerald-400 font-bold border border-emerald-500/40">
                DIST: 1.4m [OPTIMAL]
              </span>
            </div>

            {/* Center Target Scanning Box */}
            <div className="w-36 h-36 border border-amber-400/60 rounded-2xl mx-auto my-auto flex items-center justify-center relative animate-pulse">
              <div className="w-4 h-4 border-t-2 border-l-2 border-amber-400 absolute top-0 left-0" />
              <div className="w-4 h-4 border-t-2 border-r-2 border-amber-400 absolute top-0 right-0" />
              <div className="w-4 h-4 border-b-2 border-l-2 border-amber-400 absolute bottom-0 left-0" />
              <div className="w-4 h-4 border-b-2 border-r-2 border-amber-400 absolute bottom-0 right-0" />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>

            <div className="text-center">
              <span className="px-3 py-1 rounded-full bg-slate-950/90 text-amber-400 text-[10px] font-mono border border-amber-500/40">
                60.0 FPS • COMPUTE CV TRACKER ONLINE
              </span>
            </div>
          </div>
        )}

        {/* Dynamic HUD Overlay: Gas CH4 PPM & Oxygen */}
        <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 bg-slate-950/90 px-3 py-1.5 rounded-full border border-red-500/40 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-[11px] font-mono font-bold text-red-400">CH4: {gasPpm}% VOL</span>
          <span className="text-[10px] text-slate-400">|</span>
          <span className="text-[11px] font-mono font-bold text-amber-400">O2: 20.9%</span>
        </div>

        {/* High-Tech FLIR Thermal Heatmap Bar & Crosshair Overlay (when Thermal View is active) */}
        {filterMode === 'thermal' && (() => {
          const thermal = getThermalData();
          return (
            <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3">
              {/* FLIR Thermal Color Legend Bar (Right Edge) */}
              <div className="absolute right-3 top-10 bottom-10 w-4 bg-gradient-to-t from-blue-600 via-green-500 via-yellow-400 to-red-600 rounded-full border border-white/40 flex flex-col justify-between text-[8px] font-mono text-white text-center py-1 font-bold shadow-lg">
                <span>300°</span>
                <span>150°</span>
                <span>50°</span>
                <span>20°</span>
              </div>

              {/* Center Thermal Target Scanner Reticle */}
              <div className="my-auto flex flex-col items-center justify-center max-w-sm mx-auto">
                <div className={`w-28 h-28 border-2 rounded-full flex items-center justify-center animate-pulse transition-all ${
                  thermal.level === 'critical' ? 'border-red-500/90 shadow-[0_0_25px_rgba(239,68,68,0.8)]' :
                  thermal.level === 'warm' ? 'border-amber-500/90 shadow-[0_0_20px_rgba(245,158,11,0.6)]' :
                  'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                }`}>
                  <div className={`w-4 h-4 rounded-full ${
                    thermal.level === 'critical' ? 'bg-red-500 animate-ping' :
                    thermal.level === 'warm' ? 'bg-amber-400 animate-ping' :
                    'bg-emerald-400'
                  }`} />
                </div>

                {/* FLIR Thermal Detailed Telemetry Card */}
                <div className={`mt-2 px-3 py-2 rounded-2xl border backdrop-blur-md shadow-2xl flex flex-col items-center space-y-1 w-full text-center ${thermal.color}`}>
                  <div className="text-[10px] font-mono font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>TARGET: {thermal.targetName}</span>
                  </div>

                  <div className="flex items-center justify-center space-x-2">
                    <Flame className={`w-4 h-4 ${
                      thermal.level === 'critical' ? 'text-red-400 animate-bounce' :
                      thermal.level === 'warm' ? 'text-amber-400' : 'text-emerald-400'
                    }`} />
                    <span className="text-base sm:text-lg font-mono font-black tracking-wider text-white">
                      {thermal.tempC}°C <span className="text-xs text-slate-300 font-normal">({thermal.tempF}°F)</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase border ${
                      thermal.level === 'critical' ? 'bg-red-500/30 text-red-300 border-red-500/60' :
                      thermal.level === 'warm' ? 'bg-amber-500/30 text-amber-300 border-amber-500/60' :
                      'bg-emerald-500/30 text-emerald-300 border-emerald-500/60'
                    }`}>
                      {thermal.badge}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono font-bold tracking-tight text-slate-200">
                    {thermal.status} • {thermal.description}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 pt-0.5 border-t border-slate-800 w-full flex justify-between px-2">
                    <span>{thermal.emissivity}</span>
                    <span>DISTANCE: 1.4M</span>
                    <span>FLIR PRO V2.4</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
                  extinguisherType === 'co2' ? 'bg-cyan-600/40 border-cyan-500 text-white shadow' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                ❄️ CO2 Gas Extinguisher
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Interactive Step Navigation & Drill Controls */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-3">
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>STEP {currentStep} OF {selectedModule === 'fire' ? 4 : selectedModule === 'gas' ? 4 : 2}</span>
          <span className="text-amber-400 font-bold uppercase">{selectedModule} DRILL</span>
        </div>

        {/* PASS Drill Action Controls for Fire Module */}
        {selectedModule === 'fire' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handlePassStep('pullPin')}
              className={`min-h-[48px] p-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                passState.pullPin ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <span>1. PULL PIN</span>
            </button>

            <button
              onClick={() => handlePassStep('aimBase')}
              className={`min-h-[48px] p-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                passState.aimBase ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Target className="w-4 h-4 text-cyan-400" />
              <span>2. AIM BASE</span>
            </button>

            <button
              onClick={() => handlePassStep('squeezeTrigger')}
              className={`min-h-[48px] p-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                passState.squeezeTrigger ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4 text-red-400" />
              <span>3. SQUEEZE</span>
            </button>

            <button
              onClick={advanceStep}
              className="min-h-[48px] p-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg flex items-center justify-center space-x-1"
            >
              <span>NEXT STEP</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Controls for Gas SCBA Module */}
        {selectedModule === 'gas' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleGasAction('calibrate')}
              className={`min-h-[48px] p-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                gasCalibrated ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>CALIBRATE</span>
            </button>

            <button
              onClick={() => handleGasAction('donScba')}
              className={`min-h-[48px] p-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                scbaMaskEquipped ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>MASK SCBA</span>
            </button>

            <button
              onClick={() => handleGasAction('gasCutoff')}
              className={`min-h-[48px] p-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                gasCutoffDone ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <Lock className="w-4 h-4 text-red-400" />
              <span>GAS CUTOFF</span>
            </button>

            <button
              onClick={advanceStep}
              className="min-h-[48px] p-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg flex items-center justify-center space-x-1"
            >
              <span>NEXT STEP</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Controls for Machinery LOTO Module */}
        {selectedModule === 'machinery' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleLotoAction('breaker')}
              className={`min-h-[48px] p-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                breakerIsolated ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>ISOLATE BREAKER</span>
            </button>

            <button
              onClick={() => handleLotoAction('lockout')}
              className={`min-h-[48px] p-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                lotoApplied ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <Lock className="w-4 h-4 text-red-400" />
              <span>APPLY LOTO LOCK</span>
            </button>

            <button
              onClick={advanceStep}
              className="min-h-[48px] p-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg flex items-center justify-center space-x-1"
            >
              <span>FINISH DRILL</span>
              <Award className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Module Completion Modal Box */}
      {moduleFinished && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <Award className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight">DRILL COMPLETED SUCCESSFULLY!</h3>
            <p className="text-xs text-slate-300">
              You have passed the <strong className="text-amber-400">{selectedModule.toUpperCase()}</strong> safety orientation drill.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleProceedToQuiz}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-lg"
              >
                PROCEED TO QUIZ
              </button>
              <button
                onClick={() => setModuleFinished(false)}
                className="py-3 px-4 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                RETRY DRILL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
