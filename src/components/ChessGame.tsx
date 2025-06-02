
import { useState, useEffect } from "react";
import { Chess } from 'chess.js';
import { ChessBoard } from "./ChessBoard";
import { VoiceControls } from "./VoiceControls";
import { GameModeSelector } from "./GameModeSelector";
import { MoveHistory } from "./MoveHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export type GameMode = "player" | "engine";
export type Difficulty = "easy" | "medium" | "hard";

export interface ChessMove {
  from: string;
  to: string;
  piece: string;
  notation: string;
  timestamp: Date;
}

export const ChessGame = () => {
  const [gameMode, setGameMode] = useState<GameMode>("player");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isListening, setIsListening] = useState(false);
  const [moveHistory, setMoveHistory] = useState<ChessMove[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<"white" | "black">("white");
  const [gameStarted, setGameStarted] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string>("");
  const [engineMove, setEngineMove] = useState<string>("");
  const [chess] = useState(new Chess());
  const [boardKey, setBoardKey] = useState(0); // Add key to force board reset
  const { toast } = useToast();

  const handleVoiceMove = (move: string) => {
    console.log("Voice move detected:", move);
    setLastVoiceCommand(move);
    toast({
      title: "Voice Command",
      description: `Heard: "${move}"`,
    });
  };

  const handleMove = (move: ChessMove) => {
    setMoveHistory(prev => [...prev, move]);
    setCurrentPlayer(prev => prev === "white" ? "black" : "white");
    
    // If playing against engine and it's now engine's turn (black)
    if (gameMode === "engine" && currentPlayer === "white") {
      setTimeout(() => {
        makeEngineMove();
      }, 1000);
    }
  };

  const makeEngineMove = () => {
    const possibleMoves = chess.moves();
    
    if (possibleMoves.length === 0) {
      toast({
        title: "Game Over",
        description: "No more moves available",
      });
      return;
    }
    
    // Simple random move selection based on difficulty
    let selectedMove: string;
    
    if (difficulty === "easy") {
      // Random move
      selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    } else if (difficulty === "medium") {
      // Prefer captures and center control
      const captures = possibleMoves.filter(move => move.includes('x'));
      const centerMoves = possibleMoves.filter(move => 
        move.includes('e4') || move.includes('e5') || move.includes('d4') || move.includes('d5')
      );
      
      if (captures.length > 0 && Math.random() > 0.5) {
        selectedMove = captures[Math.floor(Math.random() * captures.length)];
      } else if (centerMoves.length > 0 && Math.random() > 0.3) {
        selectedMove = centerMoves[Math.floor(Math.random() * centerMoves.length)];
      } else {
        selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      }
    } else {
      // Hard: prefer checks, captures, and development
      const checks = possibleMoves.filter(move => move.includes('+'));
      const captures = possibleMoves.filter(move => move.includes('x'));
      const development = possibleMoves.filter(move => 
        move.startsWith('N') || move.startsWith('B') || move.includes('O-O')
      );
      
      if (checks.length > 0) {
        selectedMove = checks[Math.floor(Math.random() * checks.length)];
      } else if (captures.length > 0 && Math.random() > 0.3) {
        selectedMove = captures[Math.floor(Math.random() * captures.length)];
      } else if (development.length > 0 && Math.random() > 0.4) {
        selectedMove = development[Math.floor(Math.random() * development.length)];
      } else {
        selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      }
    }
    
    console.log("Engine attempting move:", selectedMove, "from available moves:", possibleMoves);
    setEngineMove(selectedMove);
    
    toast({
      title: "Engine Move",
      description: `Engine played: ${selectedMove}`,
    });
  };

  const startNewGame = () => {
    chess.reset();
    setMoveHistory([]);
    setCurrentPlayer("white");
    setGameStarted(true);
    setEngineMove("");
    setLastVoiceCommand("");
    setBoardKey(prev => prev + 1); // Force board component to reset
    toast({
      title: "New Game",
      description: `Started ${gameMode} game${gameMode === "engine" ? ` on ${difficulty} difficulty` : ""}`,
    });
  };

  // Reset engine move after it's been processed
  useEffect(() => {
    if (engineMove) {
      const timer = setTimeout(() => setEngineMove(""), 100);
      return () => clearTimeout(timer);
    }
  }, [engineMove]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <GameModeSelector
            gameMode={gameMode}
            difficulty={difficulty}
            onGameModeChange={setGameMode}
            onDifficultyChange={setDifficulty}
            onStartGame={startNewGame}
          />
          
          <VoiceControls
            isListening={isListening}
            onToggleListening={setIsListening}
            onVoiceMove={handleVoiceMove}
          />
          
          <MoveHistory moves={moveHistory} />
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-center">
                {gameStarted ? (
                  <>
                    {currentPlayer === "white" ? "White" : "Black"} to move
                    {gameMode === "engine" && (
                      <span className="text-sm text-slate-300 block">
                        vs Engine ({difficulty})
                      </span>
                    )}
                  </>
                ) : (
                  "Select game mode and start playing"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChessBoard
                key={boardKey}
                currentPlayer={currentPlayer}
                onMove={handleMove}
                gameStarted={gameStarted}
                voiceCommand={isListening}
                lastVoiceCommand={lastVoiceCommand}
                engineMove={engineMove}
                chessInstance={chess}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
