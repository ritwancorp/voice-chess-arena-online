
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";

interface VoiceControlsProps {
  isListening: boolean;
  onToggleListening: (listening: boolean) => void;
  onVoiceMove: (move: string) => void;
}

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceControls = ({ isListening, onToggleListening, onVoiceMove }: VoiceControlsProps) => {
  const [recognition, setRecognition] = useState<any>(null);
  const [lastCommand, setLastCommand] = useState<string>("");

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        setLastCommand(command);
        onVoiceMove(command);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      setRecognition(recognitionInstance);
    }
  }, [onVoiceMove]);

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      onToggleListening(false);
    } else {
      recognition.start();
      onToggleListening(true);
    }
  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {isListening ? <Mic className="w-5 h-5 text-green-400" /> : <MicOff className="w-5 h-5" />}
          Voice Commands
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={toggleListening}
          className={`w-full ${
            isListening 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-green-600 hover:bg-green-700"
          } text-white`}
        >
          {isListening ? "Stop Listening" : "Start Voice Commands"}
        </Button>

        {lastCommand && (
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <p className="text-slate-300 text-sm">Last command:</p>
            <p className="text-white font-medium">"{lastCommand}"</p>
          </div>
        )}

        <div className="text-slate-400 text-xs space-y-1">
          <p className="font-medium text-slate-300">Example commands:</p>
          <p>• "e4" or "e2 to e4"</p>
          <p>• "knight c3"</p>
          <p>• "bishop takes f7"</p>
          <p>• "castle kingside"</p>
        </div>
      </CardContent>
    </Card>
  );
};
