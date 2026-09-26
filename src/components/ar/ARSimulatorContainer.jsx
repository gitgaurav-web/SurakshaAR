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

export default function ARSimulatorContainer({ currentLang, onModuleComplete, onNavigateToQuiz }) {
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
        group.rotation.y = rotationRef.current.y + (gyroAngleRef.current * Math.PI / 180) + Math.sin(elapsedTime * 0.5) * 0.04;
        group.rotation.x = rotationRef.current.x;
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
  }, []);

  // Update 3D Geometries & Visual Effects on Module/Step Changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    let arGroup = scene.getObjectByName("arGroup");
    if (!arGroup) return;

    // Memory Disposal of previous 3D meshes
    disposeThreeObject(arGroup);

    // ----------------------------------------------------
    // AAA HIGH-FIDELITY 3D MINE ENVIRONMENT & EQUIPMENT
    // ----------------------------------------------------
    
    // 1. Underground Mine Shaft Arch Tunnel Structure
    const tunnelGeo = new THREE.CylinderGeometry(2.4, 2.4, 6.0, 16, 1, true, 0, Math.PI);
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.95,
      metalness: 0.1,
      side: THREE.BackSide
    });
    const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnelMesh.rotation.x = Math.PI / 2;
    tunnelMesh.position.set(0, 0.8, -2.5);
    arGroup.add(tunnelMesh);

    // 2. Mine Shaft Pit Floor & Steel Rails
    const floorGeo = new THREE.PlaneGeometry(4.8, 6.0);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.9
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -0.65, -2.5);
    arGroup.add(floorMesh);

    // Parallel Steel Mine Track Rails
    [-0.55, 0.55].forEach(x => {
      const railGeo = new THREE.BoxGeometry(0.08, 0.08, 5.5);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
      const railMesh = new THREE.Mesh(railGeo, railMat);
      railMesh.position.set(x, -0.61, -2.5);
      arGroup.add(railMesh);
    });

    // 3. AR Green Floor Evacuation Arrows
    for (let i = 0; i < 4; i++) {
      const arrowGeo = new THREE.ConeGeometry(0.14, 0.38, 4);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
      arrowMesh.rotation.x = -Math.PI / 2;
      arrowMesh.position.set(-1.1 + i * 0.7, -0.63, -1.0 - i * 0.4);
      arGroup.add(arrowMesh);
    }

    // ----------------------------------------------------
    // MODULE-SPECIFIC HIGH-DETAIL 3D MODELS
    // ----------------------------------------------------
    if (selectedModule === 'fire') {
      // --- MODULE 1: FIRE SAFETY 3D SCENE ---

      // Overheated Electrical Junction Box Hazard Base
      const jboxGeo = new THREE.BoxGeometry(0.7, 0.8, 0.4);
      const jboxMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const jboxMesh = new THREE.Mesh(jboxGeo, jboxMat);
      jboxMesh.position.set(-0.3, 0.0, -1.6);
      arGroup.add(jboxMesh);

      // Yellow High Voltage Warning Decal Plate
      const decalGeo = new THREE.PlaneGeometry(0.25, 0.25);
      const decalMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const decalMesh = new THREE.Mesh(decalGeo, decalMat);
      decalMesh.position.set(-0.3, 0.15, -1.39);
      arGroup.add(decalMesh);

      // Active Volumetric Flame Mesh & Ember Particles
      if (passState.sweepProgress < 100) {
        const flameScale = Math.max(0.15, 1.0 - (passState.sweepProgress / 100));
        
        // Primary Outer Flame Cone
        const fireGeo = new THREE.ConeGeometry(0.4 * flameScale, 0.95 * flameScale, 16);
        const fireMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.2,
          roughness: 0.1
        });
        const fireMesh = new THREE.Mesh(fireGeo, fireMat);
        fireMesh.position.set(-0.3, 0.45 * flameScale, -1.5);
        arGroup.add(fireMesh);

        // Core Inner Flame Core
        const coreGeo = new THREE.ConeGeometry(0.2 * flameScale, 0.6 * flameScale, 12);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.position.set(-0.3, 0.4 * flameScale, -1.48);
        arGroup.add(coreMesh);
      }

      // High-Detail Industrial Extinguisher Model
      const tankColor = extinguisherType === 'dcp' ? 0xdc2626 : 0x0284c7;
      
      // Main Cylinder Body
      const tankGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.85, 32);
      const tankMat = new THREE.MeshStandardMaterial({ color: tankColor, metalness: 0.85, roughness: 0.2 });
      const tankMesh = new THREE.Mesh(tankGeo, tankMat);
      tankMesh.position.set(0.65, -0.15, -1.2);
      arGroup.add(tankMesh);

      // Chrome Valve Collar
      const collarGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.15, 24);
      const collarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
      const collarMesh = new THREE.Mesh(collarGeo, collarMat);
      collarMesh.position.set(0.65, 0.35, -1.2);
      arGroup.add(collarMesh);

      // Yellow Safety Pull-Pin Ring
      const ringGeo = new THREE.TorusGeometry(0.06, 0.015, 12, 24);
      const ringMat = new THREE.MeshStandardMaterial({ color: passState.pullPin ? 0x10b981 : 0xfacc15, metalness: 0.6 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0.76, 0.38, -1.18);
      arGroup.add(ringMesh);

      // Rubber Hose & Discharge Nozzle
      const hoseGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.65, 16);
      const hoseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const hoseMesh = new THREE.Mesh(hoseGeo, hoseMat);
      hoseMesh.rotation.z = passState.aimBase ? Math.PI / 4 : Math.PI / 6;
      hoseMesh.position.set(0.42, 0.25, -1.2);
      arGroup.add(hoseMesh);

      // DCP Chemical Powder Discharge Spray Particles
      if (passState.sweepProgress > 0 && passState.sweepProgress < 100) {
        const sprayCount = 80;
        const sprayGeo = new THREE.BufferGeometry();
        const sprayPos = new Float32Array(sprayCount * 3);
        for (let i = 0; i < sprayCount * 3; i += 3) {
          sprayPos[i] = 0.35 - Math.random() * 0.6;
          sprayPos[i + 1] = 0.1 + (Math.random() - 0.5) * 0.3;
          sprayPos[i + 2] = -1.2 - Math.random() * 0.4;
        }
        sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
        const sprayMat = new THREE.PointsMaterial({ color: 0xf8fafc, size: 0.08, transparent: true, opacity: 0.85 });
        const sprayParticles = new THREE.Points(sprayGeo, sprayMat);
        arGroup.add(sprayParticles);
      }

    } else if (selectedModule === 'gas') {
      // --- MODULE 2: GAS LEAK & SCBA 3D SCENE ---

      // Underground Steel Gas Main Pipeline
      const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.2, 24);
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 });
      const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
      pipeMesh.rotation.z = Math.PI / 2;
      pipeMesh.position.set(0, 0.1, -1.6);
      arGroup.add(pipeMesh);

      // Emergency Cutoff Valve Wheel (Rotatable Brass Wheel)
      const valveWheelGeo = new THREE.TorusGeometry(0.24, 0.04, 12, 24);
      const valveWheelMat = new THREE.MeshStandardMaterial({
        color: gasCutoffDone ? 0x10b981 : 0xd97706,
        metalness: 0.9,
        roughness: 0.2
      });
      const valveWheelMesh = new THREE.Mesh(valveWheelGeo, valveWheelMat);
      valveWheelMesh.rotation.x = Math.PI / 2;
      valveWheelMesh.position.set(0, 0.32, -1.6);
      arGroup.add(valveWheelMesh);

      // Swirling Methane Toxic Gas Cloud (Volumetric Mesh + Particle Swirl)
      const cloudColor = gasCutoffDone ? 0x10b981 : 0xeab308;
      const cloudOpacity = gasCutoffDone ? 0.08 : 0.55;

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

      // Motorized Conveyor Belt Drive Assembly
      // Main Belt Drum
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

      // Heavy Electric Motor Housing
      const motorGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.9, 24);
      const motorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
      const motorMesh = new THREE.Mesh(motorGeo, motorMat);
      motorMesh.position.set(1.15, -0.1, -1.6);
      arGroup.add(motorMesh);

      // Red Anodized LOTO Safety Padlock & Hasp
      const lockGeo = new THREE.BoxGeometry(0.24, 0.32, 0.14);
      const lockMat = new THREE.MeshStandardMaterial({
        color: lotoApplied ? 0x10b981 : 0xdc2626,
        metalness: 0.95,
        roughness: 0.15
      });
      const lockMesh = new THREE.Mesh(lockGeo, lockMat);
      lockMesh.position.set(0, 0.42, -1.3);
      arGroup.add(lockMesh);

      // Chrome Lock Shackle
      const shackleGeo = new THREE.TorusGeometry(0.09, 0.02, 12, 24, Math.PI);
      const shackleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95 });
      const shackleMesh = new THREE.Mesh(shackleGeo, shackleMat);
      shackleMesh.position.set(0, 0.6, -1.3);
      arGroup.add(shackleMesh);

      // Laser Danger Boundary Perimeter Fence Box
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

  // Dynamic Accurate Thermal Sensor Telemetry Calculator
  const getThermalData = () => {
    const baseNoise = Math.sin(Date.now() * 0.002) * 0.3;

    if (selectedModule === 'fire') {
      if (currentStep === 1 || currentStep === 2) {
        const valC = 248.5 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          tempC,
          tempF,
          status: 'CRITICAL HOTSPOT',
          description: 'ELECTRICAL CABLE FIRE ANOMALY',
          level: 'critical',
          color: 'text-red-400 border-red-500/80 bg-slate-950/90',
          badge: 'CRITICAL'
        };
      } else if (currentStep === 3) {
        const progress = passState.sweepProgress || 0;
        const valC = Math.max(31.5, 220.0 - (progress / 100) * 188.5 + baseNoise);
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        const isCool = valC < 45.0;
        return {
          tempC,
          tempF,
          status: isCool ? 'SAFE COOLING COMPLETE' : 'P.A.S.S. EXTINGUISHING IN PROGRESS',
          description: isCool ? 'THERMAL ANOMALY NEUTRALIZED' : 'DCP FLAME HEAT DISSIPATING',
          level: isCool ? 'normal' : 'warm',
          color: isCool ? 'text-emerald-400 border-emerald-500/80 bg-slate-950/90' : 'text-amber-400 border-amber-500/80 bg-slate-950/90',
          badge: isCool ? 'NORMAL' : 'COOLING'
        };
      } else {
        const valC = 29.4 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          tempC,
          tempF,
          status: 'NORMAL AMBIENT TEMP',
          description: 'FIRE HAZARD COOLED TO AMBIENT',
          level: 'normal',
          color: 'text-emerald-400 border-emerald-500/80 bg-slate-950/90',
          badge: 'NORMAL'
        };
      }
    }

    if (selectedModule === 'gas') {
      if (!gasCutoffDone && gasPpm > 1.25) {
        const valC = 78.4 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          tempC,
          tempF,
          status: 'WARM ANOMALY',
          description: 'CH4 LEAK FRICTION & VALVE HEAT',
          level: 'warm',
          color: 'text-amber-400 border-amber-500/80 bg-slate-950/90',
          badge: 'HIGH GAS'
        };
      } else {
        const valC = 28.8 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          tempC,
          tempF,
          status: 'NORMAL VENTILATION TEMP',
          description: 'UNDERGROUND MINE AIRFLOW OPTIMAL',
          level: 'normal',
          color: 'text-emerald-400 border-emerald-500/80 bg-slate-950/90',
          badge: 'NORMAL'
        };
      }
    }

    if (selectedModule === 'machinery') {
      if (!breakerIsolated && !zeroEnergyVerified) {
        const valC = 124.6 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          tempC,
          tempF,
          status: 'CRITICAL HOTSPOT',
          description: 'ENERGIZED MOTOR BEARING OVERHEAT',
          level: 'critical',
          color: 'text-red-400 border-red-500/80 bg-slate-950/90',
          badge: 'LOTO REQD'
        };
      } else if (breakerIsolated && !zeroEnergyVerified) {
        const valC = 52.3 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          tempC,
          tempF,
          status: 'WARM ANOMALY',
          description: 'ISOLATED - RESIDUAL MOTOR HEAT DISSIPATING',
          level: 'warm',
          color: 'text-amber-400 border-amber-500/80 bg-slate-950/90',
          badge: 'COOLING'
        };
      } else {
        const valC = 30.2 + baseNoise;
        const tempC = valC.toFixed(1);
        const tempF = ((valC * 9 / 5) + 32).toFixed(1);
        return {
          tempC,
          tempF,
          status: 'ZERO ENERGY SAFE',
          description: 'MOTOR FULLY COOLED & DE-ENERGIZED',
          level: 'normal',
          color: 'text-emerald-400 border-emerald-500/80 bg-slate-950/90',
          badge: 'SAFE'
        };
      }
    }

    const valC = 28.6 + baseNoise;
    const tempC = valC.toFixed(1);
    const tempF = ((valC * 9 / 5) + 32).toFixed(1);
    return {
      tempC,
      tempF,
      status: 'NORMAL AMBIENT TEMP',
      description: 'MINE SHAFT STRATA AMBIENT TEMP',
      level: 'normal',
      color: 'text-emerald-400 border-emerald-500/80 bg-slate-950/90',
      badge: 'NORMAL'
    };
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

          {/* Flip Camera Button */}
          {filterMode !== 'virtual' && (
            <button
              onClick={toggleCameraFacing}
              className="px-2.5 py-1.5 min-h-[38px] rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-all flex items-center space-x-1"
              title="Switch Rear/Front Camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-mono">{cameraFacing === 'environment' ? 'REAR' : 'FRONT'}</span>
            </button>
          )}
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
        {/* Live Camera Feed (Always rendered in DOM for WebRTC binding; toggle opacity instead of display:none) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            filter: filterMode === 'thermal' ? 'invert(0.85) hue-rotate(190deg) saturate(3.5) contrast(1.8)' : 'none'
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
        {filterMode === 'thermal' && (() => {
          const thermal = getThermalData();
          return (
            <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center">
              {/* Reticle Target */}
              <div className={`w-28 h-28 border-2 rounded-full flex items-center justify-center animate-pulse transition-all ${
                thermal.level === 'critical' ? 'border-red-500/90 shadow-[0_0_20px_rgba(239,68,68,0.6)]' :
                thermal.level === 'warm' ? 'border-amber-500/90 shadow-[0_0_15px_rgba(245,158,11,0.5)]' :
                'border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              }`}>
                <div className={`w-3.5 h-3.5 rounded-full ${
                  thermal.level === 'critical' ? 'bg-red-500 animate-ping' :
                  thermal.level === 'warm' ? 'bg-amber-400 animate-ping' :
                  'bg-emerald-400'
                }`} />
              </div>

              {/* Thermal Dynamic Telemetry Card */}
              <div className={`mt-3 px-4 py-2 rounded-2xl border backdrop-blur-md shadow-2xl flex flex-col items-center space-y-1 ${thermal.color}`}>
                <div className="flex items-center space-x-2">
                  <Flame className={`w-4 h-4 ${
                    thermal.level === 'critical' ? 'text-red-400 animate-bounce' :
                    thermal.level === 'warm' ? 'text-amber-400' : 'text-emerald-400'
                  }`} />
                  <span className="text-sm font-mono font-black tracking-wider text-white">
                    {thermal.tempC}°C <span className="text-xs text-slate-300 font-normal">({thermal.tempF}°F)</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase border ${
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
                onClick={handleProceedToQuiz}
                className="min-h-[48px] px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all flex items-center space-x-1.5"
              >
                <span>Proceed to DGMS Quiz</span>
                <ChevronRight className="w-4 h-4" />
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
            onClick={() => {
              const totalSteps = selectedModule === 'fire' ? 4 : selectedModule === 'gas' ? 4 : 2;
              if (currentStep >= totalSteps || moduleFinished) {
                handleProceedToQuiz();
              } else {
                advanceStep();
              }
            }}
            className="min-h-[48px] px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center space-x-1 shadow-md transition-all"
          >
            <span>
              {(currentStep >= (selectedModule === 'fire' ? 4 : selectedModule === 'gas' ? 4 : 2) || moduleFinished)
                ? 'Proceed to Quiz'
                : t.nextStep}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
