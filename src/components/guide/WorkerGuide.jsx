import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Flame, Wind, Cog, Award, Volume2, Camera, ShieldCheck, CheckCircle2, Download, FileText } from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { speakInstruction } from '../../utils/audioEngine';

export default function WorkerGuide({ currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [downloading, setDownloading] = useState(false);

  const steps = [
    {
      icon: Camera,
      titleEn: "1. Camera Pointing & AR Overlay",
      titleHi: "1. कैमरा ओरिएंटेशन और AR सिमुलेशन",
      titleSat: "᱑. ᱠᱮᱢᱨᱟ ᱚᱛ ᱥᱮᱫ ᱟᱹᱪᱩᱨ",
      descEn: "Hold your smartphone camera pointing at your workplace surroundings. Glowing AR directional vectors and 3D hazards will appear on screen.",
      descHi: "अपने स्मार्टफोन कैमरे को फर्श या आसपास की सतह पर रखें। स्क्रीन पर हरे AR तीर और 3D सुरक्षा संकेत दिखाई देंगे।",
      descSat: "ᱟᱢᱟᱜ ᱯᱷᱚᱱ ᱠᱮᱢᱨᱟ ᱚᱛ ᱥᱮᱫ ᱟᱹᱪᱩᱨ ᱢᱮ। ᱥᱠᱨᱤᱱ ᱨᱮ ᱦᱟᱹᱨᱤᱭᱟᱹᱲ AR ᱪᱤᱱᱦᱟᱹ ᱧᱮᱞᱚᱜ-ᱟ।"
    },
    {
      icon: Flame,
      titleEn: "2. Fire & Explosion P.A.S.S. Technique",
      titleHi: "2. अग्नि और विस्फोट P.A.S.S. तकनीक",
      titleSat: "᱒. ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱽ P.A.S.S. ᱱᱤᱭᱚᱢ",
      descEn: "1. Pull Safety Pin -> 2. Aim at base of fire -> 3. Squeeze lever -> 4. Sweep side to side. Follow AR green arrows to safety chamber.",
      descHi: "1. सुरक्षा पिन खींचें -> 2. आग के आधार पर निशाना साधें -> 3. ट्रिगर दबाएं -> 4. दाएं-बाएं घुमाएं।",
      descSat: "᱑. ᱯᱤᱱ ᱚᱨ ᱢᱮ -> ᱒. ᱥᱮᱸᱜᱮᱞ ᱵᱩᱴᱟᱹ ᱥᱮᱫ ᱥᱟᱵᱽ ᱢᱮ -> ᱓. ᱴᱨᱤᱜᱚᱨ ᱞᱤᱱ ᱢᱮ -> ᱔. ᱟᱹᱪᱩᱨ ᱢᱮ।"
    },
    {
      icon: Wind,
      titleEn: "3. Toxic Gas Leak & SCBA Protocol",
      titleHi: "3. ज़हरीली गैस रिसाव एवं SCBA मास्क",
      titleSat: "᱓. ᱵᱤᱥᱟᱹᱠᱛᱚ ᱜᱮᱥ ᱟᱨ SCBA ᱢᱟᱥᱠ",
      descEn: "Detect invisible Methane (CH4) gas clouds in coal shaft ceilings. Equip SCBA oxygen mask and initiate 3-tug buddy rescue line.",
      descHi: "मीथेन (CH4) गैस की पहचान करें। SCBA ऑक्सीजन मास्क पहनें और साथी कार्यकर्ता के साथ सुरक्षा रस्सी बांधें।",
      descSat: "ᱢᱤᱛᱷᱮᱱ ᱜᱮᱥ (CH4) ᱡᱟᱸᱪ ᱢᱮ। SCBA ᱚᱠᱥᱤᱡᱚᱱ ᱢᱟᱥᱠ ᱦᱚᱨᱚᱜ ᱢᱮ ᱟᱨ ᱜᱟᱛᱮ ᱥᱟᱶ ᱵᱟᱵᱮᱨ ᱛᱚᱞ ᱢᱮ।"
    },
    {
      icon: Volume2,
      titleEn: "4. Multi-Lingual Audio Narration (Santali & Hindi)",
      titleHi: "4. बहुभाषी आवाज सहायता (संथाली और हिंदी)",
      titleSat: "᱔. ᱥᱟᱱᱛᱟᱲᱤ ᱟᱨ ᱦᱤᱱᱫᱤ ᱟᱲᱟᱝ (Voice Guide)",
      descEn: "Designed for recruits with low literacy. Tap the speaker icon to hear step-by-step spoken instructions in Santali (Ol Chiki) or Hindi.",
      descHi: "कम साक्षरता वाले श्रमिकों के लिए आवाज निर्देश सुविधा उपलब्ध है। संथाली या हिंदी में निर्देश सुनने के लिए स्पीकर बटन दबाएं।",
      descSat: "ᱚᱞ-ᱯᱟᱲᱦᱟᱣ ᱵᱟᱝ ᱵᱟᱲᱟᱭ ᱠᱟᱹᱢᱤᱭᱟᱹ ᱞᱟᱹᱜᱤᱫ ᱥᱟᱱᱛᱟᱲᱤ ᱟᱨ ᱦᱤᱱᱫᱤ ᱟᱲᱟᱝ ᱥᱩᱵᱤᱫᱷᱟ ᱢᱮᱱᱟᱜ-ᱟ।"
    }
  ];

  const exportHandbookPDF = async () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 297, 'F');

      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(1.5);
      doc.rect(6, 6, 198, 285);

      doc.setTextColor(245, 158, 11);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("DGMS WORKER SAFETY ORIENTATION HANDBOOK", 105, 18, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240);
      doc.text("Jharkhand Mining & Manufacturing Vocational Safety Protocol", 105, 25, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Factories Act 1948 & Mines Act 1952 Aligned Standards", 105, 31, { align: 'center' });

      let yPos = 42;
      steps.forEach(step => {
        doc.setFillColor(30, 41, 59);
        doc.rect(12, yPos, 186, 50, 'F');

        doc.setFontSize(11);
        doc.setTextColor(245, 158, 11);
        doc.text(step.titleEn, 16, yPos + 8);

        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(`Hindi: ${step.titleHi}`, 16, yPos + 15);
        doc.text(`Santali: ${step.titleSat}`, 16, yPos + 21);

        doc.setFontSize(8);
        doc.setTextColor(226, 232, 240);
        const splitText = doc.splitTextToSize(step.descEn, 178);
        doc.text(splitText, 16, yPos + 28);

        yPos += 56;
      });

      if (window.Capacitor?.isNativePlatform?.()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        await Filesystem.writeFile({
          path: `DGMS_Safety_Orientation_Handbook.pdf`,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });
        alert("Safety Handbook PDF saved to your Documents folder!");
      } else {
        doc.save("DGMS_Safety_Orientation_Handbook.pdf");
      }
    } catch (err) {
      console.error("Handbook PDF export error:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Worker Orientation & AR Guide</h2>
            <p className="text-xs text-slate-400">Jharkhand Industrial Safety Orientation Protocol</p>
          </div>
        </div>

        <button
          onClick={exportHandbookPDF}
          disabled={downloading}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-lg hover:brightness-110 flex items-center space-x-1.5 shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span>{downloading ? 'Exporting...' : 'Download PDF Handbook'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-slate-800 text-amber-400 rounded-2xl border border-slate-700">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {currentLang === 'hi' ? step.titleHi : currentLang === 'sat' ? step.titleSat : step.titleEn}
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {currentLang === 'hi' ? step.descHi : currentLang === 'sat' ? step.descSat : step.descEn}
              </p>

              <button
                onClick={() => speakInstruction(currentLang === 'hi' ? step.descHi : currentLang === 'sat' ? step.descSat : step.descEn, currentLang)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-[11px] font-semibold flex items-center space-x-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen Audio Guide</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
