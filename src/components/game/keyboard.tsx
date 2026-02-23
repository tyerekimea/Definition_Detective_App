"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const keys = ["QWERTYUIOP".split(""), "ASDFGHJKL".split(""), "ZXCVBNM".split("")];

type GuessOutcome = "correct" | "incorrect" | null;

interface KeyboardProps {
  onKeyClick: (key: string) => void;
  guessedLetters: {
    correct: string[];
    incorrect: string[];
  };
  revealedByHint: string[];
  lastInteractedLetter?: string | null;
  lastGuessOutcome?: GuessOutcome;
}

export function Keyboard({
  onKeyClick,
  guessedLetters,
  revealedByHint,
  lastInteractedLetter = null,
  lastGuessOutcome = null,
}: KeyboardProps) {
  return (
    <div className="flex w-full flex-col items-center gap-2 md:gap-3">
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} className="flex w-full justify-center gap-1 md:gap-2">
          {row.map((key) => {
            const lowerKey = key.toLowerCase();
            const isCorrect = guessedLetters.correct.includes(lowerKey);
            const isIncorrect = guessedLetters.incorrect.includes(lowerKey);
            const isHinted = revealedByHint.includes(lowerKey);
            const isDisabled = isCorrect || isIncorrect || isHinted;
            const isLatestPress = lastInteractedLetter?.toLowerCase() === lowerKey;

            const statusLabel = isCorrect
              ? "correct"
              : isIncorrect
              ? "not in word"
              : isHinted
              ? "revealed by hint"
              : "unused";

            const statusGlyph = isCorrect ? "check" : isIncorrect ? "x" : isHinted ? "dot" : null;

            return (
              <Button
                key={key}
                onClick={() => onKeyClick(key)}
                disabled={isDisabled}
                variant="outline"
                aria-label={`Letter ${key}, ${statusLabel}`}
                className={cn(
                  "relative h-10 w-8 p-0 text-base font-bold uppercase sm:w-9 md:h-12 md:w-12 md:text-lg",
                  "transition-transform duration-200 ease-out",
                  isCorrect &&
                    "border-[hsl(var(--correct))] bg-[hsl(var(--correct))/0.2] text-foreground hover:bg-[hsl(var(--correct))/0.25]",
                  isIncorrect &&
                    "border-[hsl(var(--wrong))] bg-[hsl(var(--wrong))/0.2] text-foreground line-through opacity-55 hover:bg-[hsl(var(--wrong))/0.2]",
                  isHinted &&
                    "border-primary/20 bg-primary/10 text-foreground/70 opacity-70 hover:bg-primary/10",
                  isLatestPress && lastGuessOutcome === "incorrect" && "animate-shake",
                  isLatestPress && lastGuessOutcome === "correct" && "animate-slot-pop"
                )}
              >
                <span>{key}</span>
                {statusGlyph && (
                  <span className="absolute -bottom-1 text-[9px] font-semibold leading-none tracking-wide text-foreground/70 md:text-[10px]">
                    {statusGlyph}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
