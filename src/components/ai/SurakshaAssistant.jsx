import React, { useState } from 'react';
import { Bot, Mic, MicOff, Volume2, Sparkles, Send, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { speakInstruction, playAudioBeep } from '../../utils/audioEngine';

export default function SurakshaAssistant({ currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      textEn: "Namaste! I am SurakshaMitra AI Safety Assistant. Ask me any mining safety protocol question in Hindi, Santali, or English.",
      textHi: "नमस्ते! मैं 'सुरक्षा-मित्र' AI सुरक्षा सहायक हूँ। आप मुझसे खदान व संयंत्र सुरक्षा (मीथेन गैस, अग्निशामक P.A.S.S., LOTO) से जुड़ा कोई भी प्रश्न पूछें।",
      textSat: "ᱡᱚᱦᱟᱨ! ᱤᱧ ᱫᱚ 'ᱥᱩᱨᱚᱠᱥᱟ-ᱜᱟᱛᱮ' AI ᱠᱟᱱᱟᱹᱧ। ᱠᱷᱟᱫᱟᱱ ᱨᱩᱠᱷᱤᱭᱟᱹ (Methane gas, Fire Extinguisher) ᱵᱟᱵᱚᱛ ᱠᱩᱠᱞᱤ ᱠᱩᱞᱤᱧ ᱢᱮ।",
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const knowledgeBase = [
    {
      keywords: ['methane', 'gas', 'मीथेन', 'गैस', 'ᱜᱮᱥ'],
      answerEn: "In underground coal mines, if Methane (CH4) gas concentration exceeds 1.25%, DGMS Mines Act mandates immediate high-voltage power cutoff and tunnel evacuation.",
      answerHi: "भूमिगत कोयला खदान में मीथेन (CH4) गैस 1.25% से अधिक होने पर तुरंत सभी बिजली उपकरण बंद करें और सुरक्षित निकास की ओर जाएं।",
      answerSat: "ᱠᱷᱟᱫᱟᱱ ᱵᱷᱤᱛᱨᱤ ᱨᱮ ᱢᱤᱛᱷᱮᱱ ᱜᱮᱥ ᱑.᱒᱕% ᱠᱷᱚᱱ ᱵᱟᱹᱲᱛᱤ ᱞᱮᱠᱷᱟᱱ ᱵᱤᱡᱽᱞᱤ ᱵᱚᱸᱫᱷ ᱠᱟᱛᱮ ᱵᱟᱧᱪᱟᱣ ᱦᱚᱨ ᱥᱮᱫ ᱥᱮᱱᱚᱜ ᱢᱮ।"
    },
    {
      keywords: ['fire', 'extinguisher', 'pass', 'आग', 'अग्निशामक', 'ᱥᱮᱸᱜᱮᱞ'],
      answerEn: "For electrical or methane fires, use DCP Powder extinguisher with P.A.S.S. technique: 1. Pull Pin -> 2. Aim Base -> 3. Squeeze -> 4. Sweep.",
      answerHi: "कोयला धूल या बिजली की आग के लिए DCP पाउडर अग्निशामक का P.A.S.S. विधि से प्रयोग करें: 1. पिन खींचें -> 2. निशाना साधें -> 3. ट्रिगर दबाएं -> 4. बाएं-दाएं घुमाएं।",
      answerSat: "ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱽ ᱞᱟᱹᱜᱤᱫ P.A.S.S. ᱱᱤᱭᱚᱢ ᱯᱟᱸᱡᱟᱭ ᱢᱮ: ᱑. ᱯᱤᱱ ᱚᱨ ᱢᱮ -> ᱒. ᱥᱟᱵᱽ ᱢᱮ -> ᱓. ᱞᱤᱱ ᱢᱮ -> ᱔. ᱟᱹᱪᱩᱨ ᱢᱮ।"
    },
    {
      keywords: ['loto', 'machinery', 'conveyor', 'मशीन', 'बेल्ट', 'ᱢᱮᱥᱤᱱ'],
      answerEn: "Before inspecting moving conveyor belt rollers, apply Lockout/Tagout (LOTO) padlock to circuit breaker and verify stay-clear boundary.",
      answerHi: "कन्वेयर बेल्ट रखरखाव से पहले मुख्य सर्किट ब्रेकर पर LOTO पैडलॉक और डेंजर टैग लगाएं तथा लाल सुरक्षा सीमा का ध्यान रखें।",
      answerSat: "Conveyor belt ᱠᱟᱹᱢᱤ ᱮᱦᱚᱵᱽ ᱢᱟᱲᱟᱝ ᱵᱤᱡᱽᱞᱤ ᱥᱩᱭᱤᱪ ᱨᱮ LOTO ᱛᱟᱞᱟ ᱞᱟᱜᱟᱣ ᱢᱮ ᱟᱨ Danger Tag ᱡᱩᱲᱟᱹᱣ ᱢᱮ।"
    },
    {
      keywords: ['scba', 'mask', 'ppe', 'मास्क', 'ऑक्सीजन', 'ᱢᱟᱥᱠ'],
      answerEn: "In confined shafts with toxic gas fumes, equip SCBA positive-pressure oxygen mask (45-min air tank) and attach safety tug rope to your buddy worker.",
      answerHi: "ज़हरीली गैस वाले स्थानों में SCBA ऑक्सीजन मास्क पहनें और साथी कार्यकर्ता के साथ 3-सिग्नल सुरक्षा रस्सी बांधें।",
      answerSat: "ᱵᱤᱥᱟᱹᱠᱛᱚ ᱜᱮᱥ ᱴᱷᱟᱶ ᱨᱮ SCBA ᱚᱠᱥᱤᱡᱚᱱ ᱢᱟᱥᱠ ᱦᱚᱨᱚᱜ ᱢᱮ ᱟᱨ ᱜᱟᱛᱮ ᱥᱟᱶ ᱵᱟᱵᱮᱨ ᱛᱚᱞ ᱢᱮ।"
    }
  ];

  const handleSend = (textToSend) => {
    const query = (textToSend || inputText).trim().toLowerCase();
    if (!query) return;

    playAudioBeep('pass');

    const userMsg = { sender: 'user', textEn: inputText, textHi: inputText, textSat: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Find matching answer
    let matchedKb = knowledgeBase.find(kb => kb.keywords.some(k => query.includes(k)));
    if (!matchedKb) {
      matchedKb = {
        answerEn: "For emergency assistance under DGMS standards, follow AR evacuation arrows or contact plant safety officer.",
        answerHi: "आपातकालीन स्थिति में AR निकास तीरों का अनुसरण करें या तुरंत खदान सुरक्षा अधिकारी से संपर्क करें।",
        answerSat: "ᱟᱯᱟᱛ ᱚᱠᱛᱚ ᱨᱮ AR ᱪᱤᱱᱦᱟᱹ ᱯᱟᱸᱡᱟ ᱠᱟᱛᱮ ᱵᱟᱧᱪᱟᱣ ᱦᱚᱨ ᱥᱮᱫ ᱥᱮᱱᱚᱜ ᱢᱮ।"
      };
    }

    setTimeout(() => {
      const botMsg = { sender: 'bot', ...matchedKb };
      setMessages(prev => [...prev, botMsg]);
      playAudioBeep('success');

      // Speak answer in current language
      const speechText = currentLang === 'hi' ? matchedKb.answerHi : currentLang === 'sat' ? matchedKb.answerSat : matchedKb.answerEn;
      speakInstruction(speechText, currentLang);
    }, 400);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice speech recognition is active via Web Speech API.");
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'sat' ? 'hi-IN' : 'en-US';
      recognition.start();

      setIsListening(true);
      playAudioBeep('pass');

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } catch (err) {
      setIsListening(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl text-slate-950 font-black shadow-lg">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>SurakshaMitra AI Voice Assistant</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400">DGMS Safety Voice Guidance (Hindi, Santali & English)</p>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => handleSend("Methane gas safety")}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-semibold whitespace-nowrap border border-slate-700"
        >
          💨 Methane Gas Limit
        </button>
        <button
          onClick={() => handleSend("Fire extinguisher PASS drill")}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-300 rounded-xl text-xs font-semibold whitespace-nowrap border border-slate-700"
        >
          🔥 Fire Extinguisher P.A.S.S.
        </button>
        <button
          onClick={() => handleSend("LOTO conveyor safety")}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold whitespace-nowrap border border-slate-700"
        >
          ⚙️ Machinery LOTO
        </button>
      </div>

      {/* Chat Log Window */}
      <div className="h-80 overflow-y-auto p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 no-scrollbar">
        {messages.map((msg, idx) => {
          const isBot = msg.sender === 'bot';
          const text = currentLang === 'hi' ? (msg.answerHi || msg.textHi) : currentLang === 'sat' ? (msg.answerSat || msg.textSat) : (msg.answerEn || msg.textEn);
          return (
            <div key={idx} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                isBot 
                  ? 'bg-slate-900 border border-amber-500/30 text-slate-200' 
                  : 'bg-amber-500 text-slate-950 font-bold'
              }`}>
                <p>{text}</p>
                {isBot && (
                  <button
                    onClick={() => speakInstruction(text, currentLang)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-semibold flex items-center space-x-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Listen Voice</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Bar with Voice Mic */}
      <div className="flex items-center space-x-2 pt-2">
        <button
          onClick={startVoiceInput}
          className={`p-3.5 rounded-2xl text-xs font-bold transition-all ${
            isListening
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md'
          }`}
          title="Voice Search Query"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          placeholder="Ask safety question in Hindi, Santali, or English..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
          className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />

        <button
          onClick={() => handleSend(inputText)}
          className="p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-2xl shadow-md hover:brightness-110"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
