import { useState, useEffect } from "react";
import { ChessMove } from "./ChessGame";

interface ChessBoardProps {
  currentPlayer: "white" | "black";
  onMove: (move: ChessMove) => void;
  gameStarted: boolean;
  voiceCommand: boolean;
  lastVoiceCommand?: string;
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

export const ChessBoard = ({ currentPlayer, onMove, gameStarted, voiceCommand, lastVoiceCommand }: ChessBoardProps) => {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([]);

  const getSquareNotation = (row: number, col: number): string => {
    const files = "abcdefgh";
    const ranks = "87654321";
    return files[col] + ranks[row];
  };

  const parseSquareNotation = (notation: string): { row: number; col: number } | null => {
    if (notation.length !== 2) return null;
    const files = "abcdefgh";
    const ranks = "87654321";
    const col = files.indexOf(notation[0]);
    const row = ranks.indexOf(notation[1]);
    if (col === -1 || row === -1) return { row: -1, col: -1 };
    return { row, col };
  };

  const isPathClear = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const rowStep = toRow === fromRow ? 0 : (toRow > fromRow ? 1 : -1);
    const colStep = toCol === fromCol ? 0 : (toCol > fromCol ? 1 : -1);

    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;

    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }

    return true;
  };

  const isValidPawnMove = (fromRow: number, fromCol: number, toRow: number, toCol: number, piece: ChessPiece): boolean => {
    const direction = piece.color === "white" ? -1 : 1;
    const startRow = piece.color === "white" ? 6 : 1;
    const targetPiece = board[toRow][toCol];

    // Moving forward
    if (fromCol === toCol) {
      // One square forward
      if (toRow === fromRow + direction && !targetPiece) return true;
      // Two squares forward from starting position
      if (fromRow === startRow && toRow === fromRow + 2 * direction && !targetPiece && !board[fromRow + direction][fromCol]) return true;
    }
    // Diagonal capture
    else if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction && targetPiece && targetPiece.color !== piece.color) {
      return true;
    }

    return false;
  };

  const isValidRookMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    // Rook moves horizontally or vertically only
    if (fromRow !== toRow && fromCol !== toCol) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
  };

  const isValidBishopMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    // Bishop moves diagonally only
    if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
  };

  const isValidKnightMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    // Knight moves in L-shape: 2+1 or 1+2
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  };

  const isValidQueenMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    // Queen moves like rook or bishop
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || isValidBishopMove(fromRow, fromCol, toRow, toCol);
  };

  const isValidKingMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    // King moves one square in any direction
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0);
  };

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    // Basic validation
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;
    if (fromRow === toRow && fromCol === toCol) return false;

    const piece = board[fromRow][fromCol];
    if (!piece) return false;
    
    // Can only move your own pieces
    if (piece.color !== currentPlayer) return false;

    const targetPiece = board[toRow][toCol];
    // Cannot capture your own pieces
    if (targetPiece && targetPiece.color === piece.color) return false;

    // Piece-specific movement validation
    switch (piece.type) {
      case "pawn":
        return isValidPawnMove(fromRow, fromCol, toRow, toCol, piece);
      case "rook":
        return isValidRookMove(fromRow, fromCol, toRow, toCol);
      case "bishop":
        return isValidBishopMove(fromRow, fromCol, toRow, toCol);
      case "knight":
        return isValidKnightMove(fromRow, fromCol, toRow, toCol);
      case "queen":
        return isValidQueenMove(fromRow, fromCol, toRow, toCol);
      case "king":
        return isValidKingMove(fromRow, fromCol, toRow, toCol);
      default:
        return false;
    }
  };

  const calculateValidMoves = (row: number, col: number): { row: number; col: number }[] => {
    const moves: { row: number; col: number }[] = [];
    
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (isValidMove(row, col, toRow, toCol)) {
          moves.push({ row: toRow, col: toCol });
        }
      }
    }
    
    return moves;
  };

  const processVoiceCommand = (command: string) => {
    if (!gameStarted) return;

    const trimmedCommand = command.toLowerCase().trim();
    
    let fromSquare: string | null = null;
    let toSquare: string | null = null;

    // Simple move like "e4"
    if (/^[a-h][1-8]$/.test(trimmedCommand)) {
      toSquare = trimmedCommand;
      // Find a piece that can move to this square
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece && piece.color === currentPlayer) {
            const toPos = parseSquareNotation(toSquare);
            if (toPos && isValidMove(row, col, toPos.row, toPos.col)) {
              fromSquare = getSquareNotation(row, col);
              break;
            }
          }
        }
        if (fromSquare) break;
      }
    }
    // Move from-to format like "e2 to e4" or "e2 e4"
    else {
      const matches = trimmedCommand.match(/([a-h][1-8]).*?([a-h][1-8])/);
      if (matches) {
        fromSquare = matches[1];
        toSquare = matches[2];
      }
    }

    if (fromSquare && toSquare) {
      const fromPos = parseSquareNotation(fromSquare);
      const toPos = parseSquareNotation(toSquare);
      
      if (fromPos && toPos && isValidMove(fromPos.row, fromPos.col, toPos.row, toPos.col)) {
        executeMove(fromPos.row, fromPos.col, toPos.row, toPos.col);
      }
    }
  };

  const executeMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const newBoard = board.map(r => [...r]);
    const piece = newBoard[fromRow][fromCol];
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
    setBoard(newBoard);
    
    const move: ChessMove = {
      from: getSquareNotation(fromRow, fromCol),
      to: getSquareNotation(toRow, toCol),
      piece: piece?.type || "unknown",
      notation: `${getSquareNotation(fromRow, fromCol)}-${getSquareNotation(toRow, toCol)}`,
      timestamp: new Date()
    };
    
    onMove(move);
    setSelectedSquare(null);
    setValidMoves([]);
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
        executeMove(fromRow, fromCol, row, col);
      } else {
        // If invalid move, try to select the clicked piece instead
        const piece = board[row][col];
        if (piece && piece.color === currentPlayer) {
          setSelectedSquare({ row, col });
          setValidMoves(calculateValidMoves(row, col));
        } else {
          // Clear selection if clicking on invalid square
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // Select a piece
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare({ row, col });
        setValidMoves(calculateValidMoves(row, col));
      }
    }
  };

  useEffect(() => {
    if (lastVoiceCommand && gameStarted) {
      processVoiceCommand(lastVoiceCommand);
    }
  }, [lastVoiceCommand, gameStarted, board]);

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
