'use client';

import { useState, useEffect, useCallback, useMemo, useTransition, useRef } from "react";
import { type WordData, type WordTheme, getRankForScore, wordList } from "@/lib/game-data";
import { generateImageDescription } from "@/ai/flows/generate-image-description-flow";
import { useHintAction, generateWordWithTheme, updateUserTheme, getUserTheme } from "@/lib/actions";
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
  PartyPopper,
  Share,
  ArrowRight,
  Loader2,
  CalendarDays,
  Flame,
  Sparkles,
  Target,
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

  const guessAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedThemeRef = useRef<WordTheme>("current");
  const { playSound } = useGameSounds();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, "userProfiles", user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  const hasUnlimitedHints =
    Boolean(userProfile?.isPremium) ||
    userProfile?.subscriptionStatus === "active" ||
    userProfile?.subscriptionStatus === "expiring" ||
    isPremium;

  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      setScore(userProfile.totalScore);
      setLevel(userProfile.highestLevel);
    }
  }, [userProfile]);

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

        const hintPromise = useHintAction({
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

    const dailyShareText = `Definition Detective Daily ${dailyDateKey}\n${
      gameState === "won" ? "Solved" : "Not solved"
    } | Wrong: ${guessedLetters.incorrect.length}/${MAX_INCORRECT_TRIES}\nStreak: ${dailyStreak}`;

    const practiceShareText = "I'm playing Definition Detective! Can you beat my high score?";
    const shareText = gameMode === "daily" && gameState !== "playing" ? dailyShareText : practiceShareText;

    return (
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3 sm:text-base">
          <div className="flex items-center justify-center gap-2 rounded-lg border bg-card p-3">
            <Award className="h-5 w-5 text-primary" />
            Score: <span className="font-semibold">{(user ? score : 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-lg border bg-card p-3">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Hints:
            <span className="font-semibold">{profileLoading ? "..." : hasUnlimitedHints ? "Unlimited" : userProfile?.hints ?? 0}</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-lg border bg-card p-3">
            {gameMode === "daily" ? <Flame className="h-5 w-5 text-primary" /> : <Target className="h-5 w-5 text-primary" />}
            {gameMode === "daily" ? "Streak" : "Level"}:
            <span className="font-semibold">{gameMode === "daily" ? dailyStreak : user ? level : 1}</span>
          </div>
        </div>

        {showOnboarding && gameState === "playing" && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="flex flex-col gap-3 py-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Quick Start
              </p>
              <p className="text-muted-foreground">Read the definition card, then tap one letter to begin. You only get six misses.</p>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowOnboarding(false);
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
                    }
                  }}
                >
                  Start Playing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card aria-labelledby="definition-title">
          <CardHeader>
            <CardTitle id="definition-title" className="text-center flex items-center justify-center gap-2">
              {gameMode === "daily" && <CalendarDays className="h-5 w-5 text-primary" />}
              {gameMode === "daily" ? `Daily Definition (${dailyDateKey})` : "Definition"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="rounded-md bg-muted/50 p-4 text-center font-sans text-lg text-muted-foreground"
              aria-live="polite"
              aria-label="Word definition clue"
            >
              {wordData.definition}
            </p>
          </CardContent>
        </Card>

        {visualHint && (
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Visual Clue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="italic">{visualHint}</p>
            </CardContent>
          </Card>
        )}

        <div
          className={cn(
            "my-8 flex flex-wrap items-center justify-center gap-2 md:gap-4",
            lastGuessOutcome === "incorrect" && "animate-shake",
            lastGuessOutcome === "correct" && "animate-slot-pop"
          )}
        >
          {displayedWord.map(({ char, revealed }, index) => (
            <div
              key={index}
              className="flex h-12 w-12 items-center justify-center rounded-md border-b-4 border-primary bg-muted/30 font-mono text-3xl font-bold uppercase md:h-16 md:w-16 md:text-4xl"
            >
              {revealed && <span className="animate-tile-reveal">{char}</span>}
            </div>
          ))}
        </div>

        {gameState === "won" || gameState === "lost" ? (
          <Alert variant={gameState === "won" ? "default" : "destructive"} className="text-center">
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
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => getHint(false)} disabled={hintDisabled}>
                <Lightbulb className={cn("mr-2 h-4 w-4", isHintLoading && "animate-spin")} />
                {isHintLoading ? "Getting Hint..." : "Use a Hint"}
              </Button>
              <Button onClick={getVisualHint} disabled={isVisualHintLoading || !!visualHint} variant="secondary">
                <Share className={cn("mr-2 h-4 w-4", isVisualHintLoading && "animate-spin")} />
                {isVisualHintLoading ? "Generating..." : "Visual Clue"}
              </Button>
            </div>

            {!user && <p className="text-center text-sm text-muted-foreground">Please log in to use hints and save progress.</p>}

            <p className="text-center text-muted-foreground">
              Incorrect Guesses: {guessedLetters.incorrect.join(", ").toUpperCase() || "None"} ({incorrectTriesLeft} left)
            </p>

            <div className="mx-auto w-full max-w-[560px]">
              <Keyboard
                onKeyClick={handleGuess}
                guessedLetters={guessedLetters}
                revealedByHint={revealedByHint}
                lastInteractedLetter={lastInteractedLetter}
                lastGuessOutcome={lastGuessOutcome}
              />
            </div>
          </>
        )}

        <div className="mt-12 border-t border-dashed pt-8">
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <Share className="h-4 w-4" /> Share The Game
          </p>
          <div className="flex justify-center gap-2">
            <ShareButton platform="whatsapp" text={shareText} />
            <ShareButton platform="facebook" text={shareText} />
            <ShareButton platform="x" text={shareText} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center gap-8 py-8 md:py-12">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">Definition Detective</h1>
        <p className="mt-4 max-w-2xl text-lg text-foreground/80">
          A text-first word puzzle tuned for daily retention: one shared daily challenge plus endless practice.
        </p>
      </div>

      <section className="w-full max-w-3xl space-y-3">
        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-1">
          <Button
            variant={gameMode === "daily" ? "default" : "ghost"}
            className="w-full"
            onClick={() => loadDailyChallenge()}
          >
            <CalendarDays className="mr-2 h-4 w-4" /> Daily Challenge
          </Button>
          <Button
            variant={gameMode === "practice" ? "default" : "ghost"}
            className="w-full"
            onClick={() => {
              setGameMode("practice");
              startPracticeGame(level, wordData?.word);
            }}
          >
            <Target className="mr-2 h-4 w-4" /> Practice Mode
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Daily uses one global word each UTC day. Practice stays unlimited.
        </p>
      </section>

      {user && gameMode === "practice" && (
        <div className="w-full max-w-md">
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
            onUpgradeClick={() => {
              window.location.href = "/subscribe";
            }}
          />
        </div>
      )}

      {gameContent()}

      <BackgroundMusicControls />
    </div>
  );
}
