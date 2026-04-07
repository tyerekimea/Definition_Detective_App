'use client';

import { useState, useEffect, useCallback, useMemo, useTransition, useRef } from "react";
import Link from "next/link";
import { type WordData, type WordTheme, getRankForScore, wordList } from "@/lib/game-data";
import { generateImageDescription } from "@/ai/flows/generate-image-description-flow";
import { useHintAction as hintAction, generateWordWithTheme, updateUserTheme, getUserTheme } from "@/lib/actions";
import { THEME_FALLBACK_WORDS } from "@/lib/word-utils";
import { ThemeSelector } from "@/components/theme-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Keyboard } from "@/components/game/keyboard";
import {
  Lightbulb,
  RotateCw,
  XCircle,
  Award,
  Crown,
  PartyPopper,
  Share,
  Trophy,
  ArrowRight,
  Loader2,
  CalendarDays,
  Flame,
  Sparkles,
  Target,
  Menu,
  X,
  Music,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameSounds } from "@/hooks/use-game-sounds";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, getDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { UserProfile } from "@/lib/firebase-types";
import ShareButton from "@/components/game/share-button";
import BackgroundMusicControls from "@/components/audio/BackgroundMusicControls";
import { hasPremiumAccess } from "@/lib/subscription";

type GameState = "playing" | "won" | "lost";
type Difficulty = "easy" | "medium" | "hard";
type GameMode = "practice" | "daily";
type GuessOutcome = "correct" | "incorrect" | null;

const MAX_INCORRECT_TRIES = 6;
const DAILY_PROGRESS_STORAGE_KEY = "definition-detective-daily-progress-v1";
const DAILY_STREAK_STORAGE_KEY = "definition-detective-daily-streak-v1";
const ONBOARDING_STORAGE_KEY = "definition-detective-onboarding-v1";

interface DailyProgressSnapshot {
  date: string;
  guessedLetters: {
    correct: string[];
    incorrect: string[];
  };
  revealedByHint: string[];
  hint: string | null;
  visualHint: string | null;
  gameState: GameState;
}

interface DailyStreakSnapshot {
  current: number;
  lastSolvedDate: string | null;
  lastPlayedDate: string | null;
}

const DAILY_WORD_POOL: WordData[] = (() => {
  const combined: WordData[] = [
    ...THEME_FALLBACK_WORDS.current.easy.map((entry) => ({
      word: entry.word,
      definition: entry.definition,
      difficulty: "easy" as const,
      theme: "current" as const,
    })),
    ...THEME_FALLBACK_WORDS.current.medium.map((entry) => ({
      word: entry.word,
      definition: entry.definition,
      difficulty: "medium" as const,
      theme: "current" as const,
    })),
    ...THEME_FALLBACK_WORDS.current.hard.map((entry) => ({
      word: entry.word,
      definition: entry.definition,
      difficulty: "hard" as const,
      theme: "current" as const,
    })),
    ...wordList.map((entry) => ({
      ...entry,
      theme: "current" as const,
    })),
  ];

  const seen = new Set<string>();
  return combined.filter((entry) => {
    const normalized = entry.word.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
})();

const getDailyDateKey = (date: Date = new Date()): string => date.toISOString().slice(0, 10);

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
};

const getDailyWordForDate = (dateKey: string): WordData => {
  const index = hashString(`definition-detective:${dateKey}`) % DAILY_WORD_POOL.length;
  return DAILY_WORD_POOL[index];
};

const dayDiff = (fromDateKey: string, toDateKey: string): number => {
  const from = Date.parse(`${fromDateKey}T00:00:00.000Z`);
  const to = Date.parse(`${toDateKey}T00:00:00.000Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.floor((to - from) / 86400000);
};

const getYesterdayKey = (dateKey: string): string => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return getDailyDateKey(date);
};

const readDailyStreakSnapshot = (): DailyStreakSnapshot => {
  if (typeof window === "undefined") {
    return { current: 0, lastSolvedDate: null, lastPlayedDate: null };
  }

  try {
    const raw = window.localStorage.getItem(DAILY_STREAK_STORAGE_KEY);
    if (!raw) {
      return { current: 0, lastSolvedDate: null, lastPlayedDate: null };
    }

    const parsed = JSON.parse(raw) as DailyStreakSnapshot;
    return {
      current: Number.isFinite(parsed?.current) ? Math.max(0, parsed.current) : 0,
      lastSolvedDate: parsed?.lastSolvedDate ?? null,
      lastPlayedDate: parsed?.lastPlayedDate ?? null,
    };
  } catch {
    return { current: 0, lastSolvedDate: null, lastPlayedDate: null };
  }
};

const writeDailyStreakSnapshot = (snapshot: DailyStreakSnapshot) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAILY_STREAK_STORAGE_KEY, JSON.stringify(snapshot));
};

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const [gameMode, setGameMode] = useState<GameMode>("practice");
  const [gameState, setGameState] = useState<GameState>("playing");
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [guessedLetters, setGuessedLetters] = useState<{ correct: string[]; incorrect: string[] }>({
    correct: [],
    incorrect: [],
  });
  const [hint, setHint] = useState<string | null>(null);
  const [revealedByHint, setRevealedByHint] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isHintLoading, startHintTransition] = useTransition();
  const [visualHint, setVisualHint] = useState<string | null>(null);
  const [isVisualHintLoading, setIsVisualHintLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<WordTheme>("current");
  const [isPremium, setIsPremium] = useState(false);
  const [dailyDateKey, setDailyDateKey] = useState(getDailyDateKey());
  const [dailyStreak, setDailyStreak] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lastInteractedLetter, setLastInteractedLetter] = useState<string | null>(null);
  const [lastGuessOutcome, setLastGuessOutcome] = useState<GuessOutcome>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState<'audio' | 'how-to-play' | 'feedback' | 'share' | null>(null);

  const guessAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedThemeRef = useRef<WordTheme>("current");
  const { playSound } = useGameSounds();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, "userProfiles", user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  const hasUnlimitedHints = hasPremiumAccess(userProfile) || isPremium;
  const hasAdFreeExperience = hasUnlimitedHints;

  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      setScore(userProfile.totalScore);
      setLevel(userProfile.highestLevel);
    }
  }, [userProfile]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeenOnboarding = window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
    setShowOnboarding(!hasSeenOnboarding);
  }, []);

  useEffect(() => {
    selectedThemeRef.current = selectedTheme;
  }, [selectedTheme]);

  useEffect(() => {
    if (!lastGuessOutcome) return;

    if (guessAnimationTimeoutRef.current) {
      clearTimeout(guessAnimationTimeoutRef.current);
    }

    guessAnimationTimeoutRef.current = setTimeout(() => {
      setLastGuessOutcome(null);
      setLastInteractedLetter(null);
    }, 450);

    return () => {
      if (guessAnimationTimeoutRef.current) {
        clearTimeout(guessAnimationTimeoutRef.current);
      }
    };
  }, [lastGuessOutcome]);

  const getDifficultyForLevel = (currentLevel: number): Difficulty => {
    if (currentLevel <= 5) return "easy";
    if (currentLevel <= 10) return "medium";
    return "hard";
  };

  const resetRoundState = useCallback(() => {
    setGameState("playing");
    setGuessedLetters({ correct: [], incorrect: [] });
    setHint(null);
    setRevealedByHint([]);
    setVisualHint(null);
    setLastGuessOutcome(null);
    setLastInteractedLetter(null);
  }, []);

  const startPracticeGame = useCallback(
    async (currentLevel: number, currentWord?: string, themeOverride?: WordTheme) => {
      console.log("[startPracticeGame] Starting practice game at level:", currentLevel);

      if (authLoading && !user) {
        setIsGameLoading(true);
        return;
      }

      setIsGameLoading(true);
      resetRoundState();
      setWordData(null);

      const difficulty = getDifficultyForLevel(currentLevel);
      const themeToUse = themeOverride ?? selectedThemeRef.current;
      let newWordData: WordData | null = null;

      try {
        const result = await generateWordWithTheme({
          difficulty,
          theme: themeToUse,
          userId: user?.uid || null,
          level: currentLevel,
          previousWord: currentWord,
        });

        if (!result.success || !result.word) {
          throw new Error(result.message || "Failed to generate word");
        }

        newWordData = {
          word: result.word,
          definition: result.definition || "",
          difficulty,
          theme: themeToUse,
        };
      } catch (error: any) {
        console.error("[startPracticeGame] Failed to generate word:", error);
        toast({
          variant: "destructive",
          title: "Word Generation Error",
          description: error?.message || "Could not generate a new word. Please check your connection and API key.",
        });
      }

      if (newWordData) {
        setWordData(newWordData);
      }
      setIsGameLoading(false);
    },
    [toast, user, authLoading, resetRoundState]
  );

  const loadDailyChallenge = useCallback(
    (dateKeyOverride?: string) => {
      const dateKey = dateKeyOverride ?? getDailyDateKey();
      const todayWord = getDailyWordForDate(dateKey);

      setIsGameLoading(true);
      setGameMode("daily");
      setDailyDateKey(dateKey);
      resetRoundState();
      setWordData(todayWord);

      const streakSnapshot = readDailyStreakSnapshot();
      if (streakSnapshot.lastPlayedDate && dayDiff(streakSnapshot.lastPlayedDate, dateKey) > 1) {
        streakSnapshot.current = 0;
        writeDailyStreakSnapshot(streakSnapshot);
      }
      setDailyStreak(streakSnapshot.current);

      if (typeof window !== "undefined") {
        try {
          const rawProgress = window.localStorage.getItem(DAILY_PROGRESS_STORAGE_KEY);
          if (rawProgress) {
            const parsed = JSON.parse(rawProgress) as DailyProgressSnapshot;
            if (parsed.date === dateKey) {
              setGuessedLetters(parsed.guessedLetters);
              setRevealedByHint(parsed.revealedByHint ?? []);
              setHint(parsed.hint ?? null);
              setVisualHint(parsed.visualHint ?? null);
              setGameState(parsed.gameState ?? "playing");
            }
          }
        } catch (error) {
          console.warn("[loadDailyChallenge] Could not restore daily progress:", error);
        }
      }

      setIsGameLoading(false);
    },
    [resetRoundState]
  );

  const updateDailyStreak = useCallback((result: "won" | "lost", dateKey: string) => {
    const snapshot = readDailyStreakSnapshot();

    if (result === "won") {
      if (snapshot.lastSolvedDate !== dateKey) {
        const yesterdayKey = getYesterdayKey(dateKey);
        snapshot.current = snapshot.lastSolvedDate === yesterdayKey ? snapshot.current + 1 : 1;
        snapshot.lastSolvedDate = dateKey;
      }
    } else if (snapshot.lastSolvedDate !== dateKey) {
      snapshot.current = 0;
    }

    snapshot.lastPlayedDate = dateKey;
    writeDailyStreakSnapshot(snapshot);
    setDailyStreak(snapshot.current);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      getUserTheme(user.uid).then(({ theme, isPremium: premium }) => {
        setSelectedTheme(theme);
        setIsPremium(premium);
      });
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    startPracticeGame(1);
  }, [startPracticeGame, authLoading]);

  useEffect(() => {
    if (gameMode !== "daily") return;

    const intervalId = setInterval(() => {
      const today = getDailyDateKey();
      if (today !== dailyDateKey) {
        loadDailyChallenge(today);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [gameMode, dailyDateKey, loadDailyChallenge]);

  useEffect(() => {
    if (gameMode !== "daily" || !wordData || typeof window === "undefined") return;

    const snapshot: DailyProgressSnapshot = {
      date: dailyDateKey,
      guessedLetters,
      revealedByHint,
      hint,
      visualHint,
      gameState,
    };

    window.localStorage.setItem(DAILY_PROGRESS_STORAGE_KEY, JSON.stringify(snapshot));
  }, [gameMode, wordData, dailyDateKey, guessedLetters, revealedByHint, hint, visualHint, gameState]);

  const handleGuess = useCallback(
    (letter: string) => {
      const lowerLetter = letter.toLowerCase();

      if (
        gameState !== "playing" ||
        guessedLetters.correct.includes(lowerLetter) ||
        guessedLetters.incorrect.includes(lowerLetter) ||
        revealedByHint.includes(lowerLetter)
      ) {
        return;
      }

      if (showOnboarding && typeof window !== "undefined") {
        setShowOnboarding(false);
        window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
      }

      setLastInteractedLetter(lowerLetter);

      if (wordData?.word.toLowerCase().includes(lowerLetter)) {
        setGuessedLetters((prev) => ({ ...prev, correct: [...prev.correct, lowerLetter] }));
        setLastGuessOutcome("correct");
        playSound("correct");
      } else {
        setGuessedLetters((prev) => ({ ...prev, incorrect: [...prev.incorrect, lowerLetter] }));
        setLastGuessOutcome("incorrect");

        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(24);
        }

        playSound("incorrect");
      }
    },
    [wordData, gameState, guessedLetters, playSound, revealedByHint, showOnboarding]
  );

  const getHint = async (isFree: boolean = false) => {
    if (!wordData) return;
    if (!user && !isFree) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "You must be logged in to use hints.",
      });
      return;
    }

    startHintTransition(async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Hint generation timed out. Please try again.")), 60000);
        });

        const hintPromise = hintAction({
          userId: user ? user.uid : null,
          word: wordData.word,
          wordLength: wordData.word.length,
          incorrectGuesses: guessedLetters.incorrect.join(""),
          lettersToReveal: revealedByHint.length + 1,
          isFree,
        });

        const result = (await Promise.race([hintPromise, timeoutPromise])) as any;

        if (result && result.success && result.hint) {
          setHint(result.hint);
          const newHintedLetters = result.hint
            .split("")
            .filter((char: string) => char !== "_")
            .map((char: string) => char.toLowerCase());
          setRevealedByHint(newHintedLetters);
          playSound("hint");
        } else {
          throw new Error(result.message || "Invalid response from server.");
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Hint Error",
          description: error.message || "Failed to get a hint. Please try again.",
        });
      }
    });
  };

  const getVisualHint = async () => {
    if (!wordData) return;
    setIsVisualHintLoading(true);
    try {
      const result = await generateImageDescription({ word: wordData.word });
      setVisualHint(result.description);
    } catch {
      toast({
        variant: "destructive",
        title: "Visual Hint Error",
        description: "Failed to generate visual description.",
      });
    }
    setIsVisualHintLoading(false);
  };

  const displayedWord = useMemo<{ char: string; revealed: boolean }[]>(() => {
    if (!wordData) return [];

    return wordData.word.split("").map((char) => {
      const lowerChar = char.toLowerCase();
      const isGuessed = guessedLetters.correct.includes(lowerChar);
      const isHinted = revealedByHint.includes(lowerChar);
      return { char, revealed: isGuessed || isHinted };
    });
  }, [wordData, guessedLetters.correct, revealedByHint]);

  const updateFirestoreUser = useCallback(
    async (scoreGained: number, newLevel: number) => {
      if (user && firestore) {
        const userRef = doc(firestore, "userProfiles", user.uid);

        const userDoc = await getDoc(userRef);
        const currentScore = userDoc.data()?.totalScore ?? 0;
        const newTotalScore = currentScore + scoreGained;
        const newRank = getRankForScore(newTotalScore);

        const updateData = {
          totalScore: increment(scoreGained),
          highestLevel: newLevel,
          rank: newRank,
          updatedAt: serverTimestamp(),
        };

        updateDoc(userRef, updateData).catch(() => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: "update",
            requestResourceData: updateData,
          });
          errorEmitter.emit("permission-error", permissionError);
        });
      }
    },
    [user, firestore]
  );

  useEffect(() => {
    if (!wordData || gameState !== "playing") return;

    const isWon = displayedWord.every((item) => item.revealed);

    if (isWon) {
      setGameState("won");
      playSound("win");

      if (gameMode === "daily") {
        updateDailyStreak("won", dailyDateKey);
        return;
      }

      const difficulty = getDifficultyForLevel(level);
      const scoreGained = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30;
      const newLevel = level + 1;

      if (user) {
        updateFirestoreUser(scoreGained, newLevel);
      }
      setScore((prevScore) => prevScore + scoreGained);
      return;
    }

    if (guessedLetters.incorrect.length >= MAX_INCORRECT_TRIES) {
      setGameState("lost");
      playSound("incorrect");

      if (gameMode === "daily") {
        updateDailyStreak("lost", dailyDateKey);
      }
    }
  }, [
    guessedLetters,
    wordData,
    level,
    playSound,
    updateFirestoreUser,
    gameState,
    displayedWord,
    user,
    gameMode,
    dailyDateKey,
    updateDailyStreak,
  ]);

  const dailyShareText = `Definition Detective Daily ${dailyDateKey}\n${
    gameState === "won" ? "Solved" : "Not solved"
  } | Wrong: ${guessedLetters.incorrect.length}/${MAX_INCORRECT_TRIES}\nStreak: ${dailyStreak}`;
  const practiceShareText = "I'm playing Definition Detective! Can you beat my high score?";
  const shareText = gameMode === "daily" && gameState !== "playing" ? dailyShareText : practiceShareText;

  const gameContent = () => {
    if (isGameLoading || !wordData) {
      return (
        <div className="text-center p-8 animate-pulse text-muted-foreground">
          {gameMode === "daily" ? "Loading today's daily challenge..." : "Loading your next practice case..."}
        </div>
      );
    }

    const incorrectTriesLeft = MAX_INCORRECT_TRIES - guessedLetters.incorrect.length;
    const allLettersGuessed = displayedWord.every((item) => item.revealed);
    const hintDisabled = isHintLoading || allLettersGuessed || !user || profileLoading;

    return (
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-2 overflow-hidden">

        <Card aria-labelledby="definition-title" className="mx-auto w-full max-w-[720px] shrink-0">
          <CardHeader className="p-2 pb-1 sm:p-3 sm:pb-1">
            <CardTitle id="definition-title" className="text-center flex items-center justify-center gap-2">
              {gameMode === "daily" && <CalendarDays className="h-5 w-5 text-primary" />}
              {gameMode === "daily" ? `Daily Definition (${dailyDateKey})` : "Definition"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
            <p
              className="line-clamp-4 rounded-md bg-muted/50 p-2 text-left font-serif text-sm text-muted-foreground sm:text-base md:text-lg"
              aria-live="polite"
              aria-label="Word definition clue"
            >
              {wordData.definition}
            </p>
          </CardContent>
        </Card>

        <div
          className={cn(
            "mb-1 flex shrink-0 flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:gap-3",
            lastGuessOutcome === "incorrect" && "animate-shake",
            lastGuessOutcome === "correct" && "animate-slot-pop"
          )}
        >
          {displayedWord.map(({ char, revealed }, index) => (
            <div
              key={index}
              className="flex h-10 w-10 items-center justify-center rounded-md border-b-4 border-primary bg-muted/30 font-mono text-2xl font-bold uppercase sm:h-11 sm:w-11 sm:text-3xl md:h-12 md:w-12 md:text-4xl"
            >
              {revealed && <span className="animate-tile-reveal">{char}</span>}
            </div>
          ))}
        </div>

        {gameState === "won" || gameState === "lost" ? (
          <Alert variant={gameState === "won" ? "default" : "destructive"} className="mx-auto w-full max-w-[720px] text-center">
            {gameState === "won" ? <PartyPopper className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle className="text-2xl font-bold">
              {gameMode === "daily"
                ? gameState === "won"
                  ? "Daily challenge solved"
                  : "Daily challenge complete"
                : gameState === "won"
                ? "You solved it"
                : "Case closed... incorrectly"}
            </AlertTitle>
            <AlertDescription>
              {gameMode === "daily"
                ? `The daily word for ${dailyDateKey} was "${wordData.word}". ${
                    gameState === "won" ? "Come back tomorrow to keep your streak alive." : "A new puzzle unlocks tomorrow."
                  }`
                : gameState === "won"
                ? `The word was "${wordData.word}". Ready for the next case?`
                : `The word was "${wordData.word}". Better luck next time.`}
            </AlertDescription>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {gameMode === "daily" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGameMode("practice");
                      startPracticeGame(level, wordData.word);
                    }}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Switch to Practice
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => loadDailyChallenge(getDailyDateKey())}
                    disabled={dailyDateKey === getDailyDateKey()}
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Check New Daily
                  </Button>
                </>
              ) : (
                <>
                  {gameState === "won" && (
                    <Button
                      onClick={() => {
                        const newLevel = level + 1;
                        setLevel(newLevel);
                        setGameState("playing");
                        startPracticeGame(newLevel, wordData.word);
                      }}
                      disabled={isGameLoading}
                    >
                      {isGameLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Next Case
                        </>
                      )}
                    </Button>
                  )}
                  {gameState === "lost" && (
                    <Button
                      onClick={() => {
                        setGameState("playing");
                        startPracticeGame(level, wordData.word);
                      }}
                    >
                      <RotateCw className="mr-2 h-4 w-4" /> Retry Level
                    </Button>
                  )}
                </>
              )}
            </div>
          </Alert>
        ) : (
          <>
            <div className="mt-0 flex shrink-0 flex-wrap justify-center gap-2">
              <Button onClick={() => getHint(false)} disabled={hintDisabled}>
                <Lightbulb className={cn("mr-2 h-4 w-4", isHintLoading && "animate-spin")} />
                {isHintLoading ? "Getting Hint..." : "Use a Hint"}
              </Button>
            </div>

            {!user && <p className="shrink-0 text-center text-xs text-muted-foreground sm:text-sm">Please log in to use hints and save progress.</p>}

            <p className="shrink-0 text-center text-xs text-muted-foreground sm:text-sm">
              Incorrect Guesses: {guessedLetters.incorrect.join(", ").toUpperCase() || "None"} ({incorrectTriesLeft} left)
            </p>

            <div className="flex min-h-0 flex-1 items-end">
              <div className="mx-auto w-full max-w-[560px]">
                <Keyboard
                  onKeyClick={handleGuess}
                  guessedLetters={guessedLetters}
                  revealedByHint={revealedByHint}
                  lastInteractedLetter={lastInteractedLetter}
                  lastGuessOutcome={lastGuessOutcome}
                />
              </div>
            </div>
          </>
        )}

      </div>
    );
  };

  return (
    <div className="container mx-auto flex h-full min-h-0 flex-col items-center justify-start gap-2 overflow-hidden px-2 pt-2 pb-2 sm:px-4 sm:pt-3 sm:pb-3">
      {/* Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
      )}


      {/* Menu Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-screen w-64 bg-card border-l shadow-lg z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {hasAdFreeExperience && (
            <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-300">
              Premium: Ads Disabled
            </div>
          )}

          {/* Audio Controls Button */}
          <Button
            variant={activeMenuTab === "audio" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => setActiveMenuTab(activeMenuTab === "audio" ? null : "audio")}
          >
            <Music className="h-4 w-4 mr-2" />
            Audio Settings
          </Button>

          {/* Audio Controls Content */}
          {activeMenuTab === "audio" && (
            <div className="ml-4 mb-4 p-3 border rounded-md bg-muted/30 space-y-3">
              <BackgroundMusicControls className="w-full" />
            </div>
          )}

          {/* How to Play Button */}
          <Button
            variant={activeMenuTab === "how-to-play" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => setActiveMenuTab(activeMenuTab === "how-to-play" ? null : "how-to-play")}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            How to Play
          </Button>

          {/* How to Play Content */}
          {activeMenuTab === "how-to-play" && (
            <div className="ml-4 mb-4 p-3 border rounded-md bg-muted/30 space-y-3 text-sm">
              <div>
                <p className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Quick Start
                </p>
                <p className="text-muted-foreground">Read the definition card, then tap one letter to begin. You only get six misses.</p>
              </div>
              <div className="border-t pt-3">
                <p className="font-semibold mb-2">Tips:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Start with common vowels</li>
                  <li>Use hints strategically</li>
                  <li>Try visual clues for extra help</li>
                  <li>Solve the daily challenge to build streaks</li>
                </ul>
              </div>
            </div>
          )}

          {/* Feedback Button */}
          <Button
            variant={activeMenuTab === "feedback" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => setActiveMenuTab(activeMenuTab === "feedback" ? null : "feedback")}
          >
            <Share className="h-4 w-4 mr-2" />
            Feedback
          </Button>

          {/* Feedback Form Content */}
          {activeMenuTab === "feedback" && (
            <div className="ml-4 mb-4 p-3 border rounded-md bg-muted/30 space-y-3 text-sm">
              <p className="text-muted-foreground text-xs">We'd love to hear from you! Share your thoughts to help us improve.</p>
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-2 py-1 text-sm border rounded-md bg-background"
              />
              <textarea
                placeholder="Your feedback..."
                rows={3}
                className="w-full px-2 py-1 text-sm border rounded-md bg-background"
              />
              <Button
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  toast({
                    title: "Thanks!",
                    description: "Your feedback has been recorded.",
                  });
                  setActiveMenuTab(null);
                }}
              >
                Send Feedback
              </Button>
            </div>
          )}

          {/* About This Game Link */}
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/about">
              <Award className="h-4 w-4 mr-2" />
              About This Game
            </Link>
          </Button>

          {/* Leaderboard Link */}
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </Link>
          </Button>

          {/* Pricing Link */}
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/pricing">
              <Crown className="h-4 w-4 mr-2" />
              Pricing
            </Link>
          </Button>

          {/* Share The Game Button */}
          <Button
            variant={activeMenuTab === "share" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => setActiveMenuTab(activeMenuTab === "share" ? null : "share")}
          >
            <Share className="h-4 w-4 mr-2" />
            Share The Game
          </Button>

          {/* Share Content */}
          {activeMenuTab === "share" && (
            <div className="ml-4 mb-4 p-3 border rounded-md bg-muted/30 space-y-3 text-sm">
              <p className="text-muted-foreground text-xs">Share Definition Detective with friends!</p>
              <div className="flex justify-center gap-2">
                <ShareButton platform="whatsapp" text={shareText} />
                <ShareButton platform="facebook" text={shareText} />
                <ShareButton platform="x" text={shareText} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Controls */}
      <div className="w-full shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-stretch gap-2">
            <Button
              variant={gameMode === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => loadDailyChallenge()}
              className="h-auto min-h-8 w-[118px] gap-1.5 px-2 py-1"
              title="Daily Challenge"
            >
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 self-start" />
              <span className="whitespace-normal break-words text-left text-xs leading-tight sm:text-sm">
                Daily Challenge
              </span>
            </Button>
            <Button
              variant={gameMode === "practice" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setGameMode("practice");
                startPracticeGame(level, wordData?.word);
              }}
              className="h-8 gap-1 px-2 text-xs sm:text-sm"
              title="Practice Mode"
            >
              <Target className="h-3.5 w-3.5" />
              <span>Practice</span>
            </Button>
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[11px] sm:text-xs">
              <div className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-0.5">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold">Score:</span>
                <span className="font-mono">{(user ? score : 0).toLocaleString()}</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-0.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-bold">Hints:</span>
                <span className="font-mono">{profileLoading ? "..." : hasUnlimitedHints ? "Unlimited" : userProfile?.hints ?? 0}</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-0.5">
                {gameMode === "daily" ? <Flame className="h-3.5 w-3.5 text-primary" /> : <Target className="h-3.5 w-3.5 text-primary" />}
                <span className="font-bold">{gameMode === "daily" ? "Streak:" : "Level:"}</span>
                <span className="font-mono">{gameMode === "daily" ? dailyStreak : user ? level : 1}</span>
              </div>
            </div>
            {user && gameMode === "practice" && (
              <div className="max-w-[220px]">
                <ThemeSelector
                  selectedTheme={selectedTheme}
                  onThemeChange={async (theme) => {
                    setSelectedTheme(theme);
                    if (user?.uid) {
                      await updateUserTheme({ userId: user.uid, theme });
                    }
                    await startPracticeGame(level, wordData?.word, theme);
                  }}
                  isPremium={isPremium}
                  compact={true}
                  onUpgradeClick={() => {
                    window.location.href = "/subscribe";
                  }}
                />
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMenuOpen(true)}
            className="relative h-8 w-8 self-start p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="w-full min-h-0 flex-1 overflow-hidden">
        {gameContent()}
      </div>
    </div>
  );
}
