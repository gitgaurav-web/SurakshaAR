import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Box, RotateCcw, Volume2, ShieldCheck, Eye, Layers, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { speakInstruction, playAudioBeep } from '../../utils/audioEngine';

export default function EquipmentExplorer({ currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [activeGear, setActiveGear] = useState('extinguisher'); // 'extinguisher' | 'scba' | 'detector' | 'loto'
  const [rotationAngle, setRotationAngle] = useState(0);

  const gearInfo = {
    extinguisher: {
      titleEn: "3D Cutaway Fire Extinguisher (DCP Canister)",
      titleHi: "3D अग्निशामक सिलेंडर (DCP पाउडर)",
      titleSat: "3D ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱽ ᱥᱤᱞᱤᱱᱰᱚᱨ",
      descEn: "Pressurized steel vessel containing Dry Chemical Powder (DCP) with safety pin, pressure gauge dial, and siphon tube.",
      descHi: "सुरक्षा पिन, प्रेशर गेज डायल और साइफन ट्यूब के साथ सूखा रासायनिक पाउडर (DCP) वाला स्टील सिलेंडर।"
    },
    scba: {
      titleEn: "3D SCBA Positive Pressure Breathing Apparatus",
      titleHi: "3D SCBA ऑक्सीजन रिस्पिरेटर",
      titleSat: "3D SCBA ᱚᱠᱥᱤᱡᱚᱱ ᱢᱟᱥᱠ",
      descEn: "45-Minute carbon composite oxygen cylinder with full-face mask, demand valve regulator, and warning whistle.",
      descHi: "45 मिनट का कार्बन कंपोजिट ऑक्सीजन सिलेंडर, फुल-फेस मास्क और वार्निंग व्हिसल।"
    },
    detector: {
      titleEn: "3D Digital Multi-Gas Inspector",
      titleHi: "3D डिजिटल मल्टी-गैस डिटैक्टर",
      titleSat: "3D ᱜᱮᱥ ᱡᱟᱸᱪ ᱢᱮᱥᱤᱱ",
      descEn: "Intrinsically safe multi-gas sensor for Methane (CH4), Carbon Monoxide (CO), and Oxygen (O2) with visual alarm LED.",
      descHi: "मीथेन (CH4), कार्बन मोनोऑक्साइड (CO) और ऑक्सीजन के लिए सेंसर।"
    },
    loto: {
      titleEn: "3D LOTO Safety Lock & Circuit Tag",
      titleHi: "3D LOTO सुरक्षा ताला एवं डेंजर टैग",
      titleSat: "3D LOTO ᱛᱟᱞᱟ ᱟᱨ Danger Tag",
      descEn: "Heavy-duty steel shackle padlock with danger tag for main circuit breaker isolation during belt maintenance.",
      descHi: "कन्वेयर बेल्ट रखरखाव के दौरान मुख्य बिजली बंद करने के लिए सुरक्षा ताला व डेंजर टैग।"
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3);

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

    const dirLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const gearGroup = new THREE.Group();
    gearGroup.name = "gearGroup";
    scene.add(gearGroup);

    let clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      const group = scene.getObjectByName("gearGroup");
      if (group) {
        group.rotation.y = rotationAngle * (Math.PI / 180) + Math.sin(elapsedTime * 0.5) * 0.1;
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
  }, [rotationAngle]);

  // Re-build 3D Model when activeGear changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    let gearGroup = scene.getObjectByName("gearGroup");
    if (!gearGroup) return;

    while (gearGroup.children.length > 0) {
      const obj = gearGroup.children[0];
      gearGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }

    if (activeGear === 'extinguisher') {
      const tankGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 32);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8, roughness: 0.2 });
      const tankMesh = new THREE.Mesh(tankGeo, tankMat);
      gearGroup.add(tankMesh);

      const handleGeo = new THREE.BoxGeometry(0.2, 0.3, 0.1);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, 0.8, 0);
      gearGroup.add(handleMesh);
    } else if (activeGear === 'scba') {
      const scbaGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.3, 32);
      const scbaMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.9, roughness: 0.1 });
      const scbaMesh = new THREE.Mesh(scbaGeo, scbaMat);
      gearGroup.add(scbaMesh);
    } else if (activeGear === 'detector') {
      const boxGeo = new THREE.BoxGeometry(0.7, 1.1, 0.3);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5 });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      gearGroup.add(boxMesh);
    } else if (activeGear === 'loto') {
      const lockGeo = new THREE.BoxGeometry(0.6, 0.7, 0.3);
      const lockMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
      const lockMesh = new THREE.Mesh(lockGeo, lockMat);
      gearGroup.add(lockMesh);
    }
  }, [activeGear]);

  const currentInfo = gearInfo[activeGear];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-400">
            <Box className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">3D Equipment Inspection Sandbox</h2>
            <p className="text-xs text-slate-400">Rotate, zoom & inspect 3D industrial safety gear</p>
          </div>
        </div>

        {/* Gear Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {['extinguisher', 'scba', 'detector', 'loto'].map((gear) => (
            <button
              key={gear}
              onClick={() => { setActiveGear(gear); playAudioBeep('pass'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
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

      {/* 3D WebGL Canvas */}
      <div className="relative w-full h-[360px] bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden mine-grid-bg">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        <div className="absolute top-3 right-3 bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-center space-x-2">
          <button
            onClick={() => setRotationAngle(prev => (prev + 45) % 360)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-bold flex items-center space-x-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rotate 360°</span>
          </button>
        </div>
      </div>

      {/* Gear Description Card */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
        <h3 className="text-sm font-bold text-amber-400">
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
