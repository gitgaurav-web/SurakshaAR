// Trilingual Text-to-Speech Engine for DGMS Safety Coaching
// Works 100% offline using Web Speech Synthesis API

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

  speak(text, lang = 'hi', rate = 0.95, pitch = 1.0) {
    if (!this.synth) return;
    this.synth.cancel(); // Cancel any ongoing speech for immediate safety alert priority

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Default to Hindi or English, fallback for Santali
    const targetLang = lang === 'sat' ? 'hi' : lang;
    if (this.voiceMap[targetLang]) {
      utterance.voice = this.voiceMap[targetLang];
    } else {
      utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-US';
    }

    utterance.onstart = () => { this.speaking = true; };
    utterance.onend = () => { this.speaking = false; };
    utterance.onerror = () => { this.speaking = false; };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.speaking = false;
    }
  }
}

export const voiceAssistant = new VoiceAssistantEngine();
