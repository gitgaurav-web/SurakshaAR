# 🛡️ SurakshaAR (ᱠᱷᱟᱫᱟᱱ ᱨᱩᱠᱷᱤYᱟᱹ / खदान सुरक्षा) - Team Handover & Technical Guide

---

## 📌 1. Project Overview (यह Project क्या है?)
**SurakshaAR** एक Mobile & Web-based **Augmented Reality (AR) Safety Simulator & Training Application** है। इसे **Directorate General of Mines Safety (DGMS)**, **Factories Act 1948**, और **Mines Act 1952** के अनुपालन (compliance) में झारखंड के खनन एवं औद्योगिक क्षेत्रों (Dhanbad Coalfields, Bokaro Steel, Jamshedpur Steel, Giridih Mines) के श्रमिकों (workers) को व्यावहारिक सुरक्षा प्रशिक्षण देने के लिए बनाया गया है।

---

## 💻 2. Tech Stack (कौन-कौन सी Technology Use हुई है?)
- **Frontend Framework:** React 19 + Vite (High-performance web build)
- **3D Graphics & AR Engine:** Three.js (WebGL 3D Rendering, Lighting, Shaders, Particles)
- **UI & Styling:** Tailwind CSS v4 + Lucide Icons + High-Contrast Outdoor Sunlight Mode
- **Native Android App Wrapper:** Capacitor 8 Native Android (WebRTC Camera, Filesystem, Preferences)
- **PDF Certificate Engine:** jsPDF + html2canvas (Offline digital certificate generation with QR code)
- **Audio Engine:** HTML5 Web Speech API (Multilingual TTS for Hindi, Santali, English)
- **Version Control & Hosting:** Git & GitHub (`https://github.com/gitgaurav-web/SurakshaAR`)

---

## 📁 3. File & Folder Structure (कौन सी फाइल कहाँ है और क्या काम करती है?)

```text
SurakshaAR/
├── android/                         # Capacitor Native Android Project (Gradle, Manifest, Java)
│   └── app/src/main/
│       ├── AndroidManifest.xml      # Camera, WAKE_LOCK, Storage permissions & features
│       └── java/.../MainActivity.java # WebView Camera Auto-Grant WebChromeClient override
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx    # DGMS Audit Dashboard, Mine Cluster analytics & QR verifier
│   │   ├── ai/
│   │   │   └── SurakshaAssistant.jsx  # AI Safety Assistant & Multilingual Voice bot
│   │   ├── ar/
│   │   │   └── ARSimulatorContainer.jsx # Main AR Training Engine (Camera, Thermal View, 3D Orbit, Fire/Gas/LOTO drills)
│   │   ├── assessment/
│   │   │   └── AssessmentEngine.jsx  # DGMS Compliance Quiz & Passing Score Evaluator
│   │   ├── certificate/
│   │   │   ├── CertificateView.jsx   # Digital Certificate Generator & Offline PDF Export
│   │   │   └── QRVerifierModal.jsx   # QR Code Authenticity Verifier Modal
│   │   ├── common/
│   │   │   ├── Header.jsx            # Top Navigation, Multilingual Selector & Status Bar
│   │   │   └── LanguageSelector.jsx  # Language Switcher dropdown (HI / SAT / EN)
│   │   ├── emergency/
│   │   │   └── EmergencySosModal.jsx # 1-Tap Emergency SOS Siren & Distress Signal
│   │   ├── explorer/
│   │   │   └── EquipmentExplorer.jsx # 3D Interactive Sandbox (360° rotation & part inspection cards)
│   │   ├── game/
│   │   │   └── HazardSpotterGame.jsx # Interactive Safety Hazard Spotting Mini-Game
│   │   └── guide/
│   │       └── WorkerGuide.jsx       # Worker Orientation & DGMS Protocol Handbook
│   ├── locales/
│   │   └── translations.js           # Multi-language text dictionary (Hindi, Santali Ol Chiki, English)
│   ├── utils/
│   │   └── audioEngine.js            # Multilingual Text-to-Speech & Sound Effects (Beeps, Alarms)
│   ├── App.jsx                       # Main Application State & View Routing Engine
│   ├── index.css                     # Tailwind CSS imports & Thermal Heatmap vision filters
│   └── main.jsx                      # React Root Mounting Entry Point
├── capacitor.config.json              # Capacitor Android Integration Configuration
├── package.json                       # Project dependencies and npm scripts
└── vite.config.js                     # Vite build & plugin configuration
```

---

## 🔥 4. Main Features & Modules Breakdown (मुख्य फीचर्स का विवरण)

### 1️⃣ **AR Training Engine (`ARSimulatorContainer.jsx`)**
- **AR Camera View:** Live camera stream feed behind 3D AR overlays (Evacuation arrows, hazard boundaries).
- **Thermal Heatmap View:** Real-time Thermal vision filter with dynamic target crosshair and hotspot temperature indicator (`185.4°C HEAT ANOMALY`).
- **3D View (Virtual Mode):** Full 360° mouse drag & touch swipe orbit rotation for 3D exploration.
- **Fire Safety Drill (Module 1):** Extinguisher selection (DCP/CO2) and interactive `P.A.S.S.` drill (`1. Pull Pin` -> `2. Aim Base` -> `3. Squeeze` -> `4. Sweep`).
- **Gas SCBA Drill (Module 2):** Toxic Gas plume detection, Multi-Gas Detector calibration, SCBA oxygen mask donning, and Gas valve isolation.
- **Machinery LOTO Drill (Module 3):** Red Stay-Clear danger perimeter zone, Circuit breaker isolation, Padlock tagging, and Zero-voltage test verification.

### 2️⃣ **3D Equipment Explorer Sandbox (`EquipmentExplorer.jsx`)**
- 360° Orbit rotation for realistic 3D models of Fire Extinguisher, SCBA Kit, Gas Detector (Methanometer), and LOTO Lockout Kit.
- Clicking model parts highlights them in yellow, displays detailed safety inspection popup cards, and plays audio voice guidance.

### 3️⃣ **Multilingual & Audio Voice Guide (`translations.js` & `audioEngine.js`)**
- Complete trilingual support in **Hindi (हिन्दी)**, **Santali (ᱥᱟᱱᱛᱟᱲᱤ / Ol Chiki)**, and **English**.
- Audio TTS narration for non-literate mine workers.

### 4️⃣ **Offline Digital PDF Certificate Generator (`CertificateView.jsx`)**
- Generates official DGMS-aligned safety certificate upon passing quiz (score >= 80%).
- One-click client-side PDF export using `jsPDF` without needing internet server APIs. Includes unique QR verification hash.

### 5️⃣ **DGMS Compliance Admin Dashboard (`AdminDashboard.jsx`)**
- Analytics tracking across Dhanbad Coalfields, Bokaro Steel, Jamshedpur Steel, and Giridih Mines.
- Built-in QR Code and Hash Code Certificate Authenticity Verifier.

### 6️⃣ **Emergency SOS Modal (`EmergencySosModal.jsx`)**
- One-tap emergency distress siren, location coordinates broadcast, and direct call trigger.

---

## ⚡ 5. How to Run the App (App को कैसे चलाएं?)

### **Web Application Run करने के लिए:**
```bash
# 1. Project folder me jayein
cd "e:\2 project sih"

# 2. Local development server start karein
npm run dev

# 3. Browser me open karein: http://localhost:5173
```

### **Android APK Compile/Build करने के लिए:**
```bash
# 1. Web assets build karein
npm run build

# 2. Capacitor Android sync karein
npx cap sync android

# 3. Android Debug APK compile karein
cd android
.\gradlew assembleDebug

# APK File Location:
# e:\2 project sih\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 🌐 6. GitHub Repository & Code Sync
- **Repository URL:** `https://github.com/gitgaurav-web/SurakshaAR`
- **Main Branch:** `main`

### **Code Update Push करने की Command Sequence:**
```bash
git add .
git commit -m "Your update description"
git push origin main
```

---

## 🎬 7. Presentation & SIH Judge Demo Sequence (Demo कैसे दें?)
1. **Introduction:** SurakshaAR का परिचय (DGMS, Mining Safety, Santali & Hindi support).
2. **AR & Thermal View Demo:** AR Camera, Thermal Heatmap Vision, aur 360° 3D Orbit View dikhayiye.
3. **Practical Drills:** Fire Safety P.A.S.S. Drill, Gas Detector Calibration, aur Machinery LOTO Lockout execute karein.
4. **3D Sandbox:** Equipment Explorer me parts inspect karke audio guidance sunayein.
5. **Certificate & Admin:** Quiz complete karke Instant PDF Certificate download karein aur Admin Dashboard me QR verify karke dikhayiye.

---
*Created for SurakshaAR Team Handover & SIH Submission readiness.*
