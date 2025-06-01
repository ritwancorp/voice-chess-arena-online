
import { useState, useEffect } from "react";
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
  const { toast } = useToast();

  const handleVoiceMove = (move: string) => {
    console.log("Voice move detected:", move);
    // This will be handled by the chess board component
    toast({
      title: "Voice Command",
      description: `Heard: "${move}"`,
    });
  };

  const handleMove = (move: ChessMove) => {
    setMoveHistory(prev => [...prev, move]);
    setCurrentPlayer(prev => prev === "white" ? "black" : "white");
    
    // If playing against engine and it's engine's turn
    if (gameMode === "engine" && currentPlayer === "white") {
      // Simulate engine move after a delay
      setTimeout(() => {
        makeEngineMove();
      }, 1000);
    }
  };

  const makeEngineMove = () => {
    // Simplified engine move simulation
    const engineMoves = ["e7-e5", "b8-c6", "g8-f6", "f8-c5"];
    const randomMove = engineMoves[Math.floor(Math.random() * engineMoves.length)];
    
    const engineMove: ChessMove = {
      from: randomMove.split("-")[0],
      to: randomMove.split("-")[1],
      piece: "pawn",
      notation: randomMove,
      timestamp: new Date()
    };
    
    setMoveHistory(prev => [...prev, engineMove]);
    setCurrentPlayer("white");
    
    toast({
      title: "Engine Move",
      description: `Engine played: ${randomMove}`,
    });
  };

  const startNewGame = () => {
    setMoveHistory([]);
    setCurrentPlayer("white");
    setGameStarted(true);
    toast({
      title: "New Game",
      description: `Started ${gameMode} game${gameMode === "engine" ? ` on ${difficulty} difficulty` : ""}`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Settings */}
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

        {/* Chess Board */}
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
                currentPlayer={currentPlayer}
                onMove={handleMove}
                gameStarted={gameStarted}
                voiceCommand={isListening}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
