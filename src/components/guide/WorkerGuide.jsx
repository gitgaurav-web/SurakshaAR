import React from 'react';
import { Flame, Wind, Cog, Award, Volume2, Camera, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { speakInstruction } from '../../utils/audioEngine';

export default function WorkerGuide({ currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Worker Orientation & AR Guide</h2>
            <p className="text-xs text-slate-400">Jharkhand Industrial Safety Orientation Protocol</p>
          </div>
        </div>
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
