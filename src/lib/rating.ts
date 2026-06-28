/**
 * Rating utilities for Magic of Cinema.
 *
 * - 5 subcategories, each scored 0–20 (whole numbers).
 * - Overall = sum of subs (0–100).
 * - Overall maps to a "verdict band" (MovieMan's words).
 */

export type RatingScores = {
  story: number;
  visuals: number;
  characters: number;
  acting: number;
  music: number;
};

export type Verdict = {
  label: string;
  emoji: string;
  /** Tailwind-friendly color slug used by `verdictClasses()`. */
  tone:
    | "masterpiece"
    | "awesome"
    | "bueno"
    | "mid"
    | "no-bueno"
    | "heck-no";
};

export const SUBCATEGORIES: Array<{
  key: keyof RatingScores;
  label: string;
  emoji: string;
}> = [
  { key: "story", label: "Story", emoji: "📖" },
  { key: "visuals", label: "Visuals", emoji: "🎨" },
  { key: "characters", label: "Characters", emoji: "👥" },
  { key: "acting", label: "Acting", emoji: "🎭" },
  { key: "music", label: "Music", emoji: "🎵" },
];

export function computeOverall(r: RatingScores): number {
  return r.story + r.visuals + r.characters + r.acting + r.music;
}

export function verdictFor(overall: number): Verdict {
  if (overall >= 90) return { label: "Cinematic Masterpiece", emoji: "🏆", tone: "masterpiece" };
  if (overall >= 80) return { label: "Awesome", emoji: "🔥", tone: "awesome" };
  if (overall >= 70) return { label: "Bueno", emoji: "👍", tone: "bueno" };
  if (overall >= 50) return { label: "Mid", emoji: "😐", tone: "mid" };
  if (overall >= 30) return { label: "No Bueno", emoji: "👎", tone: "no-bueno" };
  return { label: "Heck No!", emoji: "💀", tone: "heck-no" };
}

/**
 * Returns Tailwind class strings for a verdict's color treatment.
 * Used on the score badge.
 */
export function verdictClasses(tone: Verdict["tone"]): {
  bg: string;
  text: string;
  ring: string;
} {
  switch (tone) {
    case "masterpiece":
      return { bg: "bg-amber-400", text: "text-stone-900", ring: "ring-amber-300" };
    case "awesome":
      return { bg: "bg-orange-500", text: "text-white", ring: "ring-orange-300" };
    case "bueno":
      return { bg: "bg-emerald-500", text: "text-white", ring: "ring-emerald-300" };
    case "mid":
      return { bg: "bg-slate-400", text: "text-stone-900", ring: "ring-slate-300" };
    case "no-bueno":
      return { bg: "bg-rose-600", text: "text-white", ring: "ring-rose-300" };
    case "heck-no":
      return { bg: "bg-stone-900", text: "text-rose-400", ring: "ring-stone-700" };
  }
}
