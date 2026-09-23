# SurakshaAR - AR-Based Vocational Training & Safety Simulator for Jharkhand

**Problem Statement Title**: AR-Based Vocational Training Simulator for Industrial Safety in Jharkhand's Mining & Manufacturing Sector  
**Target Sector**: Jharkhand Coal Mines (Dhanbad), Steel Plants (Bokaro / Jamshedpur), Mica Processing (Giridih)  
**Compliance Standards**: DGMS Dhanbad Alignment, Factories Act 1948, Mines Act 1952  

---

## 📌 Executive Overview

Jharkhand is India's leading mineral-producing state. Traditional classroom safety training achieves low retention rates, live drills are operationally disruptive, and VR headset simulators are financially inaccessible for small-scale mines and contract workers.

**SurakshaAR** (**ᱠᱷᱟᱫᱟᱱ ᱨᱩᱠᱷᱤᱭᱟᱹ / खदान सुरक्षा**) delivers an interactive, mobile AR-based vocational training and safety certification platform running on mid-range Android smartphones (Android 10+, camera-based AR, no external headset required).

---

## 🚀 Key Platform Features

### 1. Interactive Mobile AR Safety Modules (`src/components/ar/`)
- **Domain 1: Fire & Explosion Emergency Response**:
  - Live camera feed overlay with 3D Fire Flame & Smoke particle systems.
  - Glowing AR directional floor vectors leading to safe escape tunnels.
  - Interactive **P.A.S.S.** extinguisher drill (Pull pin -> Aim base -> Squeeze lever -> Sweep side-to-side).
  - Evacuation countdown drill (45-second timer).
- **Domain 2: Gas Leak & Confined Space Protocol**:
  - Volumetric Methane ($CH_4$) & Carbon Monoxide ($CO$) gas cloud simulation.
  - Digital Multi-Gas Detector calibration ($CH_4 > 1.25\%$ threshold automatic power cutoff).
  - SCBA (Self-Contained Breathing Apparatus) oxygen mask & safety harness selector.
  - Buddy safety line (3-tug emergency retrieval signal).
- **Domain 3: Machinery & Conveyor Safety**:
  - Lockout/Tagout (LOTO) key isolation on mining conveyor belt drive motors.
  - Red hazard boundary stay-clear warnings.

### 2. Multi-Lingual Accessibility & Audio Engine (`src/locales/` & `src/utils/`)
- Full support for **English**, **Hindi (हिंदी)**, and **Santali (ᱥᱟᱱᱛᱟᱲᱤ - Ol Chiki script)**.
- Integrated Web Speech API audio narration engine for workers with low literacy levels.
- High-Contrast Outdoor Sunlight Mode toggle for outdoor field use.

### 3. DGMS Assessment & Verifiable QR Certificates (`src/components/certificate/`)
- Interactive picture-based safety evaluation quiz (Passing standard $\ge 75\%$).
- Official **DGMS Compliant Digital Safety Certificates**.
- Embedded QR code containing unique SHA hash payload (`0x8F9A7B3C2D1E4F5A`) and verification URL.
- Direct client-side PDF document download (`jsPDF`).

### 4. DGMS Web Admin Compliance Dashboard (`src/components/admin/`)
- Real-time compliance monitoring across Dhanbad Coalfields, Bokaro Steel, Giridih Mica, and Jamshedpur Steel clusters.
- Worker roster management table with search and sector filtering.
- Camera/Input QR inspector verification modal.
- One-click export of audit reports in CSV format.

---

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 + Vite 8
- **3D Graphics & AR Engine**: Three.js (WebGL Particle Systems & 3D Geometry)
- **Styling**: Tailwind CSS + Glassmorphism & Custom Industrial HUD
- **Native Android Wrapper**: Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/filesystem`, `@capacitor/preferences`, `@capacitor/camera`, `@capacitor/status-bar`, `@capacitor/splash-screen`)
- **Audio Synthesis**: Web Speech API (`SpeechSynthesisUtterance`) + Web Audio API Synthesis
- **Document & QR Generation**: `jspdf` + `qrcode`

---

## ⚙️ Installation & Running Instructions

### 1. Web Local Development Server
```bash
# Install dependencies
npm install

# Launch Vite local dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. Building Web Production Assets
```bash
npm run build
```

### 3. Syncing & Building Standalone Android APK
```bash
# Sync web dist to Capacitor Android project
npx cap sync android

# Build Debug APK using Gradle (Windows PowerShell)
$env:ANDROID_HOME="C:\Users\gaura\AppData\Local\Android\Sdk"; cd android; ./gradlew assembleDebug
```
The compiled Android APK is located at:  
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📁 Repository Directory Structure

```text
2-project-sih/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx       # DGMS Compliance Dashboard
│   │   ├── ar/
│   │   │   └── ARSimulatorContainer.jsx # WebGL / WebAR 3D Camera Overlay Engine
│   │   ├── assessment/
│   │   │   └── AssessmentEngine.jsx     # Multi-Lingual Practical Quiz
│   │   ├── certificate/
│   │   │   ├── CertificateView.jsx      # Digital Certificate & PDF Export
│   │   │   └── QRVerifierModal.jsx      # Inspector QR Authenticator
│   │   ├── common/
│   │   │   ├── Header.jsx               # Navigation Bar & Network Indicator
│   │   │   └── LanguageSelector.jsx     # English / Hindi / Santali Ol Chiki Switcher
│   │   └── guide/
│   │       └── WorkerGuide.jsx          # Recruit Orientation & Voice Guide
│   ├── locales/
│   │   └── translations.js              # Multi-lingual Dictionary
│   ├── utils/
│   │   ├── audioEngine.js               # Voice Speech & Beep Sound Engine
│   │   └── offlineStorage.js            # Capacitor Preferences Offline Store
│   ├── App.jsx                          # Main App Controller
│   └── index.css                        # Tailwind CSS & Industrial Styling
├── android/                             # Native Android Studio Project
│   ├── app/src/main/
│   │   ├── java/in/gov/jharkhand/surakshaar/MainActivity.java # WebChromeClient Override
│   │   └── AndroidManifest.xml         # Camera, Mic & WakeLock Permissions
│   └── app/build/outputs/apk/debug/
│       └── app-debug.apk                # Standalone Android APK (4.41 MB)
├── capacitor.config.json                # Capacitor Configuration
├── package.json                         # Dependencies & Scripts
└── README.md                            # Documentation
```

---

## 📜 Compliance & Alignment

Aligned with:
- **Directorate General of Mines Safety (DGMS), Dhanbad** Standards
- **Mines Act, 1952** Section 22A Safety Directives
- **Factories Act, 1948** Vocational Safety Certification Standards
