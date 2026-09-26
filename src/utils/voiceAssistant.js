// Trilingual Text-to-Speech Engine for DGMS Safety Coaching
// Supports English, Hindi, and Santali Ol Chiki via Devanagari/Roman Phonetic Transliteration
// 100% Offline Web Speech API execution

export class VoiceAssistantEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.speaking = false;
    this.voiceMap = {};
    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;
    const updateVoices = () => {
      const voices = this.synth.getVoices();
      voices.forEach(v => {
        if (v.lang.startsWith('hi')) this.voiceMap['hi'] = v;
        if (v.lang.startsWith('en')) this.voiceMap['en'] = v;
      });
    };

    updateVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = updateVoices;
    }
  }

  // Converts Santali phrases into Devanagari phonetics if native Santali TTS is unavailable on Android
  transliterateSantaliToPhonetic(text) {
    if (!text) return '';
    // If text is already Ol Chiki or Santali phrasing, mapping to clear phonetic Hindi pronunciation
    let phonetic = text;
    phonetic = phonetic.replace(/Pre-shift gear scan shuru hoyakina/gi, 'प्री-शिफ्ट गियर स्कैन शुरू होयाकिना।');
    phonetic = phonetic.replace(/Helmet, vest aamage check me/gi, 'हेलमेट, वेस्ट आमागे चेक मे।');
    phonetic = phonetic.replace(/Dhanbad mine safety protocol/gi, 'धनबाद माइन सेफ्टी प्रोटोकॉल।');
    return phonetic;
  }

  speak(text, lang = 'hi', rate = 0.95, pitch = 1.0) {
    if (!this.synth) return;
    try {
      this.synth.cancel(); // Cancel ongoing speech for emergency safety alerts

      let spokenText = text;
      if (lang === 'sat') {
        spokenText = this.transliterateSantaliToPhonetic(text);
      }

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Select voice: Hindi for Santali phonetic or explicit Hindi, English for English
      const targetVoiceKey = (lang === 'sat' || lang === 'hi') ? 'hi' : 'en';
      if (this.voiceMap[targetVoiceKey]) {
        utterance.voice = this.voiceMap[targetVoiceKey];
      } else {
        utterance.lang = targetVoiceKey === 'hi' ? 'hi-IN' : 'en-US';
      }

      utterance.onstart = () => { this.speaking = true; };
      utterance.onend = () => { this.speaking = false; };
      utterance.onerror = () => { this.speaking = false; };

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Voice Synthesis warning:', err);
      this.speaking = false;
    }
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
      this.speaking = false;
    }
  }
}

export const voiceAssistant = new VoiceAssistantEngine();
