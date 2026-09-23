# SurakshaAR (ᱠᱷᱟᱫᱟᱱ ᱨᱩᱠᱷᱤヤ / खदान सुरक्षा)
### AR-Based Vocational Training & Safety Certification Platform for Industrial Safety in Jharkhand's Mining & Manufacturing Sector

![License](https://img.shields.io/badge/License-MIT-amber.svg)
![Build](https://img.shields.io/badge/Build-Passing-emerald.svg)
![Platform](https://img.shields.io/badge/Platform-Android%2010%2B%20%7C%20WebAR-blue.svg)
![DGMS Compliant](https://img.shields.io/badge/DGMS%20Dhanbad-Compliant-red.svg)
![Languages](https://img.shields.io/badge/Languages-Hindi%20%7C%20Santali%20(Ol%20Chiki)%20%7C%20English-gold.svg)

---

## 📌 Problem Statement Alignment

- **Problem Title**: AR-Based Vocational Training Simulator for Industrial Safety in Jharkhand's Mining & Manufacturing Sector
- **Target Audience**: Miners, steel plant workers, and mica processing recruits across Jharkhand (Dhanbad Coalfields, Bokaro Steel Plant, Giridih Mica Hub, Jamshedpur Steel Cluster).
- **Regulatory Standards**: Aligned with Directorate General of Mines Safety (DGMS) Dhanbad Directives, Mines Act 1952 (Section 22A), and Factories Act 1948.
- **Hardware Requirement**: Operates on mid-range Android smartphones (Android 10+, camera-based WebAR, **no external VR headset required**).

---

## 🏗️ System Architecture

```text
+-----------------------------------------------------------------------------------+
|                            SurakshaAR Architecture                                |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |             1. Mobile AR Training & Simulation Engine (PWA / APK)            |  |
|  |  - HTML5 Camera Feed + WebGL/Three.js AR Overlay                             |  |
|  |  - Camera Filter Spectrum (Standard AR, Thermal Heat, Night-Vision, 3D Shaft)|  |
|  |  - Gyroscope 360° Motion Tracking (DeviceOrientationEvent)                  |  |
|  |  - Memory-Safe Three.js Object Disposal Engine (RAM Leak Cleanup)           |  |
|  |  - Module 1: Fire & Explosion Safety (P.A.S.S. Extinguisher & Evacuation)    |  |
|  |  - Module 2: Gas Leak & Confined Space (Methane/CO Plumes & SCBA PPE Mask)    |  |
|  |  - Module 3: Machinery LOTO Protocol (Conveyor Belt Isolation & Stay-Clear)  |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  |        2. Accessibility, Multilingual Voice & AI Assistant Layer            |  |
|  |  - English, Hindi (हिंदी), Santali (ᱥᱟᱱᱛᱟᱲᱤ - Ol Chiki + Phonetic Speech)      |  |
|  |  - SurakshaMitra AI Voice Assistant (Speech-to-Text & Spoken Answers)        |  |
|  |  - 3D Interactive Equipment Explorer Sandbox (360° Rotation Controls)        |  |
|  |  - 48px × 48px Heavy-Duty Field Worker Touch Target Buttons                    |  |
|  |  - High-Contrast Outdoor Sunlight Mode Toggle (Yellow-on-Black UI)            |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  |            3. DGMS Assessment, QR Verification & Offline Sync               |  |
|  |  - Practical Scoring & Picture-Based Quiz Evaluation (Passing Standard >= 75%) |  |
|  |  - Verifiable Digital Safety Certificate with SHA Cryptographic Hash          |  |
|  |  - Direct Client-Side PDF File Exporter (jsPDF)                               |  |
|  |  - Durable Offline Storage (Capacitor Preferences + IndexedDB)                |  |
|  |  - Web Admin Compliance Dashboard (DGMS Inspector Scanner & CSV Audit Export) |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 🥽 Comprehensive Module Breakdown

### Module 1: Fire & Explosion Response
- **Real-Time AR Overlay**: 3D Fire Flame & Smoke particle systems rendered directly on camera feed.
- **Directional Exit Vectors**: Glowing AR green arrows pointing along the ground to safe underground refuge chambers.
- **Canister Selector**: Choose between DCP (Dry Chemical Powder) for methane/electrical fires or CO2 canisters.
- **P.A.S.S. Technique Drill**:
  1. **P**ull Safety Pin
  2. **A**im at base of fire
  3. **S**queeze lever
  4. **S**weep side-to-side (with live progress percentage bar)
- **Evacuation Countdown**: 45-second timer with audible warning alarms.

### Module 2: Gas Leak & Confined Space Protocol
- **Toxic Gas Cloud Visualizer**: Volumetric Methane ($CH_4$) & Carbon Monoxide ($CO$) gas clouds overlaid in room/shaft ceilings.
- **Detector Calibration**: Methane concentration readout ($CH_4 > 1.25\%$ VOL triggers mandatory power cutoff).
- **SCBA PPE Selection**: Self-Contained Breathing Apparatus (SCBA oxygen cylinder) and safety harness selector.
- **Buddy System Drill**: Attach steel tug rope to partner worker with 3-tug emergency hoist signal.

### Module 3: Heavy Machinery & Conveyor LOTO Safety
- **Danger Perimeter**: Red glowing AR stay-clear ring around moving conveyor belt drive rollers.
- **Lockout / Tagout (LOTO)**: Padlock & danger tag application to main circuit breaker before servicing.

### SurakshaMitra AI Voice Assistant (`src/components/ai/SurakshaAssistant.jsx`)
- Voice-activated safety assistant allowing low-literacy recruits to speak safety queries in Hindi, Santali, or English.
- Instant spoken audio responses using Web Speech API synthesis (`onvoiceschanged` async caching).

### 3D Equipment Explorer Sandbox (`src/components/explorer/EquipmentExplorer.jsx`)
- Interactive 3D inspection sandbox allowing 360-degree rotation and zoom of Extinguisher cutaway, SCBA oxygen cylinder, Multi-Gas Inspector, and LOTO Lock.

### DGMS Web Admin Compliance Dashboard (`src/components/admin/AdminDashboard.jsx`)
- Real-time compliance monitoring for Dhanbad Coalfields, Bokaro Steel Plant, Giridih Mica Hub, and Jamshedpur Steel Cluster.
- Worker roster table with search, sector filtering, and cert view links.
- Built-in camera QR code inspector authenticator modal.
- One-click CSV audit report export.

---

## 🤖 Native Android & Capacitor Architecture

- **`MainActivity.java` Permission Override**:
  ```java
  public class MainActivity extends BridgeActivity {
      @Override
      public void onCreate(Bundle savedInstanceState) {
          super.onCreate(savedInstanceState);
          if (this.bridge != null && this.bridge.getWebView() != null) {
              this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
                  @Override
                  public void onPermissionRequest(final PermissionRequest request) {
                      runOnUiThread(() -> request.grant(request.getResources()));
                  }
              });
          }
      }
  }
  ```
- **Native Permissions (`AndroidManifest.xml`)**:
  - `android.permission.CAMERA`
  - `android.permission.RECORD_AUDIO`
  - `android.permission.WAKE_LOCK`
  - `android.permission.WRITE_EXTERNAL_STORAGE`
  - `android.permission.READ_EXTERNAL_STORAGE`
  - `android.hardware.sensor.gyroscope` (optional feature)
- **Release Optimization (`android/app/build.gradle`)**:
  - `minifyEnabled true`
  - `shrinkResources true`
  - R8 / ProGuard code obfuscation and APK size reduction.

---

## ⚙️ How to Build & Run

### 1. Web Local Development Server
```bash
# Clone the repository
git clone https://github.com/gitgaurav-web/SurakshaAR.git
cd SurakshaAR

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. Build Web Production Bundle
```bash
npm run build
```

### 3. Sync & Build Android APK
```bash
# Copy web assets to native container
npx cap sync android

# Compile Debug Android APK via Gradle (Windows PowerShell)
$env:ANDROID_HOME="C:\Users\gaura\AppData\Local\Android\Sdk"; cd android; ./gradlew assembleDebug
```
The compiled Android APK is generated at:  
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📁 Repository Directory Map

```text
SurakshaAR/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx       # DGMS Compliance Dashboard & Inspector Portal
│   │   ├── ai/
│   │   │   └── SurakshaAssistant.jsx    # SurakshaMitra AI Voice Assistant
│   │   ├── ar/
│   │   │   └── ARSimulatorContainer.jsx # 3D WebGL / WebAR Camera Overlay Engine
│   │   ├── assessment/
│   │   │   └── AssessmentEngine.jsx     # Multi-Lingual Practical Safety Quiz
│   │   ├── certificate/
│   │   │   ├── CertificateView.jsx      # Digital Certificate & jsPDF Direct Downloader
│   │   │   └── QRVerifierModal.jsx      # Inspector QR Authenticator
│   │   ├── common/
│   │   │   ├── Header.jsx               # Navigation Bar & Network Indicator
│   │   │   └── LanguageSelector.jsx     # English / Hindi / Santali Ol Chiki Switcher
│   │   ├── explorer/
│   │   │   └── EquipmentExplorer.jsx    # 3D Interactive Equipment Explorer Sandbox
│   │   └── guide/
│   │       └── WorkerGuide.jsx          # Recruit Orientation & Audio Guide
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
│   │   └── AndroidManifest.xml         # Camera, Mic, WakeLock & Storage Permissions
│   └── app/build/outputs/apk/debug/
│       └── app-debug.apk                # Standalone Android APK (4.41 MB)
├── capacitor.config.json                # Capacitor Config
├── package.json                         # Dependencies & Scripts
└── README.md                            # Complete Project Documentation
```

---

## 📄 License & Attribution

Distributed under the **MIT License**.  
Developed for **Smart India Hackathon (SIH)** - Vocational Safety in Jharkhand's Mining & Steel Sector.
