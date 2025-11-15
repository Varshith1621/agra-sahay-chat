import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language: string;
}

export default function VoiceInput({ onTranscript, language }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognitionAPI();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;

    const langMap: Record<string, string> = {
      en: "en-IN",
      hi: "hi-IN",
      kn: "kn-IN",
      te: "te-IN",
      ta: "ta-IN",
    };
    recognitionInstance.lang = langMap[language] || "en-IN";

    recognitionInstance.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      toast.error("Voice input error. Please try again.");
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.abort();
    };
  }, [language, onTranscript]);

  const toggleListening = () => {
    if (!recognition) {
      toast.error("Voice input not supported in this browser");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
      toast.info("Listening...");
    }
  };

  if (!recognition) {
    return null;
  }

  return (
    <Button
      type="button"
      size="icon"
      variant={isListening ? "default" : "ghost"}
      onClick={toggleListening}
      className="shrink-0"
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}