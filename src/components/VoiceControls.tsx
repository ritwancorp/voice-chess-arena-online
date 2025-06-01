
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceControlsProps {
  isListening: boolean;
  onToggleListening: (listening: boolean) => void;
  onVoiceMove: (move: string) => void;
}

export const VoiceControls = ({ isListening, onToggleListening, onVoiceMove }: VoiceControlsProps) => {
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('Voice recognition started');
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript);
          processChessMove(finalTranscript.trim().toLowerCase());
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Voice Recognition Error",
          description: "Please try again",
          variant: "destructive",
        });
      };
      
      recognition.onend = () => {
        if (isListening) {
          // Restart if we should still be listening
          recognition.start();
        }
      };
      
      recognitionRef.current = recognition;
    }
  }, [isListening, toast]);

  const processChessMove = (transcript: string) => {
    // Parse common chess move patterns
    const movePatterns = [
      // Standard notation like "e4", "Nf3", "Qh5"
      /^([a-h][1-8])$/,
      // Piece moves like "knight f3", "queen h5"
      /^(king|queen|rook|bishop|knight|pawn)?\s*([a-h][1-8])$/,
      // Castling
      /^(castle|castling)\s*(king|queen)?side?$/,
      // Long notation like "e2 to e4"
      /^([a-h][1-8])\s*(?:to|takes?|captures?)\s*([a-h][1-8])$/
    ];

    for (const pattern of movePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        onVoiceMove(transcript);
        setTranscript("");
        break;
      }
    }
  };

  const toggleListening = () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      onToggleListening(false);
    } else {
      recognitionRef.current?.start();
      onToggleListening(true);
    }
  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mic className="w-5 h-5" />
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
          }`}
          disabled={!isSupported}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Start Listening
            </>
          )}
        </Button>

        {!isSupported && (
          <p className="text-red-400 text-sm">
            Voice recognition not supported in this browser
          </p>
        )}

        {transcript && (
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <p className="text-white text-sm">Last heard: "{transcript}"</p>
          </div>
        )}

        <div className="text-slate-300 text-sm space-y-2">
          <p className="font-semibold">Example commands:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>"e4" - Move pawn to e4</li>
            <li>"knight f3" - Move knight to f3</li>
            <li>"queen h5" - Move queen to h5</li>
            <li>"castle kingside" - Castle kingside</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
