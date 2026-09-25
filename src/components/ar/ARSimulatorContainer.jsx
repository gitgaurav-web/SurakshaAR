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

export default function ARSimulatorContainer({ currentLang, onModuleComplete, onNavigateToQuiz, onClaimCertificate }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const particlesRef = useRef(null);
  const extinguisherSprayRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const [cameraError, setCameraError] = useState(null);
  const [filterMode, setFilterMode] = useState('ar'); // 'ar', 'thermal', 'virtual'
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [gyroAngle, setGyroAngle] = useState(0);
  const [breakerIsolated, setBreakerIsolated] = useState(false);
  const [passState, setPassState] = useState({ pullPin: false, aimBase: false, squeezeLever: false, sweepSide: false });
  const previousTouchRef = useRef({ x: 0, y: 0 });

  // Bulletproof Camera Initialization with Multi-level Fallbacks & Explicit Play
  const startCamera = async (facing = cameraFacing) => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      let stream = null;
      const attempts = [
        { video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: { ideal: facing } } },
        { video: { facingMode: facing } },
        { video: true }
      ];

      for (const constraint of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          if (stream) break;
        } catch (e) {
          // Continue to next fallback constraint
        }
      }

      if (!stream) {
        throw new Error('No compatible camera stream found');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (pErr) {
          console.warn('Video auto-play deferred:', pErr);
        }
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera stream unavailable, switching to 3D Virtual mode:', err);
      setCameraError('Camera stream access denied or hardware busy.');
      setCameraActive(false);
    }
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    await startCamera(nextFacing);
  };

  // Initialize Camera Stream on Mount
  useEffect(() => {
    startCamera('environment');
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

  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateRef = useRef(false);
  autoRotateRef.current = autoRotate;

  const breakerIsolatedRef = useRef(breakerIsolated);
  breakerIsolatedRef.current = breakerIsolated;

  const passStateRef = useRef(passState);
  passStateRef.current = passState;

  const resetView = () => {
    setRotation({ x: 0, y: 0 });
    setAutoRotate(false);
  };

  // Initialize Three.js WebGL Scene & Industrial Underground Environment
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 3.2);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;
    } catch (err) {
      console.warn("WebGL initialization warning (using 2D visual fallback):", err);
    }

    // Underground Mine Floor Plane
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.2 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.75;
    scene.add(floorMesh);

    // Industrial Mine Shaft Grid Helper
    const gridHelper = new THREE.GridHelper(8, 16, 0xf59e0b, 0x334155);
    gridHelper.position.y = -0.74;
    scene.add(gridHelper);

    // Multi-source Scene Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const fireLight = new THREE.PointLight(0xf59e0b, 2.5, 10);
    fireLight.name = "fireLight";
    fireLight.position.set(-0.3, 0.4, -1.4);
    scene.add(fireLight);

    const arGroup = new THREE.Group();
    arGroup.name = "arGroup";
    scene.add(arGroup);

    // Ambient Underground Dust & Spark Particles
    const particleCount = 250;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 4;
      positions[i + 1] = Math.random() * 2.5;
      positions[i + 2] = -0.5 - Math.random() * 3;

      colors[i] = 0.95;
      colors[i + 1] = 0.65;
      colors[i + 2] = 0.15;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
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

      // Auto-Orbit 360° Animation
      if (autoRotateRef.current) {
        setRotation(prev => ({ ...prev, y: prev.y + 0.006 }));
      }

      // Dynamic Flame Core Wobble & Light Flicker
      const flameCore = scene.getObjectByName("flameCore");
      if (flameCore) {
        flameCore.scale.y = 1.0 + Math.sin(elapsedTime * 10) * 0.18;
        flameCore.scale.x = 1.0 + Math.cos(elapsedTime * 8) * 0.12;
      }
      const lightObj = scene.getObjectByName("fireLight");
      if (lightObj) {
        lightObj.intensity = 2.5 + Math.sin(elapsedTime * 14) * 0.8;
      }

      // Swirling Methane Gas Cloud
      const gasMesh = scene.getObjectByName("gasCloud");
      if (gasMesh) {
        gasMesh.rotation.y = elapsedTime * 0.25;
        gasMesh.rotation.z = Math.sin(elapsedTime * 0.6) * 0.1;
      }

      // Rotating Conveyor Roller
      const beltRoller = scene.getObjectByName("beltRoller");
      if (beltRoller && !breakerIsolatedRef.current) {
        beltRoller.rotation.x += 0.05;
      }

      // Extinguisher Spray Particles Animation
      const sprayPoints = scene.getObjectByName("extinguisherSpray");
      if (sprayPoints) {
        const posAttr = sprayPoints.geometry.attributes.position;
        for (let i = 0; i < posAttr.count * 3; i += 3) {
          posAttr.array[i] -= 0.04;
          posAttr.array[i + 1] += (Math.random() - 0.5) * 0.015;
          if (posAttr.array[i] < -0.8) {
            posAttr.array[i] = 0.02;
            posAttr.array[i + 1] = 0.34;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Ambient Dust Float
      if (particlesRef.current) {
        const posAttr = particlesRef.current.geometry.attributes.position;
        for (let i = 1; i < posAttr.count * 3; i += 3) {
          posAttr.array[i] += 0.01;
          if (posAttr.array[i] > 2.4) posAttr.array[i] = 0;
        }
        posAttr.needsUpdate = true;
      }

      const group = scene.getObjectByName("arGroup");
      if (group) {
        group.rotation.y = rotation.y + (gyroAngle * Math.PI / 180) + Math.sin(elapsedTime * 0.5) * 0.04;
        group.rotation.x = rotation.x;
      }

      if (renderer) {
        renderer.render(scene, camera);
        animationFrameRef.current = requestAnimationFrame(animate);
      }
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
      // 1. Fire Safety 3D Scene - Multi-mesh Flame & Industrial DCP Extinguisher
      if (passState.sweepProgress < 100) {
        // Outer Flame Mesh
        const outerGeo = new THREE.ConeGeometry(0.5, 1.05, 16);
        const outerMat = new THREE.MeshStandardMaterial({
          color: 0xdc2626,
          emissive: 0xef4444,
          emissiveIntensity: 0.9,
          roughness: 0.2,
          transparent: true,
          opacity: 0.88
        });
        const outerMesh = new THREE.Mesh(outerGeo, outerMat);
        outerMesh.position.set(-0.3, 0.1, -1.4);
        arGroup.add(outerMesh);

        // Inner Flame Core Mesh (Animated scale in render loop)
        const coreGeo = new THREE.ConeGeometry(0.32, 0.78, 16);
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xfbbf24,
          emissiveIntensity: 1.2,
          roughness: 0.1
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.name = "flameCore";
        coreMesh.position.set(-0.3, 0.1, -1.4);
        arGroup.add(coreMesh);
      }

      // Detailed Extinguisher Tank Assembly
      const tankGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.95, 32);
      const tankMat = new THREE.MeshStandardMaterial({
        color: extinguisherType === 'dcp' ? 0xdc2626 : 0x0284c7,
        metalness: 0.85,
        roughness: 0.2
      });
      const tankMesh = new THREE.Mesh(tankGeo, tankMat);
      tankMesh.position.set(0.55, -0.15, -1.1);
      arGroup.add(tankMesh);

      // Chrome Valve Head
      const headGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.set(0.55, 0.42, -1.1);
      arGroup.add(headMesh);

      // Pressure Gauge
      const gaugeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16);
      const gaugeMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.6 });
      const gaugeMesh = new THREE.Mesh(gaugeGeo, gaugeMat);
      gaugeMesh.rotation.x = Math.PI / 2;
      gaugeMesh.position.set(0.55, 0.44, -0.98);
      arGroup.add(gaugeMesh);

      // Squeeze Lever Handles
      const leverGeo = new THREE.BoxGeometry(0.22, 0.03, 0.06);
      const leverMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.5 });
      const leverMesh = new THREE.Mesh(leverGeo, leverMat);
      leverMesh.position.set(0.48, 0.48, -1.1);
      arGroup.add(leverMesh);

      // Yellow Safety Pull Pin Ring
      const pinGeo = new THREE.TorusGeometry(0.04, 0.01, 8, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: passState.pullPin ? 0x10b981 : 0xfacc15 });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(0.64, 0.46, -1.1);
      arGroup.add(pinMesh);

      // Flexible Hose & Conical Spray Nozzle
      const hoseGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.65, 16);
      const hoseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
      const hoseMesh = new THREE.Mesh(hoseGeo, hoseMat);
      hoseMesh.rotation.z = Math.PI / 2.8;
      hoseMesh.position.set(0.28, 0.22, -1.1);
      arGroup.add(hoseMesh);

      const nozzleGeo = new THREE.ConeGeometry(0.06, 0.22, 16);
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
      nozzleMesh.rotation.z = Math.PI / 2;
      nozzleMesh.position.set(0.02, 0.34, -1.1);
      arGroup.add(nozzleMesh);

      // DCP Extinguisher Powder Spray Stream (Active during squeeze & sweep)
      if (passState.squeezeTrigger || passState.sweepProgress > 0) {
        const sprayCount = 180;
        const sprayGeo = new THREE.BufferGeometry();
        const sprayPos = new Float32Array(sprayCount * 3);
        for (let i = 0; i < sprayCount * 3; i += 3) {
          sprayPos[i] = 0.02 - Math.random() * 0.4;
          sprayPos[i + 1] = 0.34 - Math.random() * 0.3;
          sprayPos[i + 2] = -1.1 - (Math.random() - 0.5) * 0.3;
        }
        sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
        const sprayMat = new THREE.PointsMaterial({
          size: 0.08,
          color: 0xf8fafc,
          transparent: true,
          opacity: 0.85
        });
        const sprayPoints = new THREE.Points(sprayGeo, sprayMat);
        sprayPoints.name = "extinguisherSpray";
        arGroup.add(sprayPoints);
      }

      // Exit Arrows
      for (let i = 0; i < 3; i++) {
        const arrowGeo = new THREE.ConeGeometry(0.18, 0.45, 4);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
        arrowMesh.rotation.z = -Math.PI / 2;
        arrowMesh.position.set(-1.1 + i * 0.7, -0.65, -1 - i * 0.2);
        arGroup.add(arrowMesh);
      }
    } else if (selectedModule === 'gas') {
      // 2. Gas & SCBA 3D Scene - Pipeline Assembly & Swirling Methane Cloud
      const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 32);
      const pipeMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.25
      });
      const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
      pipeMesh.rotation.z = Math.PI / 2;
      pipeMesh.position.set(0, 0.2, -1.6);
      arGroup.add(pipeMesh);

      // Flanged Pipe Joints
      [-1.1, 1.1].forEach(xPos => {
        const flangeGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 32);
        const flangeMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
        const flangeMesh = new THREE.Mesh(flangeGeo, flangeMat);
        flangeMesh.rotation.z = Math.PI / 2;
        flangeMesh.position.set(xPos, 0.2, -1.6);
        arGroup.add(flangeMesh);
      });

      // Red Shutoff Wheel Valve
      const valveWheelGeo = new THREE.TorusGeometry(0.22, 0.03, 16, 32);
      const valveWheelMat = new THREE.MeshStandardMaterial({
        color: gasCutoffDone ? 0x10b981 : 0xdc2626,
        metalness: 0.7,
        roughness: 0.3
      });
      const valveWheelMesh = new THREE.Mesh(valveWheelGeo, valveWheelMat);
      valveWheelMesh.name = "valveWheel";
      valveWheelMesh.rotation.x = Math.PI / 2;
      valveWheelMesh.position.set(0, 0.34, -1.6);
      arGroup.add(valveWheelMesh);

      // Brass Pressure Gauge Dial
      const gaugeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24);
      const gaugeMat = new THREE.MeshStandardMaterial({ color: gasCutoffDone ? 0x10b981 : 0xef4444, metalness: 0.7 });
      const gaugeMesh = new THREE.Mesh(gaugeGeo, gaugeMat);
      gaugeMesh.position.set(-0.6, 0.35, -1.6);
      arGroup.add(gaugeMesh);

      // Volumetric Methane Cloud Mesh
      const gasCloudGeo = new THREE.SphereGeometry(0.9, 24, 24);
      const gasCloudMat = new THREE.MeshStandardMaterial({
        color: gasCutoffDone ? 0x10b981 : 0xeab308,
        emissive: gasCutoffDone ? 0x047857 : 0xa16207,
        transparent: true,
        opacity: gasCutoffDone ? 0.08 : 0.6,
        wireframe: true
      });
      const gasCloudMesh = new THREE.Mesh(gasCloudGeo, gasCloudMat);
      gasCloudMesh.name = "gasCloud";
      gasCloudMesh.position.set(0, 0.4, -1.6);
      arGroup.add(gasCloudMesh);

      // Tactical Equipment Box & SCBA Pack
      const boxGeo = new THREE.BoxGeometry(0.85, 0.4, 0.55);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.position.set(-0.7, -0.4, -1.2);
      arGroup.add(boxMesh);

      // SCBA Cylinders
      [-0.8, -0.6].forEach(xPos => {
        const scbaGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.75, 24);
        const scbaMat = new THREE.MeshStandardMaterial({
          color: scbaMaskEquipped ? 0x10b981 : 0x0284c7,
          metalness: 0.85,
          roughness: 0.15
        });
        const scbaMesh = new THREE.Mesh(scbaGeo, scbaMat);
        scbaMesh.position.set(xPos, -0.1, -1.2);
        arGroup.add(scbaMesh);
      });
    } else if (selectedModule === 'machinery') {
      // 3. Machinery LOTO 3D Scene - Conveyor Assembly & 440V Lockout Panel
      const rollerGeo = new THREE.CylinderGeometry(0.45, 0.45, 2.5, 32);
      const rollerMat = new THREE.MeshStandardMaterial({
        color: breakerIsolated ? 0x334155 : 0x0284c7,
        metalness: 0.9,
        roughness: 0.2
      });
      const rollerMesh = new THREE.Mesh(rollerGeo, rollerMat);
      rollerMesh.name = "beltRoller";
      rollerMesh.rotation.z = Math.PI / 2;
      rollerMesh.position.set(0, -0.15, -1.5);
      arGroup.add(rollerMesh);

      // Conveyor Rubber Belt Frame
      const frameGeo = new THREE.BoxGeometry(2.7, 0.12, 1.2);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.set(0, -0.38, -1.5);
      arGroup.add(frameMesh);

      // Electric Motor Housing with Cooling Fins
      const motorGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.7, 24);
      const motorMat = new THREE.MeshStandardMaterial({
        color: breakerIsolated ? 0x475569 : 0xdc2626,
        emissive: breakerIsolated ? 0x000000 : 0x991b1b,
        emissiveIntensity: 0.6,
        metalness: 0.8
      });
      const motorMesh = new THREE.Mesh(motorGeo, motorMat);
      motorMesh.position.set(1.1, -0.15, -1.5);
      arGroup.add(motorMesh);

      // 440V LOTO Electrical Switchboard Cabinet
      const panelGeo = new THREE.BoxGeometry(0.55, 0.85, 0.35);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
      const panelMesh = new THREE.Mesh(panelGeo, panelMat);
      panelMesh.position.set(-1.0, 0.3, -1.3);
      arGroup.add(panelMesh);

      // 3D Circuit Breaker Switch Lever
      const leverGeo = new THREE.BoxGeometry(0.08, 0.22, 0.08);
      const leverMat = new THREE.MeshStandardMaterial({
        color: breakerIsolated ? 0x10b981 : 0xef4444,
        emissive: breakerIsolated ? 0x047857 : 0xb91c1c
      });
      const leverMesh = new THREE.Mesh(leverGeo, leverMat);
      leverMesh.position.set(-1.0, 0.35, -1.1);
      arGroup.add(leverMesh);

      // Red LOTO Safety Padlock
      if (lotoApplied) {
        const lockBodyGeo = new THREE.BoxGeometry(0.22, 0.28, 0.12);
        const lockBodyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8 });
        const lockBodyMesh = new THREE.Mesh(lockBodyGeo, lockBodyMat);
        lockBodyMesh.position.set(-1.0, 0.12, -1.1);
        arGroup.add(lockBodyMesh);

        const shackleGeo = new THREE.TorusGeometry(0.08, 0.02, 12, 24, Math.PI);
        const shackleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 });
        const shackleMesh = new THREE.Mesh(shackleGeo, shackleMat);
        shackleMesh.rotation.z = Math.PI;
        shackleMesh.position.set(-1.0, 0.26, -1.1);
        arGroup.add(shackleMesh);
      }

      // Danger Zone Floor Wireframe Boundary Box
      const boundGeo = new THREE.BoxGeometry(2.8, 1.2, 1.6);
      const boundMat = new THREE.MeshBasicMaterial({
        color: zeroEnergyVerified ? 0x10b981 : 0xef4444,
        wireframe: true
      });
      const boundMesh = new THREE.Mesh(boundGeo, boundMat);
      boundMesh.position.set(0, -0.15, -1.5);
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
              startCamera(cameraFacing);
            }}
            className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              filterMode === 'ar' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AR Camera</span>
          </button>

          <button
            onClick={() => {
              setFilterMode('thermal');
              if (!cameraActive) startCamera(cameraFacing);
            }}
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

          {/* Camera Flip Button */}
          <button
            onClick={toggleCameraFacing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-lg border border-slate-700 transition-all text-xs font-bold flex items-center space-x-1"
            title={`Flip Camera (Current: ${cameraFacing === 'environment' ? 'Rear' : 'Front'})`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">{cameraFacing === 'environment' ? 'Rear' : 'Front'}</span>
          </button>
        </div>

      {/* High-Contrast Outdoor Sunlight Mode & Audio Toggle */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => setHighContrastMode(!highContrastMode)}
          className={`px-2.5 py-1.5 min-h-[38px] rounded-xl border text-xs font-bold transition-all flex items-center space-x-1 ${
            highContrastMode 
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30' 
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
          title="High-Contrast Outdoor Sunlight Mode for Open-Cast Coal Mines (DGMS Reg 153)"
        >
          <Sun className={`w-3.5 h-3.5 ${highContrastMode ? 'text-slate-950 font-black' : 'text-amber-400'}`} />
          <span className="text-[10px] hidden sm:inline">{highContrastMode ? 'Sunlight ON' : 'Sunlight HD'}</span>
        </button>

        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`p-2 min-h-[38px] rounded-xl border text-xs font-semibold flex items-center justify-center ${
            audioEnabled ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
          title="Toggle Audio Voice Narration"
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
      className={`relative w-full h-[360px] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none ${
        highContrastMode ? 'bg-black ring-2 ring-amber-400/80 shadow-2xl' : 'bg-slate-950'
      }`}
    >
      {/* Live Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={() => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }}
        style={{
          filter: filterMode === 'thermal' 
            ? 'invert(0.85) hue-rotate(190deg) saturate(3.5) contrast(1.8)' 
            : highContrastMode 
              ? 'contrast(2.2) brightness(1.3) saturate(2.2)' 
              : 'none',
          transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none'
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-all ${
          cameraActive && filterMode !== 'virtual' ? 'opacity-85' : 'hidden'
        }`}
      />

        {/* Camera Offline / Permissions Retry Overlay */}
        {!cameraActive && filterMode !== 'virtual' && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-4 text-center space-y-3">
            <Camera className="w-9 h-9 text-amber-400 animate-bounce" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">AR Live Camera Stream Offline</h4>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                {cameraError || 'Grant camera permission or flip camera mode to align spatial tracking.'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => startCamera(cameraFacing)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center space-x-1.5 hover:brightness-110"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry AR Camera</span>
              </button>
              <button
                onClick={toggleCameraFacing}
                className="px-3.5 py-2 bg-slate-800 text-amber-400 border border-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1 hover:bg-slate-700"
              >
                <span>Switch to {cameraFacing === 'environment' ? 'Front' : 'Rear'}</span>
              </button>
            </div>
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
            filter: filterMode === 'thermal' 
              ? 'sepia(0.8) hue-rotate(140deg) saturate(3) contrast(1.5)' 
              : highContrastMode 
                ? 'contrast(1.6) brightness(1.2) saturate(1.8)' 
                : 'none'
          }}
          className="absolute inset-0 w-full h-full pointer-events-none z-10" 
        />

        {/* Sunlight HD Active Overlay Badge */}
        {highContrastMode && (
          <div className="absolute bottom-2 right-2 z-25 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center space-x-1 animate-pulse pointer-events-none">
            <Sun className="w-3 h-3 text-slate-950" />
            <span>☀️ OUTDOOR SUNLIGHT HD ACTIVE</span>
          </div>
        )}

        {/* Dynamic HUD Overlay: Gas CH4 PPM & Environmental Telemetry */}
        <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 bg-slate-950/90 px-3 py-1.5 rounded-full border border-red-500/40 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-[11px] font-mono font-bold text-red-400">CH4: {gasPpm}% VOL</span>
          <span className="text-[10px] text-slate-400">|</span>
          <span className="text-[11px] font-mono font-bold text-amber-400">O2: 20.9%</span>
        </div>

        {/* 3D Interactive Viewport Toolbar (Auto-Rotate & Center View Controls) */}
        <div className="absolute top-3 right-3 z-20 flex items-center space-x-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 shadow-xl">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all ${
              autoRotate ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle 360° Auto Rotation"
          >
            <RotateCcw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>360° Auto</span>
          </button>

          <button
            onClick={resetView}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-[10px] font-bold border border-slate-700/80 transition-all flex items-center space-x-1"
            title="Reset Viewport Orbit Angle"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Center</span>
          </button>
        </div>

        {/* 3D Spatial Interactive Target Badges (AR Annotations) */}
        <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-between px-6">
          {selectedModule === 'fire' && (
            <>
              <div className="bg-red-950/80 border border-red-500/60 px-2 py-1 rounded-lg text-[10px] font-mono text-red-300 shadow-lg animate-pulse">
                🔥 {passState.sweepProgress >= 100 ? 'EXTINGUISHED' : 'CLASS B FUEL FIRE (318°C)'}
              </div>
              <div className="bg-amber-950/80 border border-amber-500/60 px-2 py-1 rounded-lg text-[10px] font-mono text-amber-300 shadow-lg">
                🧯 {extinguisherType.toUpperCase()} EXTINGUISHER
              </div>
            </>
          )}

          {selectedModule === 'gas' && (
            <>
              <div className="bg-cyan-950/80 border border-cyan-500/60 px-2 py-1 rounded-lg text-[10px] font-mono text-cyan-300 shadow-lg">
                🤿 TWIN SCBA PACK (200 BAR)
              </div>
              <div className="bg-amber-950/80 border border-amber-500/60 px-2 py-1 rounded-lg text-[10px] font-mono text-amber-300 shadow-lg">
                ⚠️ CH4 HIGH-PRESSURE PIPE VALVE
              </div>
            </>
          )}

          {selectedModule === 'machinery' && (
            <>
              <div className="bg-blue-950/80 border border-blue-500/60 px-2 py-1 rounded-lg text-[10px] font-mono text-blue-300 shadow-lg">
                ⚡ 440V MAIN LOTO PANEL
              </div>
              <div className="bg-red-950/80 border border-red-500/60 px-2 py-1 rounded-lg text-[10px] font-mono text-red-300 shadow-lg">
                ⚙️ CONVEYOR MOTOR ({breakerIsolated ? 'ISOLATED' : '98.4°C OVERHEAT'})
              </div>
            </>
          )}
        </div>

        {/* Thermal Heatmap Crosshair & FLIR Telemetry Overlay when Thermal View is active */}
        {filterMode === 'thermal' && (() => {
          const thermal = getThermalData();
          return (
            <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center p-2">
              {/* FLIR Spectrum Side Scale Indicator */}
              <div className="absolute right-3 top-12 bottom-12 w-3.5 rounded-full bg-gradient-to-t from-blue-700 via-yellow-500 to-red-600 border border-slate-700 shadow-xl flex flex-col justify-between items-center py-1">
                <span className="text-[7px] font-mono text-white font-black bg-slate-950/90 px-0.5 rounded">HIGH</span>
                <span className="text-[7px] font-mono text-white font-black bg-slate-950/90 px-0.5 rounded">LOW</span>
              </div>

              {/* Center Crosshair Target */}
              <div className={`w-28 h-28 border-2 ${thermal.crosshairColor} rounded-full flex items-center justify-center relative transition-all`}>
                <div className={`w-3 h-3 ${thermal.dotColor} rounded-full shadow-lg`} />
                <div className="absolute top-0 w-0.5 h-3 bg-white/70" />
                <div className="absolute bottom-0 w-0.5 h-3 bg-white/70" />
                <div className="absolute left-0 h-0.5 w-3 bg-white/70" />
                <div className="absolute right-0 h-0.5 w-3 bg-white/70" />
              </div>

              {/* Real-time Dynamic FLIR Thermal Readout Box */}
              <div className={`mt-3 px-4 py-2 rounded-xl border-2 backdrop-blur-md shadow-2xl flex flex-col items-center space-y-1 transition-all ${thermal.badgeBg}`}>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-black tracking-wider uppercase text-slate-300">THERMAL SPOT:</span>
                  <span className="text-sm font-mono font-black text-white drop-shadow-md">{thermal.temp}°C</span>
                </div>

                <span className="text-[10px] font-bold tracking-tight text-center">{thermal.status}</span>

                <div className="pt-1 border-t border-white/15 flex items-center space-x-2.5 text-[9px] font-mono opacity-90">
                  <span>MAX: {thermal.maxSpot}°C</span>
                  <span>|</span>
                  <span>MIN: {thermal.minSpot}°C</span>
                  <span>|</span>
                  <span>ε: {thermal.emissivity}</span>
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
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => { setModuleFinished(false); setCurrentStep(1); }}
                className="min-h-[44px] px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
              >
                Re-drill Scenario
              </button>
              <button
                onClick={() => {
                  setModuleFinished(false);
                  setCurrentStep(1);
                  if (onNavigateToQuiz) onNavigateToQuiz();
                }}
                className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-extrabold shadow-md flex items-center space-x-1 cursor-pointer"
              >
                <span>Proceed to Quiz</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
              <button
                onClick={() => {
                  setModuleFinished(false);
                  setCurrentStep(1);
                  if (onClaimCertificate) onClaimCertificate(selectedModule, 95);
                }}
                className="min-h-[44px] px-5 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/25 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Award className="w-4 h-4 text-slate-950" />
                <span>📜 Claim Accredited Certificate</span>
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
