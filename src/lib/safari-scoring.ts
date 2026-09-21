import {
  ANIMALS,
  QUESTIONS,
  RULES,
  type AnimalId,
  type CategoryId,
} from "@/config/aiSafari";

export type Answers = Record<number, number>;

export interface SafariResult {
  scores: Record<CategoryId, number>;
  overall: number;
  primary: AnimalId;
  secondary: AnimalId | null;
  balanced: boolean;
  headline: string;
}

const CATEGORIES: CategoryId[] = ["preoccupation", "consequences", "withdrawal"];

function average(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function calculateResult(answers: Answers): SafariResult {
  const scores = CATEGORIES.reduce((acc, category) => {
    const values = QUESTIONS.filter((q) => q.category === category).map(
      (q) => answers[q.id] ?? 1,
    );
    acc[category] = average(values);
    return acc;
  }, {} as Record<CategoryId, number>);

  const overall = average(CATEGORIES.map((c) => scores[c]));
  const ranked = [...CATEGORIES].sort((a, b) => scores[b] - scores[a]);
  const spread = scores[ranked[0]] - scores[ranked[2]];

  const allLow = CATEGORIES.every((c) => scores[c] < RULES.lowThreshold);
  const balanced = spread <= RULES.balancedSpread;

  if (allLow || balanced) {
    return {
      scores,
      overall,
      primary: "lion",
      secondary: null,
      balanced: balanced && !allLow ? true : balanced,
      headline: balanced
        ? "Your habits look balanced across all three themes."
        : "You are a Reflective Lion.",
    };
  }

  const primary = RULES.categoryToAnimal[ranked[0]];
  const gap = scores[ranked[0]] - scores[ranked[1]];
  const secondary =
    gap <= RULES.mixedMargin ? RULES.categoryToAnimal[ranked[1]] : null;

  return {
    scores,
    overall,
    primary,
    secondary,
    balanced: false,
    headline: secondary
      ? `You are mainly a ${ANIMALS[primary].name}, with a little ${ANIMALS[secondary].name}.`
      : `You are a ${ANIMALS[primary].name}.`,
  };
}
