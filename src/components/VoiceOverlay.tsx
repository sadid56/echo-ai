import React, { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "../store/chatStore";

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    item(index: number): {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: (() => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition };
    webkitSpeechRecognition?: { new (): SpeechRecognition };
  }
}

type VoiceState = "LISTENING" | "THINKING" | "SPEAKING" | "MUTED";

interface VoiceOverlayProps {
  onClose: () => void;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({ onClose }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("LISTENING");
  const [transcription, setTranscription] = useState<string>("");
  const [aiResponseText, setAiResponseText] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isComponentMounted = useRef<boolean>(true);

  const { addLog } = useChatStore();

  // Initialize Speech Recognition and Synthesis
  useEffect(() => {
    isComponentMounted.current = true;
    synthRef.current = window.speechSynthesis;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      addLog("Web Speech Recognition is not supported in this browser.");
      alert("Voice input is not supported in this browser environment. Please use Chrome, Safari or Edge.");
      onClose();
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      setTranscription(activeText);

      // If we have a final transcript, stop recognition and send to AI
      if (finalTranscript.trim()) {
        processVoiceInput(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Don't log normal aborts
      if (event.error !== "aborted" && event.error !== "no-speech") {
        addLog(`Voice Recognition Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart listening if we are in LISTENING state and not muted
      if (isComponentMounted.current && voiceState === "LISTENING" && !isMuted) {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          // Already running
        }
      }
    };

    recognitionRef.current = recognition;
    
    // Start listening
    startListening();

    return () => {
      isComponentMounted.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [voiceState, isMuted]);

  const startListening = () => {
    if (isMuted) return;
    setVoiceState("LISTENING");
    setTranscription("");
    setAiResponseText("");
    try {
      recognitionRef.current?.start();
    } catch (e) {
      // Ignored
    }
  };

  const processVoiceInput = async (text: string) => {
    // Stop recognition during thinking and speaking
    recognitionRef.current?.stop();
    setVoiceState("THINKING");
    addLog(`Voice Input: "${text}"`);

    try {
      // Send speech input to the AI Orchestrator via Tauri IPC
      const response = await invoke<string>("send_prompt", { prompt: text });
      
      if (!isComponentMounted.current) return;
      
      setAiResponseText(response);
      speakResponse(response);
    } catch (err) {
      addLog(`Voice Processing Error: ${err}`);
      if (isComponentMounted.current) {
        speakResponse("I encountered an error processing that request. Please try again.");
      }
    }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speaking
    synthRef.current.cancel();

    // Clean up text of markdown markers to speak cleanly
    const cleanedText = text
      .replace(/[\*\#\-\`\_]/g, "") // remove markdown characters
      .replace(/\[.*?\]\(.*?\)/g, "") // remove links
      .trim();

    setVoiceState("SPEAKING");
    addLog(`Voice Response: "${cleanedText}"`);

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;

    // Find a premium native voice if available
    const voices = synthRef.current.getVoices();
    const premiumVoice = voices.find(
      (v) =>
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")) &&
        v.lang.startsWith("en")
    ) || voices.find((v) => v.lang.startsWith("en"));
    
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }

    utterance.onend = () => {
      if (isComponentMounted.current) {
        // Automatically start listening again for next turns
        startListening();
      }
    };

    utterance.onerror = (e) => {
      addLog(`Speech Synthesis Error: ${e.error}`);
      if (isComponentMounted.current) {
        startListening();
      }
    };

    synthRef.current.speak(utterance);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      setVoiceState("MUTED");
      recognitionRef.current?.abort();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-bg-primary/95 backdrop-blur-[20px] z-[1000] flex flex-col items-center justify-center text-text-main animate-fade-in">
      {/* Dynamic Voice Visualizer Orb & Rings */}
      <div className="relative w-80 h-80 flex items-center justify-center mb-12">
        {voiceState === "LISTENING" && (
          <>
            <div className="absolute w-[150px] h-[150px] rounded-full border border-accent-cyan/35 shadow-[0_0_20px_rgba(0,240,255,0.1)] animate-ripple"></div>
            <div className="absolute w-[150px] h-[150px] rounded-full border border-accent-purple/35 shadow-[0_0_20px_rgba(199,125,255,0.1)] animate-ripple" style={{ animationDelay: "0.8s" }}></div>
            <div className="absolute w-[150px] h-[150px] rounded-full border border-accent-blue/35 shadow-[0_0_20px_rgba(59,130,246,0.1)] animate-ripple" style={{ animationDelay: "1.6s" }}></div>
          </>
        )}
        <div
          className={`w-[130px] h-[130px] rounded-full bg-[radial-gradient(circle,var(--color-accent-cyan),var(--color-accent-purple),var(--color-accent-blue))] bg-[length:200%_200%] shadow-[0_0_40px_rgba(0,240,255,0.5),0_0_80px_rgba(199,125,255,0.3)] z-10 transition-all duration-500 ${
            voiceState === "LISTENING"
              ? "animate-orb-breathe"
              : voiceState === "THINKING"
              ? "animate-orb-spin-glow"
              : voiceState === "SPEAKING"
              ? "animate-orb-dance"
              : ""
          }`}
        />
      </div>

      {/* Voice Status Text */}
      <h2 className="font-sans text-3xl font-semibold tracking-wide mb-2 bg-gradient-to-br from-white to-text-muted bg-clip-text text-transparent">
        {voiceState === "LISTENING"
          ? "Listening..."
          : voiceState === "THINKING"
          ? "Thinking..."
          : voiceState === "SPEAKING"
          ? "Echo is speaking"
          : "Muted"}
      </h2>
      
      <p className="font-sans text-sm text-text-muted max-w-sm text-center h-5">
        {voiceState === "LISTENING"
          ? "Start speaking your command..."
          : voiceState === "THINKING"
          ? "Running browser and file tools..."
          : voiceState === "SPEAKING"
          ? "Press mute to silence"
          : "Tap Microphone to resume"}
      </p>

      {/* Real-time speech transcription display */}
      <div className="bg-white/3 border border-border-color px-8 py-5 rounded-xl max-w-xl w-[90%] mt-8 text-center min-h-[80px] flex items-center justify-center backdrop-blur-md">
        {transcription ? (
          <p className="text-lg leading-relaxed text-text-main italic">"{transcription}"</p>
        ) : aiResponseText ? (
          <p className="text-lg leading-relaxed text-text-main/80" style={{ fontStyle: "normal" }}>
            {aiResponseText.length > 120 ? aiResponseText.slice(0, 120) + "..." : aiResponseText}
          </p>
        ) : (
          <p className="text-lg leading-relaxed text-text-muted">Transcription will appear here</p>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-6 mt-12">
        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer border hover:-translate-y-0.5 hover:shadow-lg ${
            isMuted 
              ? "bg-accent-orange/20 border-accent-orange/45 text-accent-orange hover:bg-accent-orange/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]" 
              : "bg-bg-tertiary border-border-color text-text-main hover:bg-white/10"
          }`}
          onClick={toggleMute}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          )}
        </button>

        <button 
          className="w-14 h-14 rounded-full flex items-center justify-center bg-accent-red/20 border border-accent-red/45 text-accent-red hover:bg-accent-red/35 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all cursor-pointer" 
          onClick={onClose} 
          title="Exit Voice Mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};
