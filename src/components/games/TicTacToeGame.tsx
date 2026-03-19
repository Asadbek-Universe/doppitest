import { FC, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { X, Circle, RotateCcw, Trophy } from "lucide-react";

type Cell = "X" | "O" | null;

interface TicTacToeGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const TicTacToeGame: FC<TicTacToeGameProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [current, setCurrent] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<"X" | "O" | "draw" | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);
  const [saving, setSaving] = useState(false);

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setCurrent("X");
    setWinner(null);
  };

  const checkWinner = (nextBoard: Cell[]): "X" | "O" | "draw" | null => {
    for (const [a, b, c] of winningLines) {
      if (nextBoard[a] && nextBoard[a] === nextBoard[b] && nextBoard[a] === nextBoard[c]) {
        return nextBoard[a];
      }
    }
    if (nextBoard.every((c) => c !== null)) {
      return "draw";
    }
    return null;
  };

  const saveResult = async (result: "win" | "loss" | "draw") => {
    if (!user) return;
    try {
      setSaving(true);
      const score = result === "win" ? 1 : result === "loss" ? -1 : 0;
      await supabase.from("game_scores").insert({
        user_id: user.id,
        game_type: "tic_tac_toe",
        score,
      });
    } catch (e) {
      console.warn("Failed to save tic_tac_toe result", e);
    } finally {
      setSaving(false);
    }
  };

  const handleClick = (index: number) => {
    if (winner || board[index] !== null || current !== "X") return;
    const nextBoard = board.slice();
    nextBoard[index] = "X";
    const maybeWinner = checkWinner(nextBoard);
    setBoard(nextBoard);

    if (maybeWinner) {
      finishGame(nextBoard, maybeWinner);
    } else {
      setCurrent("O");
      // Simple AI: random empty cell
      const empties = nextBoard
        .map((c, i) => (c === null ? i : -1))
        .filter((i) => i >= 0);
      const aiIndex = empties[Math.floor(Math.random() * empties.length)];
      const aiBoard = nextBoard.slice();
      aiBoard[aiIndex] = "O";
      const aiWinner = checkWinner(aiBoard);
      setTimeout(() => {
        setBoard(aiBoard);
        if (aiWinner) {
          finishGame(aiBoard, aiWinner);
        } else {
          setCurrent("X");
        }
      }, 250);
    }
  };

  const finishGame = (finalBoard: Cell[], result: "X" | "O" | "draw") => {
    setWinner(result);
    setGamesPlayed((g) => g + 1);
    if (result === "draw") {
      setDraws((d) => d + 1);
      saveResult("draw");
      toast({ title: "Draw!", description: "Nobody won this round." });
    } else if (result === "X") {
      setWins((w) => w + 1);
      saveResult("win");
      toast({ title: "You win!", description: "Great job, X takes the game." });
    } else {
      setLosses((l) => l + 1);
      saveResult("loss");
      toast({ title: "You lost", description: "O wins this time. Try again!" });
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setBoard(Array(9).fill(null));
      setCurrent("X");
      setWinner(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-card relative">
        <CardContent className="pt-6 pb-4 px-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Gamepad2Icon />
                Tic-Tac-Toe
              </h2>
              <p className="text-xs text-muted-foreground">
                You are X. Beat the computer (O)!
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div className="flex items-center gap-1 justify-end">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <span>{wins} W / {losses} L / {draws} D</span>
              </div>
              <div>{gamesPlayed} games played</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-3">
            {board.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                className="aspect-square rounded-lg bg-background flex items-center justify-center text-4xl font-bold shadow-sm hover:bg-muted transition-colors"
                disabled={!!winner || cell !== null || current !== "X"}
              >
                <AnimatePresence>
                  {cell && (
                    <motion.span
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      {cell === "X" ? (
                        <X className="w-10 h-10 text-primary" />
                      ) : (
                        <Circle className="w-10 h-10 text-emerald-500" />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              {winner ? (
                <span className="font-medium">
                  {winner === "draw"
                    ? "It's a draw."
                    : winner === "X"
                    ? "You won!"
                    : "Computer won."}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Turn:{" "}
                  <span className="font-semibold">
                    {current === "X" ? "You (X)" : "Computer (O)"}
                  </span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetBoard}
                className="gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Restart
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>

          {saving && (
            <p className="text-[10px] text-muted-foreground text-right">
              Saving result…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Gamepad2Icon: FC = () => (
  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
    <svg
      className="h-4 w-4 text-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12h4l2-3h8l2 3h4" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
      <path d="M9 17h6" />
    </svg>
  </div>
);

