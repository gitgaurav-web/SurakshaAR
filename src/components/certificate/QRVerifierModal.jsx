import React, { useState } from 'react';
import { X, Search, CheckCircle2, AlertTriangle, ShieldCheck, QrCode } from 'lucide-react';
import { verifyCertByHash } from '../../utils/offlineStorage';

export default function QRVerifierModal({ isOpen, onClose }) {
  const [inputHash, setInputHash] = useState('');
  const [verifiedWorker, setVerifiedWorker] = useState(null);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e) => {
    e.preventDefault();
    if (!inputHash.trim()) return;

    const result = verifyCertByHash(inputHash);
    setVerifiedWorker(result);
    setSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30">
            <QrCode className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">DGMS Certificate QR Authenticator</h3>
            <p className="text-xs text-slate-400">Scan QR Code or enter worker ID / hash code</p>
          </div>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleVerify} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. 0x8F9A7B3C2D1E4F5A or JHK-MN-2026-081"
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs shadow-lg hover:brightness-110"
          >
            Verify Certificate Authenticity
          </button>
        </form>

        {/* Quick Sample Hashes for Inspector Demo */}
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold block mb-1">Click Quick Demo Inspection Hash:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setInputHash('0x8F9A7B3C2D1E4F5A'); setVerifiedWorker(verifyCertByHash('0x8F9A7B3C2D1E4F5A')); setSearched(true); }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg font-mono text-[10px] text-amber-300"
            >
              0x8F9A7B3C2D1E4F5A (Dhanbad Coal)
            </button>
            <button
              onClick={() => { setInputHash('0x3C4D5E6F7A8B9C0D'); setVerifiedWorker(verifyCertByHash('0x3C4D5E6F7A8B9C0D')); setSearched(true); }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg font-mono text-[10px] text-amber-300"
            >
              0x3C4D5E6F7A8B9C0D (Giridih Mica)
            </button>
          </div>
        </div>

        {/* Result Card */}
        {searched && (
          <div className="pt-3 border-t border-slate-800">
            {verifiedWorker ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5" />
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
