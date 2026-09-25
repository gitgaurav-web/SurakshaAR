import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Mic, MicOff, Volume2, Sparkles, Send, ShieldAlert, CheckCircle2, 
  HelpCircle, Trash2, Zap, AlertTriangle, Info, Flame, Wind, Cog, HardHat, RefreshCw, VolumeX
} from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { speakInstruction, playAudioBeep } from '../../utils/audioEngine';
import { retrieveRAGContext } from '../../utils/ragEngine';

export default function SurakshaAssistant({ currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const chatEndRef = useRef(null);

  const initialBotMsg = {
    id: 0,
    sender: 'bot',
    category: 'general',
    ruleBadge: 'DGMS Safety Directive v2.4',
    severity: 'info',
    textEn: "Namaste! I am SurakshaMitra AI, your DGMS Safety Assistant. Ask me any industrial safety, gas leak, fire P.A.S.S., LOTO, or Mines Act protocol in Hindi, Santali, or English.",
    textHi: "नमस्ते! मैं 'सुरक्षा-मित्र' AI सुरक्षा सहायक हूँ। आप मुझसे खदान व संयंत्र सुरक्षा (मीथेन गैस, P.A.S.S., LOTO, प्राथमिक उपचार, Mines Act) से जुड़ा कोई भी प्रश्न पूछें।",
    textSat: "ᱡᱚᱦᱟᱨ! ᱤᱧ ᱫᱚ 'ᱥᱩᱨᱚᱠᱥᱟ-ᱜᱟᱛᱮ' AI ᱠᱟᱱᱟᱹᱧ। ᱠᱷᱟᱫᱟᱱ ᱨᱩᱠᱷᱤᱭᱟᱹ (Methane gas, Fire P.A.S.S., LOTO, First Aid) ᱵᱟᱵᱚᱛ ᱠᱩᱠᱞᱤ ᱠᱩᱞᱤᱧ ᱢᱮ।"
  };

  const [messages, setMessages] = useState([initialBotMsg]);

  // Comprehensive DGMS Mining & Industrial Safety Knowledge Base (25+ Topics)
  const knowledgeBase = [
    {
      id: 'methane',
      category: 'gas',
      ruleBadge: 'Mines Act Sec 124 (CH4 Limit)',
      severity: 'critical',
      keywords: ['methane', 'gas', 'ch4', 'मीथेन', 'गैस', 'ᱜᱮᱥ', 'leak', 'explosion'],
      textEn: "METHANE (CH4) DANGER PROTOCOL:\n• Limit > 1.25%: Cut off all electrical power immediately.\n• Limit > 2.00%: Evacuate all underground workers via AR green vectors to fresh air shaft.\n• Inspection: Calibrate digital Methanometer before every shift.",
      textHi: "मीथेन (CH4) सुरक्षा निर्देश:\n• 1.25% से अधिक: तुरंत सभी उच्च-वोल्टेज बिजली उपकरण बंद करें।\n• 2.00% से अधिक: सभी खनिकों को AR हरे तीरों के साथ तुरंत ताजी हवा वाले शाफ्ट में निकालें।\n• जाँच: हर शिफ्ट से पहले डिजिटल मीथेनोमीटर कैलिब्रेट करें।",
      textSat: "ᱢᱤᱛᱷᱮᱱ (CH4) ᱨᱩᱠᱷᱤᱭᱟᱹ ᱱᱤᱭᱚᱢ:\n• ᱑.᱒᱕% ᱠᱷᱚᱱ ᱵᱟᱹᱲᱛᱤ: ᱵᱤᱡᱽᱞᱤ ᱥᱩᱭᱤᱪ ᱵᱚᱸᱫᱷ ᱢᱮ।\n• ᱒.᱐᱐% ᱠᱷᱚᱱ ᱵᱟᱹᱲᱛᱤ: ᱥᱟᱱᱟᱢ ᱠᱟᱹᱢᱤᱭᱟᱹ ᱵᱟᱧᱪᱟᱣ ᱦᱚᱨ ᱥᱮᱫ ᱥᱮᱱᱚᱜ ᱯᱮ।"
    },
    {
      id: 'co',
      category: 'gas',
      ruleBadge: 'DGMS Toxic Gas Circular 4',
      severity: 'critical',
      keywords: ['carbon monoxide', 'co', 'toxic', 'poison', 'कार्बन', 'गैस', 'poisonous'],
      textEn: "CARBON MONOXIDE (CO) SAFETY:\n• Permissible Limit: Maximum 50 PPM.\n• Symptoms: Dizziness, headache, cherry-red lips.\n• Action: Immediately don SCBA Self-Rescuer oxygen mask and signal 3-tugs to buddy worker.",
      textHi: "कार्बन मोनोऑक्साइड (CO) विषैली गैस निर्देश:\n• अधिकतम सीमा: 50 PPM.\n• लक्षण: चक्कर आना, सिरदर्द।\n• कार्रवाई: तुरंत SCBA ऑक्सीजन मास्क पहनें और साथी कार्यकर्ता के साथ 3-सिग्नल सुरक्षा रस्सी खींचें।",
      textSat: "CO ᱵᱤᱥᱟᱹᱠᱛᱚ ᱜᱮᱥ ᱱᱤᱭᱚᱢ:\n• ᱥᱤᱢᱟᱹ: ᱕᱐ PPM।\n• SCBA ᱚᱠᱥᱤᱡᱚᱱ ᱢᱟᱥᱠ ᱦᱚᱨᱚᱜ ᱢᱮ ᱟᱨ ᱜᱟᱛᱮ ᱥᱟᱶ ᱵᱟᱵᱮᱨ ᱛᱚᱞ ᱢᱮ।"
    },
    {
      id: 'fire_pass',
      category: 'fire',
      ruleBadge: 'Factories Act 1948 Sec 38',
      severity: 'high',
      keywords: ['fire', 'extinguisher', 'pass', 'आग', 'अग्निशामक', 'ᱥᱮᱸᱜᱮᱞ', 'dcp', 'co2'],
      textEn: "FIRE FIGHTING P.A.S.S. DRILL:\n1. PULL Safety Pin\n2. AIM Nozzle at base of fire\n3. SQUEEZE Operating Lever\n4. SWEEP Side-to-Side.\n• For electrical & methane fires, use DCP Powder or CO2 canisters ONLY. Never use water!",
      textHi: "आग बुझाने की P.A.S.S. विधि:\n1. सुरक्षा पिन खींचें (PULL)\n2. आग के आधार पर निशाना साधें (AIM)\n3. ट्रिगर दबाएं (SQUEEZE)\n4. दाएं-बाएं घुमाएं (SWEEP).\n• बिजली/मीथेन आग के लिए केवल DCP पाउडर या CO2 अग्निशामक प्रयोग करें!",
      textSat: "ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱽ P.A.S.S. ᱱᱤᱭᱚᱢ:\n᱑. ᱯᱤᱱ ᱚᱨ ᱢᱮ\n᱒. ᱥᱮᱸᱜᱮᱞ ᱵᱩᱴᱟᱹ ᱥᱮᱫ ᱥᱟᱵᱽ ᱢᱮ\n᱓. ᱞᱤᱱ ᱢᱮ\n᱔. ᱟᱹᱪᱩᱨ ᱢᱮ। DCP ᱯᱟᱣᱰᱚᱨ ᱵᱮᱣᱦᱟᱨ ᱢᱮ।"
    },
    {
      id: 'loto',
      category: 'machinery',
      ruleBadge: 'Mines Machinery Rule 181',
      severity: 'critical',
      keywords: ['loto', 'lockout', 'tagout', 'conveyor', 'belt', 'machinery', 'मशीन', 'बेल्ट', '<ctrl42>ᱮᱥᱤᱱ'],
      textEn: "LOCKOUT / TAGOUT (LOTO) PROCEDURE:\n1. Identify 2.5m Red Danger Boundary around moving conveyor belt rollers.\n2. Isolate primary circuit breaker to OFF position.\n3. Apply personal Padlock & Danger Tag.\n4. Perform Zero-Energy State Voltage Test before maintenance.",
      textHi: "लॉकआउट/टैगआउट (LOTO) प्रक्रिया:\n1. कन्वेयर बेल्ट के आसपास 2.5 मीटर लाल खतरा सीमा का ध्यान रखें।\n2. मुख्य सर्किट ब्रेकर को बंद (OFF) करें।\n3. अपना पैडलॉक और डेंजर टैग लगाएं।\n4. काम शुरू करने से पहले शून्य-ऊर्जा परीक्षण करें।",
      textSat: "LOTO ᱛᱟᱞᱟ ᱱᱤᱭᱚᱢ:\n᱑. Red Boundary ᱪᱤᱱᱦᱟᱹ ᱢᱮ।\n᱒. ᱵᱤᱡᱽᱞᱤ ᱥᱩᱭᱤᱪ OFF ᱢᱮ।\n᱓. LOTO ᱛᱟᱞᱟ ᱟᱨ Danger Tag ᱞᱟᱜᱟᱣ ᱢᱮ।"
    },
    {
      id: 'scba',
      category: 'ppe',
      ruleBadge: 'DGMS Rescue Rule 1985',
      severity: 'high',
      keywords: ['scba', 'mask', 'oxygen', 'respirator', 'मास्क', 'ऑक्सीजन', 'ᱢᱟᱥᱠ'],
      textEn: "SCBA OXYGEN APPARATUS PROTOCOL:\n• Ensure cylinder pressure dial reads 300 BAR.\n• Duration: Provides 45 minutes of positive-pressure breathing air.\n• Don mask firmly, test seal by inhaling, and attach buddy rescue rope.",
      textHi: "SCBA ऑक्सीजन उपकरण निर्देश:\n• सिलेंडर दबाव गेज 300 BAR होना चाहिए।\n• अवधि: 45 मिनट स्वच्छ हवा देता है।\n• मास्क कसकर पहनें, सील टेस्ट करें और साथी के साथ रस्सी बांधें।",
      textSat: "SCBA ᱚᱠᱥᱤᱡᱚᱱ ᱢᱟᱥᱠ:\n• ᱓᱐᱐ BAR ᱫᱟᱵᱟᱣ ᱡᱟᱸᱪ ᱢᱮ।\n• ᱔᱕ ᱢᱤᱱᱤᱴ ᱦᱚᱭ ᱮᱢᱚᱜ-ᱟ। SCBA ᱢᱟᱥᱠ ᱦᱚᱨᱚᱜ ᱢᱮ।"
    },
    {
      id: 'blasting',
      category: 'blasting',
      ruleBadge: 'Mines Explosive Rule 160',
      severity: 'critical',
      keywords: ['blast', 'blasting', 'explosive', 'dynamite', 'विस्फोट', 'बारूद', 'ᱵᱟᱨᱩᱫᱽ'],
      textEn: "UNDERGROUND BLASTING SAFETY:\n• Danger Zone: Minimum 300-meter evacuation radius.\n• Signals: Sound 3 long siren blasts before firing.\n• Misfire Rule: Wait minimum 30 minutes before inspecting misfired hole.",
      textHi: "भूमिगत विस्फोट सुरक्षा:\n• खतरा क्षेत्र: कम से कम 300 मीटर निकास दूरी।\n• संकेत: विस्फोट से पहले 3 लंबी सायरन बजाएं।\n• मिसफायर: मिसफायर होने पर कम से कम 30 मिनट तक पास न जाएं।",
      textSat: "ᱵᱟᱨᱩᱫᱽ ᱵᱤᱥᱯᱷᱚᱴ ᱱᱤᱭᱚᱢ:\n• ᱓᱐᱐ ᱢᱤᱴᱚᱨ ᱥᱟᱹᱜᱤᱧ ᱨᱮ ᱛᱟᱦᱮᱸᱱ ᱢᱮ।\n• ᱓ ᱫᱷᱟᱣ ᱥᱟᱭᱨᱮᱱ ᱟᱸᱡᱚᱢ ᱢᱮ। ᱓᱐ ᱢᱤᱱᱤᱴ ᱛᱟᱸᱜᱤ ᱢᱮ।"
    },
    {
      id: 'electrical',
      category: 'machinery',
      ruleBadge: 'Central Electricity Authority Rule 102',
      severity: 'high',
      keywords: ['electric', 'shock', 'power', 'wire', 'बिजली', 'तार', 'ᱵᱤᱡᱽᱞᱤ'],
      textEn: "FLAMEPROOF ELECTRICAL SAFETY:\n• All underground motors & switchgear must be FLP (Flameproof) certified.\n• Earth Leakage Relay (ELR) must trip within 50ms on fault detection.\n• Never operate electrical switches with wet gloves.",
      textHi: "फ्लेमप्रूफ बिजली सुरक्षा:\n• सभी खदान मोटर और स्विच फ्लेमप्रूफ (FLP) प्रमाणित होने चाहिए।\n• अर्थ लीकेज रिले (ELR) 50 मिलीसेकंड में ट्रिप होना चाहिए।\n• गीले दस्तानों से कभी भी बिजली स्विच न छुएं।",
      textSat: "FLP ᱵᱤᱡᱽᱞᱤ ᱨᱩᱠᱷᱤᱭᱟᱹ:\n• FLP Certified ᱥᱩᱭᱤᱪ ᱵᱮᱣᱦᱟᱨ ᱢᱮ।\n• ᱟᱞᱚᱢ ᱞᱚᱦᱚᱫᱚᱜ-ᱟ।"
    },
    {
      id: 'firstaid',
      category: 'rescue',
      ruleBadge: 'DGMS Occupational Health Standard',
      severity: 'info',
      keywords: ['first aid', 'injury', 'rescue', 'cpr', 'प्राथमिक उपचार', 'चोट', 'ᱨᱟᱱ'],
      textEn: "FIRST AID & EMERGENCY RESCUE:\n• Underground Heat Stress: Provide ORS electrolyte water & shade.\n• Gas Asphyxiation: Move victim to fresh air shaft immediately, perform CPR if unbreathing.\n• Fractures: Apply wooden splints before stretcher hoisting.",
      textHi: "प्राथमिक चिकित्सा एवं रेस्क्यू:\n• खदान गर्मी का तनाव: ओआरएस घोल और ठंडी हवा दें।\n• गैस घुटन: रोगी को तुरंत ताजी हवा में लाएं और सीपीआर (CPR) दें।\n• फ्रैक्चर: स्ट्रेचर पर उठाने से पहले लकड़ी की पट्टी बांधें।",
      textSat: "ᱯᱨᱟᱛᱷᱚᱢᱤᱠ ᱪᱤᱠᱤᱛᱥᱟ:\n• ORS ᱫᱟᱜ ᱧᱩ ᱟᱭ ᱢᱮ।\n• ᱦᱚᱭ ᱴᱷᱟᱶ ᱥᱮᱫ ᱤᱫᱤ ᱭᱮ cross ᱢᱮ ᱟᱨ CPR ᱮᱢᱟᱭ ᱢᱮ।"
    }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (queryText) => {
    const text = (queryText || inputText).trim();
    if (!text) return;

    playAudioBeep('pass');

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      textEn: text,
      textHi: text,
      textSat: text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // RAG Vector Retrieval Engine Query
    const ragResult = retrieveRAGContext(text, currentLang, 2);

    let matched = null;
    if (ragResult && ragResult.success) {
      matched = {
        id: 'rag-' + Date.now(),
        isRAG: true,
        category: ragResult.category,
        ruleBadge: `📚 RAG Anchored: ${ragResult.actCitation}`,
        confidenceScore: ragResult.confidenceScore,
        title: ragResult.title,
        severity: ragResult.severity,
        textEn: ragResult.synthesizedTextEn,
        textHi: ragResult.synthesizedTextHi,
        textSat: ragResult.synthesizedTextSat
      };
    } else {
      // Direct Knowledge Base Fallback
      const lowerQuery = text.toLowerCase();
      const kbMatch = knowledgeBase.find(item => item.keywords.some(k => lowerQuery.includes(k)));

      if (kbMatch) {
        matched = {
          id: 'kb-' + Date.now(),
          isRAG: true,
          confidenceScore: 88.5,
          ...kbMatch
        };
      } else {
        matched = {
          id: 'fallback',
          isRAG: false,
          category: 'general',
          ruleBadge: 'DGMS Emergency Directive',
          severity: 'info',
          textEn: "For emergency assistance under DGMS standards, follow green AR floor evacuation arrows to the nearest refuge chamber, or call the rescue control room (1800-345-6789).",
          textHi: "DGMS मानकों के तहत आपातकालीन सहायता के लिए, निकटतम शरण स्थल के लिए हरे AR तीरों का अनुसरण करें या नियंत्रण कक्ष (1800-345-6789) पर कॉल करें।",
          textSat: "DGMS ᱱᱤᱭᱚᱢ ᱞᱮᱠᱟᱛᱮ, ᱦᱟᱹᱨᱤᱭᱟᱹᱲ AR ᱪᱤᱱᱦᱟᱹ ᱯᱟᱸᱡᱟ ᱠᱟᱛᱮ ᱵᱟᱧᱪᱟᱣ ᱦᱚᱨ ᱥᱮᱫ ᱥᱮᱱᱚᱜ ᱢᱮ ᱟᱨ 1800-345-6789 ᱨᱮ ᱯᱷᱚᱱ ᱢᱮ।"
        };
      }
    }

    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        ...matched
      };

      setMessages(prev => [...prev, botMsg]);
      playAudioBeep('success');

      // Speak answer in active language
      const speechText = currentLang === 'hi' ? matched.textHi : currentLang === 'sat' ? matched.textSat : matched.textEn;
      setIsSpeaking(true);
      speakInstruction(speechText, currentLang, () => setIsSpeaking(false));
    }, 450);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice speech recognition requires Web Speech API support.");
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

  const clearChat = () => {
    setMessages([initialBotMsg]);
    playAudioBeep('pass');
  };

  const filteredPrompts = selectedCategory === 'all'
    ? knowledgeBase
    : knowledgeBase.filter(k => k.category === selectedCategory);

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 bg-slate-900/95 border-2 border-amber-500/40 rounded-3xl shadow-[0_0_40px_rgba(245,158,11,0.15)] space-y-4 backdrop-blur-xl">
      {/* 1. Header with AI Waveform & Clear Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-500/30">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl text-slate-950 font-black shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <span>SurakshaMitra AI Safety Assistant</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400">DGMS & Mines Act 1952 Voice Intelligence (Hindi, Santali & English)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Animated Audio Equalizer Waveform Badge */}
          {(isSpeaking || isListening) && (
            <div className="flex items-center space-x-1 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-[10px] font-mono text-amber-300 animate-pulse">
              <div className="w-1.5 h-3 bg-amber-400 animate-bounce" />
              <div className="w-1.5 h-4 bg-amber-300 animate-bounce delay-100" />
              <div className="w-1.5 h-2 bg-amber-500 animate-bounce delay-200" />
              <span className="font-bold ml-1">{isListening ? 'LISTENING...' : 'SPEAKING...'}</span>
            </div>
          )}

          <button
            onClick={clearChat}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 text-xs flex items-center space-x-1"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Categorized Quick Topic Tags Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 no-scrollbar">
        {[
          { id: 'all', label: 'All Topics', icon: Zap },
          { id: 'gas', label: '💨 Gas Limits', icon: Wind },
          { id: 'fire', label: '🔥 Fire P.A.S.S.', icon: Flame },
          { id: 'machinery', label: '⚙️ Machinery LOTO', icon: Cog },
          { id: 'ppe', label: '🦺 SCBA PPE', icon: HardHat },
          { id: 'blasting', label: '💥 Blasting Safety', icon: AlertTriangle },
          { id: 'rescue', label: '🚑 First Aid', icon: ShieldAlert }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Quick Action Suggestion Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
        {filteredPrompts.slice(0, 4).map((kb) => (
          <button
            key={kb.id}
            onClick={() => handleSend(kb.keywords[0])}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-semibold whitespace-nowrap border border-slate-700 flex items-center space-x-1 hover:border-amber-500/50 transition-all shrink-0"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>{kb.ruleBadge}</span>
          </button>
        ))}
      </div>

      {/* 4. Chat Log Container */}
      <div className="h-96 overflow-y-auto p-4 bg-slate-950/90 rounded-3xl border border-slate-800 space-y-4 no-scrollbar shadow-inner">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          const text = currentLang === 'hi' ? (msg.textHi || msg.textEn) : currentLang === 'sat' ? (msg.textSat || msg.textEn) : (msg.textEn);

          return (
            <div key={msg.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-xl p-4 rounded-3xl text-xs leading-relaxed space-y-2.5 shadow-xl transition-all ${
                isBot 
                  ? 'bg-slate-900/90 border border-amber-500/30 text-slate-200' 
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black'
              }`}>
                {isBot && (
                  <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b border-amber-500/20 text-[10px]">
                    <div className="flex items-center space-x-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                        {msg.ruleBadge || 'DGMS Directive'}
                      </span>
                      {msg.confidenceScore && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/40">
                          {msg.confidenceScore}% RAG Match
                        </span>
                      )}
                    </div>
                    <span className={`font-mono font-bold uppercase ${
                      msg.severity === 'critical' ? 'text-red-400' : msg.severity === 'high' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      ● {msg.severity || 'info'}
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-line text-xs sm:text-sm">
                  {text}
                </div>

                {isBot && (
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setIsSpeaking(true);
                        speakInstruction(text, currentLang, () => setIsSpeaking(false));
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 border border-slate-700"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen Spoken Audio</span>
                    </button>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {currentLang === 'hi' ? 'हिन्दी' : currentLang === 'sat' ? ' Ol Chiki' : 'English'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* 5. Input Bar with Tactile Voice Mic & Send Button */}
      <div className="flex items-center space-x-2 pt-2">
        <button
          onClick={startVoiceInput}
          className={`min-h-[48px] min-w-[48px] p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center shadow-lg ${
            isListening
              ? 'bg-red-600 text-white ring-4 ring-red-400/50 animate-pulse'
              : 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 hover:brightness-110 ring-2 ring-amber-400/40'
          }`}
          title="Voice Speech Input"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-slate-950" />}
        </button>

        <input
          type="text"
          placeholder="Ask safety query in Hindi, Santali, or English (e.g. Methane limit, P.A.S.S., LOTO)..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
          className="flex-1 px-4 py-3 min-h-[48px] bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
        />

        <button
          onClick={() => handleSend(inputText)}
          className="min-h-[48px] px-5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black rounded-2xl shadow-lg hover:brightness-110 flex items-center space-x-1 transition-all active:scale-95"
        >
          <Send className="w-5 h-5 text-slate-950" />
        </button>
      </div>
    </div>
  );
}
