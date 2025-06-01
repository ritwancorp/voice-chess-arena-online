
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChessMove } from "./ChessGame";

interface MoveHistoryProps {
  moves: ChessMove[];
}

export const MoveHistory = ({ moves }: MoveHistoryProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Move History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          {moves.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">
              No moves yet
            </p>
          ) : (
            <div className="space-y-2">
              {moves.map((move, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-slate-700/30 rounded text-sm"
                >
                  <div className="text-white">
                    <span className="font-medium">
                      {Math.floor(index / 2) + 1}.
                      {index % 2 === 0 ? "" : ".."}
                    </span>
                    <span className="ml-2">{move.notation}</span>
                  </div>
                  <div className="text-slate-400 text-xs">
                    {formatTime(move.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
