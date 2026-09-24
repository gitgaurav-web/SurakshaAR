import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Box, RotateCcw, Volume2, ShieldCheck, Eye, Sparkles, Layers, Info, CheckCircle2 } from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { speakInstruction, playAudioBeep } from '../../utils/audioEngine';

export default function EquipmentExplorer({ currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const gearGroupRef = useRef(null);

  const [activeGear, setActiveGear] = useState('extinguisher'); // 'extinguisher' | 'scba' | 'detector' | 'loto'
  const [selectedPart, setSelectedPart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  const [rotationAngle, setRotationAngle] = useState({ x: 0.2, y: 0 });

  const gearInfo = {
    extinguisher: {
      titleEn: "3D Cutaway Fire Extinguisher (DCP Canister)",
      titleHi: "3D अग्निशामक सिलेंडर (DCP पाउडर)",
      titleSat: "3D ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱽ ᱥᱤᱞᱤᱱᱰᱚᱨ",
      descEn: "Pressurized steel vessel containing Dry Chemical Powder (DCP) with safety pin, pressure gauge dial, siphon tube, and discharge nozzle hose.",
      descHi: "सुरक्षा पिन, प्रेशर गेज डायल, साइफन ट्यूब और डिस्चार्ज नोज़ल होस के साथ सूखा रासायनिक पाउडर (DCP) वाला प्रेशर स्टील सिलेंडर।",
      parts: [
        { id: 'pin', name: 'Safety Pin & Tamper Seal', desc: 'Prevents accidental squeeze trigger operation during transport.' },
        { id: 'gauge', name: 'Pressure Gauge Dial', desc: 'Indicates internal nitrogen gas charge (Green zone = Ready to operate).' },
        { id: 'hose', name: 'Discharge Nozzle Hose', desc: 'Flexible hose for sweeping dry chemical powder at the base of fire.' }
      ]
    },
    scba: {
      titleEn: "3D SCBA Positive Pressure Breathing Apparatus",
      titleHi: "3D SCBA ऑक्सीजन रिस्पिरेटर",
      titleSat: "3D SCBA ᱚᱠᱥᱤᱡᱚᱱ ᱢᱟᱥᱠ",
      descEn: "45-Minute carbon-composite oxygen cylinder with full-face mask, demand valve regulator, and warning whistle.",
      descHi: "45 मिनट का कार्बन कंपोजिट ऑक्सीजन सिलेंडर, फुल-फेस मास्क, डिमांड वॉल्व रेगुलेटर और वार्निंग व्हिसल।",
      parts: [
        { id: 'tank', name: 'Carbon Fiber Air Tank', desc: 'High pressure 300 bar compressed breathable air cylinder.' },
        { id: 'mask', name: 'Positive Pressure Full Facepiece', desc: 'Silicone seal mask preventing toxic methane/CO gas ingress.' },
        { id: 'regulator', name: 'Demand Valve Regulator', desc: 'Regulates air delivery matching worker breathing frequency.' }
      ]
    },
    detector: {
      titleEn: "3D Digital Multi-Gas Inspector",
      titleHi: "3D डिजिटल मल्टी-गैस डिटैक्टर",
      titleSat: "3D ᱜᱮᱥ ᱡᱟᱸᱪ ᱢᱮᱥᱤᱱ",
      descEn: "Intrinsically safe multi-gas sensor detecting Methane (CH4), Carbon Monoxide (CO), Hydrogen Sulfide (H2S), and Oxygen (O2) levels.",
      descHi: "मीथेन (CH4), कार्बन मोनोऑक्साइड (CO), हाइड्रोजन सल्फाइड और ऑक्सीजन के लिए कैलिब्रेटेड मल्टी-गैस सेंसर।",
      parts: [
        { id: 'sensor', name: 'Catalytic Bead Sensor', desc: 'Measures explosive gas LEL % (Lower Explosive Limit).' },
        { id: 'lcd', name: 'Backlit LCD Telemetry Screen', desc: 'Real-time numerical readout of gas PPM and battery status.' },
        { id: 'alarm', name: 'Audible & Visual Strobe Alarm', desc: '95dB buzzer & pulsing red LED triggered when CH4 > 1.25%.' }
      ]
    },
    loto: {
      titleEn: "3D LOTO Safety Lock & Circuit Tag",
      titleHi: "3D LOTO सुरक्षा ताला एवं डेंजर टैग",
      titleSat: "3D LOTO ᱛᱟᱞᱟ ᱟᱨ Danger Tag",
      descEn: "Heavy-duty steel shackle padlock with danger tag for main circuit breaker isolation during conveyor belt maintenance.",
      descHi: "कन्वेयर बेल्ट रखरखाव के दौरान मुख्य सर्किट ब्रेकर बंद करने के लिए स्टील शेकल ताला व डेंजर टैग।",
      parts: [
        { id: 'shackle', name: 'Hardened Steel Shackle', desc: 'Resists mechanical cutting & tampering.' },
        { id: 'tag', name: 'Do Not Operate Danger Tag', desc: 'Identifies maintenance technician ID and lockout timestamp.' },
        { id: 'key', name: 'Single Key Lock Mechanism', desc: 'Ensures only authorized safety officer can unlock circuit.' }
      ]
    }
  };

  // Build 3D Models
  const buildGearMesh = (scene, type) => {
    let gearGroup = scene.getObjectByName("gearGroup");
    if (!gearGroup) {
      gearGroup = new THREE.Group();
      gearGroup.name = "gearGroup";
      scene.add(gearGroup);
    }

    // Flush old objects
    while (gearGroup.children.length > 0) {
      const obj = gearGroup.children[0];
      gearGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    if (type === 'extinguisher') {
      // Main Cylinder Body
      const tankGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.3, 32);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8, roughness: 0.2 });
      const tankMesh = new THREE.Mesh(tankGeo, tankMat);
      gearGroup.add(tankMesh);

      // Top Dome
      const domeGeo = new THREE.SphereGeometry(0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8, roughness: 0.2 });
      const domeMesh = new THREE.Mesh(domeGeo, domeMat);
      domeMesh.position.y = 0.65;
      gearGroup.add(domeMesh);

      // Valve Handle Trigger
      const handleGeo = new THREE.BoxGeometry(0.12, 0.25, 0.4);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, 0.95, 0);
      gearGroup.add(handleMesh);

      // Safety Pin Ring
      const pinGeo = new THREE.TorusGeometry(0.08, 0.02, 16, 24);
      const pinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(0.18, 0.95, 0.1);
      gearGroup.add(pinMesh);

      // Pressure Gauge Dial
      const gaugeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
      const gaugeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
      const gaugeMesh = new THREE.Mesh(gaugeGeo, gaugeMat);
      gaugeMesh.rotation.x = Math.PI / 2;
      gaugeMesh.position.set(0, 0.85, 0.22);
      gearGroup.add(gaugeMesh);

      // Hose Pipe
      const hoseGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16);
      const hoseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const hoseMesh = new THREE.Mesh(hoseGeo, hoseMat);
      hoseMesh.rotation.z = -Math.PI / 4;
      hoseMesh.position.set(-0.3, 0.5, 0);
      gearGroup.add(hoseMesh);
    } else if (type === 'scba') {
      // Carbon Composite Cylinder
      const scbaGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.4, 32);
      const scbaMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8, roughness: 0.2 });
      const scbaMesh = new THREE.Mesh(scbaGeo, scbaMat);
      gearGroup.add(scbaMesh);

      // Mask Body
      const maskGeo = new THREE.SphereGeometry(0.35, 24, 24);
      const maskMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.7 });
      const maskMesh = new THREE.Mesh(maskGeo, maskMat);
      maskMesh.position.set(0.6, 0.2, 0);
      gearGroup.add(maskMesh);

      // Regulator Valve
      const regGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16);
      const regMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
      const regMesh = new THREE.Mesh(regGeo, regMat);
      regMesh.position.set(0, -0.8, 0);
      gearGroup.add(regMesh);
    } else if (type === 'detector') {
      // Digital Gas Inspector Casing
      const bodyGeo = new THREE.BoxGeometry(0.75, 1.2, 0.35);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.4, roughness: 0.3 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      gearGroup.add(bodyMesh);

      // LCD Screen
      const lcdGeo = new THREE.PlaneGeometry(0.55, 0.4);
      const lcdMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const lcdMesh = new THREE.Mesh(lcdGeo, lcdMat);
      lcdMesh.position.set(0, 0.25, 0.18);
      gearGroup.add(lcdMesh);

      // Sensor Grille
      const sensorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
      const sensorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
      const sensorMesh = new THREE.Mesh(sensorGeo, sensorMat);
      sensorMesh.rotation.x = Math.PI / 2;
      sensorMesh.position.set(0, -0.3, 0.18);
      gearGroup.add(sensorMesh);

      // Alarm LED Strobe
      const ledGeo = new THREE.SphereGeometry(0.06, 16, 16);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(0, 0.52, 0.18);
      gearGroup.add(ledMesh);
    } else if (type === 'loto') {
      // Padlock Body
      const lockGeo = new THREE.BoxGeometry(0.65, 0.75, 0.3);
      const lockMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
      const lockMesh = new THREE.Mesh(lockGeo, lockMat);
      gearGroup.add(lockMesh);

      // Steel Shackle Ring
      const shackleGeo = new THREE.TorusGeometry(0.25, 0.06, 16, 32, Math.PI);
      const shackleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95 });
      const shackleMesh = new THREE.Mesh(shackleGeo, shackleMat);
      shackleMesh.position.set(0, 0.38, 0);
      gearGroup.add(shackleMesh);

      // Danger Tag Board
      const tagGeo = new THREE.PlaneGeometry(0.5, 0.8);
      const tagMat = new THREE.MeshBasicMaterial({ color: 0xdc2626, side: THREE.DoubleSide });
      const tagMesh = new THREE.Mesh(tagGeo, tagMat);
      tagMesh.position.set(0.4, -0.3, 0.05);
      gearGroup.add(tagMesh);
    }
  };

  // Initialize Three.js Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xf59e0b, 2.0);
    dirLight1.position.set(3, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight2.position.set(-3, -3, 2);
    scene.add(dirLight2);

    // Initial Mesh Creation
    buildGearMesh(scene, activeGear);

    let clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      const group = scene.getObjectByName("gearGroup");
      if (group && !isDragging) {
        group.rotation.y += 0.008; // Continuous subtle auto-rotation when idle
        group.position.y = Math.sin(elapsedTime * 1.5) * 0.03;
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
      renderer.dispose();
    };
  }, []);

  // Update mesh when activeGear changes
  useEffect(() => {
    if (sceneRef.current) {
      buildGearMesh(sceneRef.current, activeGear);
      setSelectedPart(null);
    }
  }, [activeGear]);

  // Touch & Mouse Drag 360-degree Rotation Handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setPreviousMousePosition({
      x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
      y: e.clientY || (e.touches && e.touches[0].clientY) || 0
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sceneRef.current) return;
    const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

    const deltaX = currentX - previousMousePosition.x;
    const deltaY = currentY - previousMousePosition.y;

    const group = sceneRef.current.getObjectByName("gearGroup");
    if (group) {
      group.rotation.y += deltaX * 0.01;
      group.rotation.x += deltaY * 0.01;
    }

    setPreviousMousePosition({ x: currentX, y: currentY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const currentInfo = gearInfo[activeGear];

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
      {/* Header & Gear Selector Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-400">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">3D Equipment Inspection Sandbox</h2>
            <p className="text-[11px] text-slate-400">Drag/Swipe to rotate 360° & inspect safety equipment parts</p>
          </div>
        </div>

        {/* Selector Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {['extinguisher', 'scba', 'detector', 'loto'].map((gear) => (
            <button
              key={gear}
              onClick={() => { setActiveGear(gear); playAudioBeep('pass'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                activeGear === gear
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {gear}
            </button>
          ))}
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport with Touch/Mouse Orbit Rotation */}
      <div
        className="relative w-full h-[360px] bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden mine-grid-bg cursor-grab active:cursor-grabbing touch-none select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Rotation Drag Hint Overlay */}
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30 text-[10px] font-mono text-amber-400 flex items-center space-x-1.5 pointer-events-none">
          <Eye className="w-3.5 h-3.5" />
          <span>DRAG / SWIPE TO ROTATE 360°</span>
        </div>

        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={() => {
              if (sceneRef.current) {
                const group = sceneRef.current.getObjectByName("gearGroup");
                if (group) { group.rotation.x = 0; group.rotation.y = 0; }
              }
            }}
            className="px-2.5 py-1.5 bg-slate-900/90 text-amber-400 rounded-xl border border-slate-800 text-[11px] font-bold flex items-center space-x-1 shadow-md hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset 3D View</span>
          </button>
        </div>
      </div>

      {/* Interactive Part Inspection Selector */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
          Inspect Detailed Parts & Components:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {currentInfo.parts.map((part) => {
            const isSelected = selectedPart === part.id;
            return (
              <button
                key={part.id}
                onClick={() => {
                  setSelectedPart(isSelected ? null : part.id);
                  playAudioBeep('pass');
                  speakInstruction(`${part.name}. ${part.desc}`, currentLang);
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                  <span>{part.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">{part.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Description */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
        <h3 className="text-sm font-bold text-white">
          {currentLang === 'hi' ? currentInfo.titleHi : currentLang === 'sat' ? currentInfo.titleSat : currentInfo.titleEn}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {currentLang === 'hi' ? currentInfo.descHi : currentInfo.descEn}
        </p>
        <button
          onClick={() => speakInstruction(currentLang === 'hi' ? currentInfo.descHi : currentInfo.descEn, currentLang)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold flex items-center space-x-1"
        >
          <Volume2 className="w-4 h-4" />
          <span>Listen Audio Guide</span>
        </button>
      </div>
    </div>
  );
}
