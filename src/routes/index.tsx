import { createFileRoute } from "@tanstack/react-router";
import AiSafari from "@/components/safari/AiSafari";

const title = "AI Safari — What is your AI animal totem?";
const description =
  "A playful three-minute self-reflection exercise about how you rely on generative AI. Nine questions, four animals, no sign-up.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiSafari,
});
