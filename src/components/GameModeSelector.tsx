
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GameMode, Difficulty } from "./ChessGame";

interface GameModeSelectorProps {
  gameMode: GameMode;
  difficulty: Difficulty;
  onGameModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStartGame: () => void;
}

export const GameModeSelector = ({
  gameMode,
  difficulty,
  onGameModeChange,
  onDifficultyChange,
  onStartGame
}: GameModeSelectorProps) => {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Game Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-slate-200 text-sm font-medium">Game Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={gameMode === "player" ? "default" : "outline"}
              onClick={() => onGameModeChange("player")}
              className={gameMode === "player" 
                ? "bg-amber-600 hover:bg-amber-700" 
                : "border-slate-600 text-slate-300 hover:bg-slate-700"
              }
            >
              vs Player
            </Button>
            <Button
              variant={gameMode === "engine" ? "default" : "outline"}
              onClick={() => onGameModeChange("engine")}
              className={gameMode === "engine" 
                ? "bg-amber-600 hover:bg-amber-700" 
                : "border-slate-600 text-slate-300 hover:bg-slate-700"
              }
            >
              vs Engine
            </Button>
          </div>
        </div>

        {gameMode === "engine" && (
          <div className="space-y-2">
            <label className="text-slate-200 text-sm font-medium">Difficulty</label>
            <Select value={difficulty} onValueChange={(value: Difficulty) => onDifficultyChange(value)}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="easy" className="text-white hover:bg-slate-700">
                  Easy
                </SelectItem>
                <SelectItem value="medium" className="text-white hover:bg-slate-700">
                  Medium
                </SelectItem>
                <SelectItem value="hard" className="text-white hover:bg-slate-700">
                  Hard
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button 
          onClick={onStartGame}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          Start New Game
        </Button>

        <div className="text-slate-400 text-xs space-y-1">
          <p>• Use voice commands to make moves</p>
          <p>• Click pieces to move manually</p>
          <p>• {gameMode === "engine" ? `Playing against ${difficulty} AI` : "Playing against another player"}</p>
        </div>
      </CardContent>
    </Card>
  );
};
