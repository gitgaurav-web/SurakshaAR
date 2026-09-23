import React, { useState } from 'react';
import { X, ShieldAlert, Radio, MapPin, PhoneCall, CheckCircle2 } from 'lucide-react';
import { playAudioBeep, speakInstruction } from '../../utils/audioEngine';

export default function EmergencySosModal({ isOpen, onClose }) {
  const [sosSent, setSosSent] = useState(false);

  if (!isOpen) return null;

  const handleSendSos = () => {
    playAudioBeep('alarm');
    setSosSent(true);
    speakInstruction("Emergency SOS Beacon dispatched to DGMS Dhanbad mine control room!", 'hi');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-500/60 rounded-3xl p-6 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-600 text-white rounded-2xl animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">EMERGENCY MINE SOS PANIC BEACON</h3>
            <p className="text-xs text-red-400 font-bold">DGMS Control Room & Emergency Extraction Response</p>
          </div>
        </div>

        {!sosSent ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <MapPin className="w-4 h-4" />
                <span>Simulated GPS: 23.7957° N, 86.4304° E (Jharia Shaft #4)</span>
              </div>
              <p>Tapping below will dispatch an instant high-priority emergency signal with your worker ID, gas reading, and tunnel location to mine rescue teams.</p>
            </div>

            <button
              onClick={handleSendSos}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white font-black text-sm rounded-2xl shadow-2xl hover:brightness-110 animate-bounce flex items-center justify-center space-x-2"
            >
              <Radio className="w-5 h-5" />
              <span>DISPATCH EMERGENCY SOS BEACON NOW</span>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-emerald-400">EMERGENCY BEACON DISPATCHED!</h4>
            <p className="text-xs text-slate-300">
              Mine rescue squad & DGMS Dhanbad emergency extraction team notified. Maintain air supply SCBA gear.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
