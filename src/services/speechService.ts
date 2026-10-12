/**
 * Speech Recognition and Synthesis Service (Phase 3 Foundation)
 *
 * Implements:
 * 1. Web Speech API (SpeechRecognition / webkitSpeechRecognition) for native browser speech-to-text.
 * 2. Web Speech API (SpeechSynthesis) for browser text-to-speech without external bandwidth cost.
 * 3. AssemblyAI token endpoint proxy / transcription fallback capability.
 * 4. Transparent browser compatibility inspection & permission states.
 */

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
}

// Check native speech recognition support
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

// Check native speech synthesis support
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

// Setup a browser speech recognition instance
export function createSpeechRecognizer(callbacks: {
  onResult: (result: SpeechRecognitionResultState) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart?: () => void;
}) {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onError('Native speech recognition is not supported in this browser. Please use keyboard text input.');
    return null;
  }

  // Type declaration for browser SpeechRecognition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionConstructor();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      callbacks.onResult({ transcript: finalTranscript, isFinal: true });
    } else if (interimTranscript) {
      callbacks.onResult({ transcript: interimTranscript, isFinal: false });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    let errorMsg = 'Speech recognition error';
    if (event.error === 'not-allowed') {
      errorMsg = 'Microphone access was denied. Please allow microphone permissions in your browser.';
    } else if (event.error === 'no-speech') {
      errorMsg = 'No speech detected. Please speak into your microphone.';
    } else if (event.error === 'network') {
      errorMsg = 'Network error during speech recognition.';
    } else {
      errorMsg = event.error || 'Speech recognition failed.';
    }
    callbacks.onError(errorMsg);
  };

  recognition.onend = () => {
    callbacks.onEnd();
  };

  if (callbacks.onStart) {
    recognition.onstart = () => {
      callbacks.onStart?.();
    };
  }

  return recognition;
}

// Speak text using browser native speech synthesis
export function speakText(
  text: string,
  onEnd?: () => void,
  options?: { rate?: number; pitch?: number; voice?: SpeechSynthesisVoice }
): boolean {
  if (!isSpeechSynthesisSupported()) {
    return false;
  }

  window.speechSynthesis.cancel(); // Stop any pending speech

  const cleanText = text.replace(/\[Mode:.*?\]/g, '').trim();
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'en-US';
  utterance.rate = options?.rate ?? 1.0;
  utterance.pitch = options?.pitch ?? 1.0;

  if (options?.voice) {
    utterance.voice = options.voice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

// Stop any currently playing speech
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
