import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Award, ShieldCheck, Download, Printer, QrCode, CheckCircle2, Building2, Calendar, UserCheck, FileCheck } from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { generateCertHash } from '../../utils/offlineStorage';

export default function CertificateView({ currentLang, activeWorker, onOpenScanner }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  
  const worker = activeWorker || {
    id: "JHK-MN-2026-081",
    name: "Budhan Manjhi",
    language: currentLang,
    mineSector: "Jharia Coalfield, Dhanbad Cluster",
    score: 92,
    certified: true,
    certHash: "0x8F9A7B3C2D1E4F5A",
    certDate: new Date().toISOString().split('T')[0]
  };

  const certHash = worker.certHash || generateCertHash(worker.id);
  const baseUrl = (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') || window.location.origin.includes('capacitor'))
    ? 'https://suraksha-ar.dgms.gov.in'
    : window.location.origin;
  const certVerifyUrl = `${baseUrl}?verify=${certHash}`;

  useEffect(() => {
    async function generateQR() {
      try {
        const url = await QRCode.toDataURL(certVerifyUrl, {
          width: 220,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' }
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Failed to generate QR Code:', err);
      }
    }
    generateQR();
  }, [certHash, certVerifyUrl]);

  // Client-side direct PDF File Export using jsPDF with Native Capacitor Filesystem support
  const exportPDF = async () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Border & Background
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 210, 'F');

      doc.setDrawColor(245, 158, 11); // amber-500
      doc.setLineWidth(3);
      doc.rect(8, 8, 281, 194);

      // Header
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text("DIRECTORATE GENERAL OF MINES SAFETY (DGMS)", 148, 28, { align: 'center' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("OFFICIAL INDUSTRIAL SAFETY CERTIFICATE", 148, 38, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("Issued under Factories Act 1948 & Mines Act 1952 Safety Training Standards", 148, 46, { align: 'center' });

      // Worker Details
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text("This is to certify that:", 148, 65, { align: 'center' });

      doc.setFontSize(26);
      doc.setTextColor(245, 158, 11);
      doc.text(worker.name.toUpperCase(), 148, 80, { align: 'center' });

      doc.setFontSize(11);
      doc.setTextColor(226, 232, 240);
      doc.text(`Worker ID: ${worker.id}  |  Sector: ${worker.mineSector}`, 148, 92, { align: 'center' });

      doc.text(`Evaluation Score: ${worker.score}%  |  Date: ${worker.certDate}`, 148, 102, { align: 'center' });

      // QR Code Image Embedding
      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, 'PNG', 123, 112, 50, 50);
      }

      doc.setFontSize(9);
      doc.setFont('courier', 'bold');
      doc.setTextColor(245, 158, 11);
      doc.text(`CERTIFICATE HASH: ${certHash}`, 148, 168, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Scan QR code using DGMS Inspector App or Web Admin Portal to verify authenticity.", 148, 182, { align: 'center' });

      // Check if running inside Capacitor Android Native app
      if (window.Capacitor?.isNativePlatform?.()) {
        try {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const pdfBase64 = doc.output('datauristring').split(',')[1];
          const fileName = `DGMS_Safety_Certificate_${worker.id}.pdf`;
          await Filesystem.writeFile({
            path: fileName,
            data: pdfBase64,
            directory: Directory.Documents,
            recursive: true
          });
          alert(`Certificate PDF saved successfully to your phone's Documents folder! (${fileName})`);
        } catch (nativeErr) {
          console.warn('Capacitor native write fallback to jsPDF save:', nativeErr);
          doc.save(`DGMS_Safety_Certificate_${worker.id}.pdf`);
        }
      } else {
        doc.save(`DGMS_Safety_Certificate_${worker.id}.pdf`);
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel-dark p-4 rounded-3xl border border-amber-500/40 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl text-slate-950 font-black shadow-md">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">DGMS Digital Safety Certificate</h2>
            <p className="text-[11px] text-slate-400">Factories Act 1948 & Mines Act 1952 Verification</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenScanner}
            className="min-h-[44px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-2xl text-xs font-black flex items-center space-x-1.5 border border-slate-700 shadow-md"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Verify QR</span>
          </button>
          
          <button
            onClick={exportPDF}
            disabled={downloading}
            className="min-h-[44px] px-5 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2 hover:brightness-110 disabled:opacity-50 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting PDF...' : 'Download PDF Certificate'}</span>
          </button>
        </div>
      </div>

      {/* Royal Gold Foil Holographic Certificate Frame */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-4 border-amber-500/60 rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center space-y-6 overflow-hidden">
        {/* Background Watermark Crest */}
        <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
          <ShieldCheck className="w-96 h-96 text-amber-400" />
        </div>

        {/* Header Badge & Title */}
        <div className="pb-5 border-b border-amber-500/30 relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-black tracking-widest uppercase shadow-md">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>DIRECTORATE GENERAL OF MINES SAFETY (DGMS) APPROVED</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 tracking-wider uppercase drop-shadow">
            {t.certTitle}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Issued under Factories Act 1948 & Mines Act 1952 Vocational Safety Training Standards
          </p>
        </div>

        {/* Recipient Details */}
        <div className="py-4 space-y-3 relative z-10">
          <p className="text-xs text-amber-400/90 uppercase tracking-widest font-bold">This is to certify that</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wide underline decoration-amber-500/50 underline-offset-8">
            {worker.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed pt-2">
            has successfully completed the Mobile AR Industrial Safety Practical Evaluation for <strong className="text-amber-400 font-extrabold">Fire Emergency Response</strong>, <strong className="text-amber-400 font-extrabold">Gas Leak SCBA Protocol</strong>, and <strong className="text-amber-400 font-extrabold">Heavy Machinery LOTO Isolation</strong> with an evaluation score of <strong className="text-emerald-400 font-black text-base">{worker.score}%</strong>.
          </p>
        </div>

        {/* Footer Details & Holographic QR Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-amber-500/30 items-center text-xs relative z-10">
          <div className="text-left space-y-1.5 text-slate-300 font-mono bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <p><span className="text-slate-500">WORKER ID:</span> <strong className="text-amber-400 font-bold">{worker.id}</strong></p>
            <p><span className="text-slate-500">SECTOR:</span> <strong className="text-white font-bold">{worker.mineSector}</strong></p>
            <p><span className="text-slate-500">DATE ISSUED:</span> <strong className="text-emerald-400 font-bold">{worker.certDate}</strong></p>
          </div>

          {/* Animated Glowing QR Code Frame */}
          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-xl ring-4 ring-amber-500/40 relative">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Certificate QR Code" className="w-28 h-28" />
            ) : (
              <div className="w-28 h-28 bg-slate-200 animate-pulse rounded-lg" />
            )}
            <span className="text-[9px] font-mono font-black text-slate-950 mt-1">HASH: {certHash}</span>
          </div>

          {/* Holographic Security Seal */}
          <div className="text-right flex justify-center sm:justify-end">
            <div className="p-4 bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border-2 border-amber-500/50 rounded-2xl text-center space-y-1 shadow-lg ring-1 ring-amber-400/30 max-w-[200px]">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto animate-bounce" />
              <span className="text-xs font-black text-amber-300 block tracking-wider">DGMS VERIFIED</span>
              <span className="text-[9px] text-slate-400 block font-mono">OFFICIAL SEAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
