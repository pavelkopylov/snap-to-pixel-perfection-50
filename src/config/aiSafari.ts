/**
 * AI SAFARI CONFIGURATION
 * -----------------------
 * All questionnaire text, animal copy, tips, thresholds and matching rules live
 * here. Edit this file to change wording or tune the experimental rules.
 */

import lionImg from "@/assets/lion.png";
import leopardImg from "@/assets/leopard.png";
import monkeyImg from "@/assets/monkey.png";
import turtleImg from "@/assets/turtle.png";

export type CategoryId = "preoccupation" | "consequences" | "withdrawal";
export type AnimalId = "lion" | "leopard" | "monkey" | "turtle";

export const SCALE_OPTIONS = [
  { value: 1, label: "Never" },
  { value: 2, label: "Rarely" },
  { value: 3, label: "Sometimes" },
  { value: 4, label: "Often" },
  { value: 5, label: "Almost always" },
] as const;

export const FRAMING =
  "Thinking about the past two weeks, how often did each of these situations occur?";

export const QUESTIONS: { id: number; category: CategoryId; text: string }[] = [
  { id: 1, category: "preoccupation", text: "I opened an AI tool before trying to work out my own first step." },
  { id: 2, category: "preoccupation", text: "I used AI for a small decision I could comfortably make myself." },
  { id: 3, category: "preoccupation", text: "I continued interacting with AI after I already had what I needed." },
  { id: 4, category: "consequences", text: "After using AI, I struggled to explain the result in my own words." },
  { id: 5, category: "consequences", text: "I accepted an AI suggestion without deciding whether I agreed with it." },
  { id: 6, category: "consequences", text: "I hesitated to begin a familiar task unless AI was available." },
  { id: 7, category: "withdrawal", text: "When AI was unavailable, I felt unsure how to continue." },
  { id: 8, category: "withdrawal", text: "I focused on restoring AI access rather than trying another approach." },
  { id: 9, category: "withdrawal", text: "Being unable to use AI affected my mood beyond ordinary inconvenience." },
];

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  preoccupation: "Reaching for AI first",
  consequences: "Working independently",
  withdrawal: "Comfort without AI",
};

/** Experimental game rules — not scientific thresholds. */
export const RULES = {
  /** All three category averages below this → Reflective Lion. */
  lowThreshold: 2.5,
  /** Difference between top two categories at or under this → mixed result. */
  mixedMargin: 0.25,
  /** Spread across all three categories at or under this → balanced Lion. */
  balancedSpread: 0.25,
  /** Which animal each category maps to when it is the highest. */
  categoryToAnimal: {
    preoccupation: "leopard",
    consequences: "monkey",
    withdrawal: "turtle",
  } as Record<CategoryId, AnimalId>,
};

export const ANIMALS: Record<
  AnimalId,
  { name: string; image: string; description: string; tips: string[] }
> = {
  lion: {
    name: "Reflective Lion",
    image: lionImg,
    description:
      "You usually pause, evaluate and retain control before bringing AI into the process. You are comfortable using AI, but it does not automatically make the first move.",
    tips: [
      "Continue forming your own initial view before consulting AI.",
      "Occasionally ask AI to challenge your reasoning.",
      "Stay open to experimentation without surrendering judgement.",
    ],
  },
  leopard: {
    name: "Speedy Leopard",
    image: leopardImg,
    description:
      "You move quickly, and AI is often your first step. This can make you highly efficient, although your own thinking may occasionally need time to catch up.",
    tips: [
      "Write down your first idea before opening AI.",
      "Pause before accepting the first useful-looking answer.",
      "Check whether you can explain the final result independently.",
    ],
  },
  monkey: {
    name: "Curious Monkey",
    image: monkeyImg,
    description:
      "You enjoy exploring possibilities with AI. Sometimes the exploration becomes more influential than expected, making it harder to explain, evaluate or complete the work independently.",
    tips: [
      "Decide what you need before beginning a conversation with AI.",
      "Choose a stopping point.",
      "Summarise the conclusion in your own words.",
    ],
  },
  turtle: {
    name: "Sheltered Turtle",
    image: turtleImg,
    description:
      "AI can act like a protective shell, providing reassurance when you feel uncertain. When it is unavailable, moving forward may feel less comfortable.",
    tips: [
      "Take the first small step independently before inviting AI in.",
      "Keep an alternative way to complete familiar tasks.",
      "Notice the difference between useful support and feeling unable to continue.",
    ],
  },
};

export const REFLECTION_QUESTIONS = [
  "Where does AI genuinely help me think or learn better?",
  "Which answer surprised me?",
  "What small AI habit would I like to try changing this week?",
];

export const FEEDBACK = {
  fit: { question: "Did your animal feel like you?", options: ["Mostly", "Partly", "Not really"] },
  experience: {
    question: "How was the experience?",
    options: ["Fun", "Thought-provoking", "Confusing", "Uncomfortable"],
  },
};

export const COPY = {
  welcomeHeading: "What is your AI animal?",
  welcomeIntro:
    "AI can help us move faster, explore ideas and solve difficult problems. But how does it influence the way you think and work? Take a short journey through the AI jungle and reflect on your habits.",
  welcomeFacts: ["9 questions", "About 3 minutes", "No name or email required", "Not a diagnosis"],
  startButton: "Start the safari →",
  disclaimer:
    "This is a playful self-reflection exercise. It is not a validated assessment, medical tool, psychological diagnosis or a measure of cognitive ability.",
  certificateSeal: "Recognised by the King of the AI Jungle",
  certificateSmallPrint:
    "This certificate records a personal reflection exercise. It is not a professional certification, psychological assessment or diagnosis.",
  footnote:
    "Inspired by the three themes of the Generative AI Dependency Scale developed by Goh, Hartanto and Majeed (2025). The questions, scoring thresholds and animal profiles used here are an independent, non-validated adaptation created for awareness and reflection.",
  paperUrl: "https://doi.org/10.1016/j.chbr.2025.100845",
  methodology: [
    "Each answer becomes a value from 1 (never) to 5 (almost always).",
    "Questions are grouped into three themes of three questions each. Every theme gets an average score, and the overall score is the average of the three themes.",
    "If all three themes stay below 2.5, the result is the Reflective Lion. Otherwise the highest theme decides the animal: reaching for AI first gives the Speedy Leopard, working independently gives the Curious Monkey, comfort without AI gives the Sheltered Turtle.",
    "If the two highest themes are within 0.25 of each other, a mixed result is shown. If all three are very close, the result is described as balanced.",
    "These thresholds are experimental game rules chosen for reflection, not scientific cut-offs.",
  ],
  privacy: [
    "Your answers are calculated in your browser and saved only on this device so a refresh does not lose them.",
    "Your written reflections never leave your browser unless you explicitly consent.",
    "Nothing is sent anywhere unless you choose to add your animal to the anonymous jungle. In that case only the animal, the three theme scores, the completion date and any survey answers are shared.",
    "No name, email, account, location or device fingerprinting is collected, and there are no advertising or social trackers.",
    "You can delete everything at any time with “Start over and delete my answers”.",
  ],
};

export const STORAGE_KEY = "ai-safari-state-v1";
