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
  const certVerifyUrl = `${window.location.origin}?verify=${certHash}`;

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

  // Client-side direct PDF File Export using jsPDF
  const exportPDF = () => {
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

      doc.save(`DGMS_Safety_Certificate_${worker.id}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold text-white">DGMS Digital Safety Certificate</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenScanner}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Verify QR</span>
          </button>
          
          <button
            onClick={exportPDF}
            disabled={downloading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-md flex items-center space-x-1 hover:brightness-110 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting PDF...' : 'Save PDF File'}</span>
          </button>
        </div>
      </div>

      {/* Official Printable Certificate Frame */}
      <div className="bg-slate-900 border-4 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
        <div className="pb-4 border-b border-amber-500/30">
          <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DGMS DHANBAD APPROVED STANDARDS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
            {t.certTitle}
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Factories Act 1948 & Mines Act 1952 Mandatory Certification
          </p>
        </div>

        <div className="py-4 space-y-2">
          <p className="text-xs text-slate-400 uppercase font-semibold">This is to certify that</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white">{worker.name}</h2>
          <p className="text-xs text-slate-300 max-w-lg mx-auto">
            has passed the mobile AR industrial safety training for <strong className="text-amber-400">Fire Response</strong>, <strong className="text-amber-400">Gas Leak SCBA Protocol</strong>, and <strong className="text-amber-400">Machinery LOTO</strong> with a score of <strong className="text-emerald-400">{worker.score}%</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 items-center text-xs">
          <div className="text-left space-y-1 text-slate-400">
            <p>Worker ID: <strong className="text-white">{worker.id}</strong></p>
            <p>Sector: <strong className="text-white">{worker.mineSector}</strong></p>
            <p>Date: <strong className="text-white">{worker.certDate}</strong></p>
          </div>

          <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="w-28 h-28" />
            ) : (
              <div className="w-28 h-28 bg-slate-200 animate-pulse rounded" />
            )}
            <span className="text-[9px] font-mono font-bold text-slate-900 mt-1">HASH: {certHash}</span>
          </div>

          <div className="text-right">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="text-xs font-bold text-white block">DGMS CERTIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
