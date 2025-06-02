
import { useState, useEffect } from "react";
import { Chess, Square } from 'chess.js';
import { ChessMove } from "./ChessGame";

interface ChessBoardProps {
  currentPlayer: "white" | "black";
  onMove: (move: ChessMove) => void;
  gameStarted: boolean;
  voiceCommand: boolean;
  lastVoiceCommand?: string;
  engineMove?: string;
  chessInstance: Chess;
}

interface ChessPiece {
  type: string;
  color: "white" | "black";
  symbol: string;
}

const pieceSymbols: { [key: string]: { white: string; black: string } } = {
  'p': { white: '♙', black: '♟' },
  'r': { white: '♖', black: '♜' },
  'n': { white: '♘', black: '♞' },
  'b': { white: '♗', black: '♝' },
  'q': { white: '♕', black: '♛' },
  'k': { white: '♔', black: '♚' }
};

export const ChessBoard = ({ currentPlayer, onMove, gameStarted, voiceCommand, lastVoiceCommand, engineMove, chessInstance }: ChessBoardProps) => {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>([]);
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([]);

  const getSquareNotation = (row: number, col: number): Square => {
    const files = "abcdefgh";
    const ranks = "87654321";
    return (files[col] + ranks[row]) as Square;
  };

  const parseSquareNotation = (notation: string): { row: number; col: number } | null => {
    if (notation.length !== 2) return null;
    const files = "abcdefgh";
    const ranks = "87654321";
    const col = files.indexOf(notation[0]);
    const row = ranks.indexOf(notation[1]);
    if (col === -1 || row === -1) return null;
    return { row, col };
  };

  const updateBoardFromChess = () => {
    const newBoard: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = getSquareNotation(row, col);
        const piece = chessInstance.get(square);
        
        if (piece) {
          newBoard[row][col] = {
            type: piece.type === 'p' ? 'pawn' : 
                  piece.type === 'r' ? 'rook' :
                  piece.type === 'n' ? 'knight' :
                  piece.type === 'b' ? 'bishop' :
                  piece.type === 'q' ? 'queen' : 'king',
            color: piece.color === 'w' ? 'white' : 'black',
            symbol: pieceSymbols[piece.type][piece.color === 'w' ? 'white' : 'black']
          };
        }
      }
    }
    
    setBoard(newBoard);
  };

  const calculateValidMoves = (row: number, col: number): { row: number; col: number }[] => {
    const square = getSquareNotation(row, col);
    const moves = chessInstance.moves({ square, verbose: true });
    
    return moves.map(move => {
      const toPos = parseSquareNotation(move.to);
      return toPos!;
    }).filter(pos => pos !== null);
  };

  const processVoiceCommand = (command: string) => {
    if (!gameStarted) return;

    console.log("Processing voice command:", command);
    const trimmedCommand = command.toLowerCase().trim();
    
    try {
      let moveAttempted = false;
      
      // Try simple algebraic notation first (e4, Nf3, etc.)
      if (/^[a-h][1-8]$/.test(trimmedCommand)) {
        // Pawn move
        const possibleMoves = chessInstance.moves({ verbose: true }).filter(move => 
          move.to === trimmedCommand && move.piece === 'p'
        );
        if (possibleMoves.length > 0) {
          const moveResult = chessInstance.move(possibleMoves[0].san);
          if (moveResult) {
            moveAttempted = true;
          }
        }
      }
      
      // Try piece moves (knight c3, bishop f4, etc.)
      else if (trimmedCommand.includes('knight') || trimmedCommand.includes('bishop') || 
               trimmedCommand.includes('rook') || trimmedCommand.includes('queen') || 
               trimmedCommand.includes('king')) {
        const pieceMap: { [key: string]: string } = {
          'knight': 'n', 'bishop': 'b', 'rook': 'r', 'queen': 'q', 'king': 'k'
        };
        
        for (const [name, symbol] of Object.entries(pieceMap)) {
          if (trimmedCommand.includes(name)) {
            const squareMatch = trimmedCommand.match(/[a-h][1-8]/);
            if (squareMatch) {
              const targetSquare = squareMatch[0];
              const possibleMoves = chessInstance.moves({ verbose: true }).filter(move => 
                move.to === targetSquare && move.piece === symbol
              );
              if (possibleMoves.length > 0) {
                const moveResult = chessInstance.move(possibleMoves[0].san);
                if (moveResult) {
                  moveAttempted = true;
                  break;
                }
              }
            }
          }
        }
      }
      
      // Try full notation (e2 to e4, e2-e4, etc.)
      else {
        const matches = trimmedCommand.match(/([a-h][1-8]).*?([a-h][1-8])/);
        if (matches) {
          const from = matches[1] as Square;
          const to = matches[2] as Square;
          try {
            const moveResult = chessInstance.move({ from, to });
            if (moveResult) {
              moveAttempted = true;
            }
          } catch (e) {
            console.log("Invalid move:", from, "to", to);
          }
        }
      }
      
      if (moveAttempted) {
        const history = chessInstance.history({ verbose: true });
        const lastMove = history[history.length - 1];
        
        updateBoardFromChess();
        
        const move: ChessMove = {
          from: lastMove.from,
          to: lastMove.to,
          piece: lastMove.piece,
          notation: lastMove.san,
          timestamp: new Date()
        };
        
        onMove(move);
        setSelectedSquare(null);
        setValidMoves([]);
        console.log("Voice move executed:", move);
      } else {
        console.log("Could not execute voice command:", command);
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
    }
  };

  const executeMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const from = getSquareNotation(fromRow, fromCol);
    const to = getSquareNotation(toRow, toCol);
    
    try {
      const moveResult = chessInstance.move({ from, to });
      
      if (moveResult) {
        updateBoardFromChess();
        
        const move: ChessMove = {
          from: moveResult.from,
          to: moveResult.to,
          piece: moveResult.piece,
          notation: moveResult.san,
          timestamp: new Date()
        };
        
        onMove(move);
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } catch (error) {
      console.error("Invalid move:", error);
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (!gameStarted) return;

    if (selectedSquare) {
      const { row: fromRow, col: fromCol } = selectedSquare;
      
      if (fromRow === row && fromCol === col) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      executeMove(fromRow, fromCol, row, col);
    } else {
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
  }, [lastVoiceCommand, gameStarted]);

  useEffect(() => {
    if (engineMove && gameStarted) {
      console.log("Executing engine move:", engineMove);
      try {
        const moveResult = chessInstance.move(engineMove);
        if (moveResult) {
          updateBoardFromChess();
          
          const move: ChessMove = {
            from: moveResult.from,
            to: moveResult.to,
            piece: moveResult.piece,
            notation: moveResult.san,
            timestamp: new Date()
          };
          
          onMove(move);
          console.log("Engine move executed successfully:", move);
        }
      } catch (error) {
        console.error("Error executing engine move:", error);
      }
    }
  }, [engineMove, gameStarted]);

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
      chessInstance.reset();
    }
    updateBoardFromChess();
  }, [gameStarted]);

  useEffect(() => {
    updateBoardFromChess();
  }, []);

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
                      ? "text-gray-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                      : "text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]"
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
