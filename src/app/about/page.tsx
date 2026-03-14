import Link from "next/link";
import { ArrowLeft, Crown, Sparkles } from "lucide-react";
import { type WordTheme, WORD_THEMES } from "@/lib/game-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const THEME_DETAILS: Record<
  WordTheme,
  { focus: string; examples: string; goodFor: string }
> = {
  current: {
    focus: "General vocabulary across everyday language.",
    examples: "Words from common life topics, broad concepts, and mixed difficulty clue styles.",
    goodFor: "New players, warm-up rounds, and balanced practice without niche categories.",
  },
  "science-safari": {
    focus: "Science words from biology, space, ecosystems, and core physical concepts.",
    examples: "Terms connected to cells, planets, climate, chemistry, evolution, and research language.",
    goodFor: "STEM learners, quiz prep, and players who enjoy technical vocabulary challenges.",
  },
  "history-quest": {
    focus: "Historical vocabulary tied to civilizations, rulers, wars, culture, and artifacts.",
    examples: "Words related to empires, dynasties, monuments, archives, and major historical events.",
    goodFor: "History lovers, students, and players who want context-rich clue solving.",
  },
  "geo-genius": {
    focus: "Geography terms covering landforms, countries, capitals, map language, and Earth systems.",
    examples: "Words linked to coasts, continents, rivers, topography, borders, and geoscience ideas.",
    goodFor: "Geography practice, travel-curious players, and map-focused vocabulary building.",
  },
};

const PREMIUM_BENEFITS = [
  "Unlimited hints with no daily cap",
  "Ad-free gameplay",
  "Access to all premium themes (Science Safari, History Quest, Geo Genius)",
  "All themed word generation and exclusive word packs/content",
  "Advanced statistics and progress insights",
  "Custom profile badges",
];

const YEARLY_EXTRA_BENEFITS = [
  "Lower effective cost than paying monthly for a full year",
  "Priority support",
  "Early access to new features",
  "VIP badge",
];

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl md:text-4xl font-bold">About Definition Detective</h1>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What This Game Is</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Definition Detective is a word-guessing game where you solve a hidden word from its definition.
            You guess letters, avoid too many wrong attempts, and use hints strategically.
          </p>
          <p>
            The game combines quick puzzle rounds with vocabulary growth, daily consistency, and optional
            theme-based learning.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Challenge</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Everyone gets the same daily puzzle. Solving it helps you build streaks and compare progress over time.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Practice Mode</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Unlimited rounds with progressive difficulty, designed for skill building and steady vocabulary expansion.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Game Themes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.entries(WORD_THEMES) as [WordTheme, (typeof WORD_THEMES)[WordTheme]][]).map(([key, theme]) => (
            <div key={key} className="rounded-lg border p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl" aria-hidden>
                  {theme.icon}
                </span>
                <h3 className="font-semibold">{theme.name}</h3>
                <span className="text-xs rounded-full border px-2 py-0.5 text-muted-foreground">
                  {theme.premium ? "Premium Theme" : "Free Theme"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{theme.description}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Focus:</span> {THEME_DETAILS[key].focus}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">What you will see:</span> {THEME_DETAILS[key].examples}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Best for:</span> {THEME_DETAILS[key].goodFor}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Premium Features and Benefits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Included with Premium (Monthly and Yearly)</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {PREMIUM_BENEFITS.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Extra Yearly Benefits</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {YEARLY_EXTRA_BENEFITS.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/subscribe">View Premium Plans</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">Compare Plans</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
