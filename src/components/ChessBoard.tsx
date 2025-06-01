import { useState, useEffect } from "react";
import { ChessMove } from "./ChessGame";

interface ChessBoardProps {
  currentPlayer: "white" | "black";
  onMove: (move: ChessMove) => void;
  gameStarted: boolean;
  voiceCommand: boolean;
}

interface ChessPiece {
  type: string;
  color: "white" | "black";
  symbol: string;
}

const initialBoard: (ChessPiece | null)[][] = [
  [
    { type: "rook", color: "black", symbol: "♜" },
    { type: "knight", color: "black", symbol: "♞" },
    { type: "bishop", color: "black", symbol: "♝" },
    { type: "queen", color: "black", symbol: "♛" },
    { type: "king", color: "black", symbol: "♚" },
    { type: "bishop", color: "black", symbol: "♝" },
    { type: "knight", color: "black", symbol: "♞" },
    { type: "rook", color: "black", symbol: "♜" },
  ],
  Array(8).fill(null).map(() => ({ type: "pawn", color: "black", symbol: "♟" })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: "pawn", color: "white", symbol: "♙" })),
  [
    { type: "rook", color: "white", symbol: "♖" },
    { type: "knight", color: "white", symbol: "♘" },
    { type: "bishop", color: "white", symbol: "♗" },
    { type: "queen", color: "white", symbol: "♕" },
    { type: "king", color: "white", symbol: "♔" },
    { type: "bishop", color: "white", symbol: "♗" },
    { type: "knight", color: "white", symbol: "♘" },
    { type: "rook", color: "white", symbol: "♖" },
  ],
];

export const ChessBoard = ({ currentPlayer, onMove, gameStarted, voiceCommand }: ChessBoardProps) => {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([]);

  const getSquareNotation = (row: number, col: number): string => {
    const files = "abcdefgh";
    const ranks = "87654321";
    return files[col] + ranks[row];
  };

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol];
    if (!piece || piece.color !== currentPlayer) return false;

    // Basic validation - in a real chess game, this would be much more complex
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;
    
    const targetPiece = board[toRow][toCol];
    if (targetPiece && targetPiece.color === piece.color) return false;

    return true;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (!gameStarted) return;

    if (selectedSquare) {
      const { row: fromRow, col: fromCol } = selectedSquare;
      
      if (fromRow === row && fromCol === col) {
        // Clicking the same square deselects it
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      if (isValidMove(fromRow, fromCol, row, col)) {
        // Make the move
        const newBoard = board.map(r => [...r]);
        const piece = newBoard[fromRow][fromCol];
        newBoard[row][col] = piece;
        newBoard[fromRow][fromCol] = null;
        
        setBoard(newBoard);
        
        const move: ChessMove = {
          from: getSquareNotation(fromRow, fromCol),
          to: getSquareNotation(row, col),
          piece: piece?.type || "unknown",
          notation: `${getSquareNotation(fromRow, fromCol)}-${getSquareNotation(row, col)}`,
          timestamp: new Date()
        };
        
        onMove(move);
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      // Select a piece
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare({ row, col });
        // In a real chess game, calculate valid moves here
        setValidMoves([]);
      }
    }
  };

  const isSquareSelected = (row: number, col: number): boolean => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  };

  const isValidMoveSquare = (row: number, col: number): boolean => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  const getSquareColor = (row: number, col: number): string => {
    const isDark = (row + col) % 2 === 1;
    const baseColor = isDark ? "bg-amber-800" : "bg-amber-100";
    
    if (isSquareSelected(row, col)) {
      return "bg-blue-500";
    }
    
    if (isValidMoveSquare(row, col)) {
      return isDark ? "bg-green-700" : "bg-green-300";
    }
    
    return baseColor;
  };

  useEffect(() => {
    if (!gameStarted) {
      setBoard(initialBoard);
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [gameStarted]);

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-8 gap-0 border-4 border-amber-600 rounded-lg overflow-hidden shadow-2xl">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-14 h-14 md:w-20 md:h-20 flex items-center justify-center cursor-pointer relative
                transition-all duration-200 hover:brightness-110 hover:scale-105
                ${getSquareColor(rowIndex, colIndex)}
                ${voiceCommand ? "ring-2 ring-green-400 ring-opacity-50" : ""}
              `}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              {piece && (
                <div className="relative transform transition-transform duration-200 hover:scale-110">
                  <span className={`
                    text-4xl md:text-6xl select-none font-bold
                    ${piece.color === "white" 
                      ? "text-gray-100 drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] filter brightness-110" 
                      : "text-gray-900 drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)] filter brightness-90"
                    }
                    hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]
                  `}>
                    {piece.symbol}
                  </span>
                  <div className={`
                    absolute inset-0 rounded-full transition-opacity duration-200
                    ${isSquareSelected(rowIndex, colIndex) ? 'bg-blue-400 opacity-20' : 'opacity-0'}
                  `} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
