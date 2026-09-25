import React, { useState, useEffect, useRef } from 'react';
import { X, Search, CheckCircle2, AlertTriangle, ShieldCheck, QrCode, Camera, RefreshCw, Zap } from 'lucide-react';
import { verifyCertByHash } from '../../utils/offlineStorage';
import { playAudioBeep } from '../../utils/audioEngine';

export default function QRVerifierModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'manual'
  const [inputHash, setInputHash] = useState('');
  const [verifiedWorker, setVerifiedWorker] = useState(null);
  const [searched, setSearched] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Start Camera for Live QR Code Scanning
  const startCamera = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      let stream = null;
      const attempts = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: { ideal: 'environment' } } },
        { video: true }
      ];

      for (const constraint of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          if (stream) break;
        } catch (e) {}
      }

      if (!stream) {
        throw new Error('No compatible camera stream found');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (pErr) {}
        setCameraActive(true);
      }

      // BarcodeDetector API for Live QR Code Scanning
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const scannedRaw = barcodes[0].rawValue;
                handleScannedData(scannedRaw);
              }
            } catch (err) {}
          }
        }, 500);
      }
    } catch (err) {
      console.warn('QR Camera stream unavailable:', err);
      setCameraActive(false);
      setActiveTab('manual');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleScannedData = (scannedText) => {
    let hashToVerify = scannedText;
    if (scannedText.includes('verify=')) {
      hashToVerify = scannedText.split('verify=')[1];
    }

    playAudioBeep('pass');
    setInputHash(hashToVerify);
    const result = verifyCertByHash(hashToVerify);
    setVerifiedWorker(result);
    setSearched(true);
    stopCamera();
  };

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (!inputHash.trim()) return;

    playAudioBeep('pass');
    const result = verifyCertByHash(inputHash);
    setVerifiedWorker(result);
    setSearched(true);
  };

  const simulateScan = () => {
    handleScannedData("0x8F9A7B3C2D1E4F5A");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl text-slate-950 font-black shadow-lg">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">DGMS Certificate QR Authenticator</h3>
            <p className="text-xs text-slate-400">Scan QR Code or enter worker ID / hash code</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('camera'); setSearched(false); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'camera' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera QR</span>
          </button>
          <button
            onClick={() => { setActiveTab('manual'); stopCamera(); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'manual' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Enter Hash ID</span>
          </button>
        </div>

        {/* --- 1. LIVE CAMERA SCANNER VIEW --- */}
        {activeTab === 'camera' && (
          <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Target Viewfinder Overlay */}
            <div className="relative z-10 w-48 h-48 border-2 border-dashed border-amber-400 rounded-2xl flex flex-col items-center justify-center bg-amber-500/5">
              <div className="w-full h-0.5 bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
              <span className="text-[10px] font-bold text-amber-300 mt-2 bg-slate-950/80 px-2 py-0.5 rounded-md">
                ALIGN QR CODE HERE
              </span>
            </div>

            {/* Simulate Scan Button for testing without physical QR */}
            <button
              onClick={simulateScan}
              className="absolute bottom-2 right-2 z-20 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black rounded-xl shadow-lg flex items-center space-x-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate QR Scan</span>
            </button>
          </div>
        )}

        {/* --- 2. MANUAL HASH INPUT VIEW --- */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualVerify} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 0x8F9A7B3C2D1E4F5A or JHK-MN-2026-081"
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs shadow-lg hover:brightness-110"
            >
              Verify Certificate Authenticity
            </button>

            {/* Quick Demo Hashes */}
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <span className="text-slate-400 font-semibold block text-[11px]">Click Sample Inspection Hashes:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { setInputHash('0x8F9A7B3C2D1E4F5A'); setVerifiedWorker(verifyCertByHash('0x8F9A7B3C2D1E4F5A')); setSearched(true); }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-xl font-mono text-[10px] text-amber-300 border border-slate-700"
                >
                  0x8F9A7B3C2D1E4F5A (Dhanbad)
                </button>
                <button
                  type="button"
                  onClick={() => { setInputHash('0x3C4D5E6F7A8B9C0D'); setVerifiedWorker(verifyCertByHash('0x3C4D5E6F7A8B9C0D')); setSearched(true); }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-xl font-mono text-[10px] text-amber-300 border border-slate-700"
                >
                  0x3C4D5E6F7A8B9C0D (Giridih)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* VERIFICATION RESULT CARD */}
        {searched && (
          <div className="pt-2 border-t border-slate-800">
            {verifiedWorker ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>OFFICIAL VERIFIED CERTIFICATE (AUTHENTIC)</span>
                </div>
                <div className="text-xs space-y-1 text-slate-300">
                  <p><strong>Worker:</strong> {verifiedWorker.name} ({verifiedWorker.id})</p>
                  <p><strong>Mining Unit:</strong> {verifiedWorker.mineSector}</p>
                  <p><strong>Orientation Status:</strong> {verifiedWorker.orientationDays} Days in Field</p>
                  <p><strong>Assessment Score:</strong> <span className="text-emerald-400 font-bold">{verifiedWorker.score}%</span></p>
                  <p><strong>Date Issued:</strong> {verifiedWorker.certDate}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div className="text-xs text-red-300">
                  <p className="font-bold">UNVERIFIED OR INVALID HASH</p>
                  <p>No matching safety record found in DGMS audit registry.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
