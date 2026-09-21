import { useEffect, useMemo, useState } from "react";
import {
  ANIMALS,
  CATEGORY_LABELS,
  COPY,
  FEEDBACK,
  FRAMING,
  QUESTIONS,
  REFLECTION_QUESTIONS,
  SCALE_OPTIONS,
  STORAGE_KEY,
  type CategoryId,
} from "@/config/aiSafari";
import { calculateResult, type Answers } from "@/lib/safari-scoring";
import { downloadCertificate } from "@/lib/safari-pdf";
import { jungleService, type JungleStats } from "@/lib/jungle-stats";
import { Meter, Modal, SafariButton } from "@/components/safari/Primitives";

type Stage = "welcome" | "quiz" | "result" | "certificate";

interface Persisted {
  answers: Answers;
  index: number;
  stage: Stage;
  reflections: Record<number, string>;
  completedAt?: string;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as CategoryId[];

function loadState(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch {
    return null;
  }
}

export default function AiSafari() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [reflections, setReflections] = useState<Record<number, string>>({});
  const [completedAt, setCompletedAt] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);

  const [methodOpen, setMethodOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const [consent, setConsent] = useState<"yes" | "no">("no");
  const [shared, setShared] = useState(false);
  const [stats, setStats] = useState<JungleStats | null>(null);
  const [fit, setFit] = useState<string | undefined>();
  const [experience, setExperience] = useState<string | undefined>();
  const [suggestion, setSuggestion] = useState("");

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setAnswers(saved.answers ?? {});
      setIndex(saved.index ?? 0);
      setStage(saved.stage ?? "welcome");
      setReflections(saved.reflections ?? {});
      setCompletedAt(saved.completedAt);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const data: Persisted = { answers, index, stage, reflections, completedAt };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage may be unavailable; the exercise still works */
    }
  }, [answers, index, stage, reflections, completedAt, hydrated]);

  const complete = QUESTIONS.every((q) => answers[q.id]);
  const result = useMemo(() => (complete ? calculateResult(answers) : null), [answers, complete]);

  const dateLabel = useMemo(
    () =>
      new Date(completedAt ?? Date.now()).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [completedAt],
  );

  function reset() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setAnswers({});
    setReflections({});
    setIndex(0);
    setCompletedAt(undefined);
    setShared(false);
    setConsent("no");
    setFit(undefined);
    setExperience(undefined);
    setSuggestion("");
    setStage("welcome");
  }

  function answer(value: number) {
    const q = QUESTIONS[index];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    if (index < QUESTIONS.length - 1) {
      setIndex(index + 1);
    } else {
      setCompletedAt(new Date().toISOString());
      setStage("result");
    }
  }

  async function handlePdf() {
    if (!result) return;
    setPdfError(false);
    try {
      await downloadCertificate(result, dateLabel);
    } catch {
      setPdfError(true);
    }
  }

  async function share() {
    if (!result || consent !== "yes") return;
    const next = await jungleService.submit({
      animal: result.primary,
      scores: result.scores,
      completedAt: completedAt ?? new Date().toISOString(),
      feedback: { fit, experience, suggestion: suggestion.trim() || undefined },
    });
    setStats(next);
    setShared(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-foreground">
        <div className="mx-auto flex max-w-3xl items-baseline justify-between px-5 py-4">
          <span className="font-serif text-lg">AI Safari</span>
          <button className="text-xs underline underline-offset-4" onClick={() => setPrivacyOpen(true)}>
            Privacy
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        {stage === "welcome" && (
          <section>
            <h1 className="text-4xl leading-tight sm:text-6xl">{COPY.welcomeHeading}</h1>
            <p className="mt-8 max-w-2xl text-base leading-relaxed sm:text-lg">{COPY.welcomeIntro}</p>
            <ul className="mt-10 border-t border-foreground text-sm">
              {COPY.welcomeFacts.map((fact) => (
                <li key={fact} className="border-b border-border py-3">
                  {fact}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <SafariButton onClick={() => setStage("quiz")}>{COPY.startButton}</SafariButton>
              {complete && (
                <SafariButton variant="outline" onClick={() => setStage("result")}>
                  See my saved result
                </SafariButton>
              )}
            </div>
            <p className="mt-10 max-w-xl text-xs leading-relaxed text-muted-foreground">
              {COPY.disclaimer}
            </p>
          </section>
        )}

        {stage === "quiz" && (
          <section>
            <p className="text-sm leading-relaxed text-muted-foreground">{FRAMING}</p>
            <div className="mt-8 flex items-center justify-between text-xs tracking-widest uppercase">
              <span>
                {index + 1} of {QUESTIONS.length}
              </span>
            </div>
            <div
              className="mt-3 h-[3px] w-full bg-secondary"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={QUESTIONS.length}
              aria-valuenow={index + 1}
            >
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>

            <h2 className="mt-10 text-2xl leading-snug sm:text-3xl">{QUESTIONS[index].text}</h2>

            <div className="mt-8 space-y-3">
              {SCALE_OPTIONS.map((option) => {
                const selected = answers[QUESTIONS[index].id] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => answer(option.value)}
                    aria-pressed={selected}
                    className={`w-full border border-foreground px-5 py-4 text-left text-base transition-colors ${
                      selected ? "bg-foreground text-primary-foreground" : "bg-card hover:bg-accent"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-foreground pt-6">
              <SafariButton
                variant="outline"
                onClick={() => (index === 0 ? setStage("welcome") : setIndex(index - 1))}
              >
                ← Back
              </SafariButton>
              <SafariButton
                onClick={() =>
                  index < QUESTIONS.length - 1
                    ? setIndex(index + 1)
                    : (setCompletedAt(new Date().toISOString()), setStage("result"))
                }
                disabled={!answers[QUESTIONS[index].id]}
              >
                {index < QUESTIONS.length - 1 ? "Next →" : "See my animal →"}
              </SafariButton>
            </div>
          </section>
        )}

        {stage === "result" && result && (
          <section className="space-y-14">
            <div className="text-center">
              <img
                src={ANIMALS[result.primary].image}
                alt={ANIMALS[result.primary].name}
                width={816}
                height={816}
                className="mx-auto w-56 sm:w-72"
              />
              <h1 className="mt-6 text-4xl sm:text-5xl">{ANIMALS[result.primary].name}</h1>
              <p className="mt-3 font-serif text-lg italic text-muted-foreground">{result.headline}</p>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed">
                {ANIMALS[result.primary].description}
              </p>
              <button
                className="mt-6 text-xs underline underline-offset-4"
                onClick={() => setMethodOpen(true)}
              >
                How this result works
              </button>
            </div>

            <div className="space-y-6 border-t border-foreground pt-8">
              {CATEGORIES.map((c) => (
                <Meter key={c} label={CATEGORY_LABELS[c]} score={result.scores[c]} />
              ))}
              <p className="text-xs text-muted-foreground">
                Overall reflection score {result.overall.toFixed(1)} / 5. These bars describe
                tendencies, not problems.
              </p>
            </div>

            <div className="border-t border-foreground pt-8">
              <h2 className="text-2xl">A few things to try</h2>
              <ul className="mt-5 space-y-3 text-base leading-relaxed">
                {ANIMALS[result.primary].tips.map((tip) => (
                  <li key={tip} className="border-b border-border pb-3">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-foreground pt-8">
              <h2 className="text-2xl">Your answers</h2>
              <ul className="mt-5 text-sm">
                {QUESTIONS.map((q) => (
                  <li
                    key={q.id}
                    className="flex justify-between gap-6 border-b border-border py-3 leading-relaxed"
                  >
                    <span>{q.text}</span>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {SCALE_OPTIONS.find((o) => o.value === answers[q.id])?.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-foreground pt-8">
              <h2 className="text-2xl">Optional reflection</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                These notes stay in your browser and are never transmitted.
              </p>
              <div className="mt-6 space-y-6">
                {REFLECTION_QUESTIONS.map((q, i) => (
                  <label key={q} className="block">
                    <span className="text-sm">{q}</span>
                    <textarea
                      value={reflections[i] ?? ""}
                      onChange={(e) => setReflections({ ...reflections, [i]: e.target.value })}
                      rows={3}
                      className="mt-2 w-full border border-foreground bg-card p-3 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-foreground pt-8">
              <h2 className="text-2xl">Would you like to add your animal to the anonymous AI jungle?</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Shared if you agree: your animal category, the three theme scores, the completion date
                and any survey answers below. Never shared: name, email, account, location, device
                fingerprint or your written reflections.
              </p>
              <div className="mt-6 flex gap-3" role="radiogroup" aria-label="Sharing consent">
                {(["no", "yes"] as const).map((value) => (
                  <button
                    key={value}
                    role="radio"
                    aria-checked={consent === value}
                    onClick={() => setConsent(value)}
                    className={`border border-foreground px-6 py-3 text-sm ${
                      consent === value ? "bg-foreground text-primary-foreground" : "bg-card hover:bg-accent"
                    }`}
                  >
                    {value === "yes" ? "Yes, share anonymously" : "No, keep it private"}
                  </button>
                ))}
              </div>

              <div className="mt-10 space-y-8">
                {[
                  { ...FEEDBACK.fit, value: fit, set: setFit },
                  { ...FEEDBACK.experience, value: experience, set: setExperience },
                ].map((group) => (
                  <div key={group.question}>
                    <p className="text-sm">{group.question}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.options.map((option) => (
                        <button
                          key={option}
                          aria-pressed={group.value === option}
                          onClick={() => group.set(option)}
                          className={`border border-foreground px-4 py-2 text-sm ${
                            group.value === option
                              ? "bg-foreground text-primary-foreground"
                              : "bg-card hover:bg-accent"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <label className="block">
                  <span className="text-sm">What would you change or add? (optional)</span>
                  <textarea
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    rows={3}
                    className="mt-2 w-full border border-foreground bg-card p-3 text-sm"
                  />
                  <span className="mt-2 block text-xs text-muted-foreground">
                    Please do not include names or other personal information.
                  </span>
                </label>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <SafariButton onClick={share} disabled={consent !== "yes" || shared}>
                  {shared ? "Added to the jungle" : "Send anonymously"}
                </SafariButton>
                <SafariButton
                  variant="outline"
                  onClick={async () => setStats(await jungleService.getStats())}
                >
                  Show jungle statistics
                </SafariButton>
              </div>

              {stats && (
                <div className="mt-8 border border-foreground p-5">
                  <h3 className="text-lg">The jungle so far</h3>
                  {stats.total === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No anonymous results yet.</p>
                  ) : (
                    <ul className="mt-4 text-sm">
                      {(Object.keys(ANIMALS) as (keyof typeof ANIMALS)[]).map((key) => (
                        <li key={key} className="flex justify-between border-b border-border py-2">
                          <span>{ANIMALS[key].name}s</span>
                          <span className="text-muted-foreground">
                            {stats.counts[key]} ({Math.round((stats.counts[key] / stats.total) * 100)}%)
                          </span>
                        </li>
                      ))}
                      <li className="flex justify-between py-2">
                        <span>Total anonymous submissions</span>
                        <span className="text-muted-foreground">{stats.total}</span>
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 border-t border-foreground pt-8">
              <SafariButton onClick={() => setStage("certificate")}>View my certificate</SafariButton>
              <SafariButton variant="outline" onClick={reset}>
                Start over and delete my answers
              </SafariButton>
            </div>
          </section>
        )}

        {stage === "certificate" && result && (
          <section>
            <div className="print-sheet border border-foreground bg-card px-6 py-12 text-center sm:px-12">
              <p className="text-xs tracking-[0.3em] uppercase">AI Safari</p>
              <h1 className="mt-4 text-3xl sm:text-4xl">AI Safari Certificate</h1>
              <div className="mx-auto mt-6 h-px w-24 bg-foreground" />
              <img
                src={ANIMALS[result.primary].image}
                alt={ANIMALS[result.primary].name}
                width={816}
                height={816}
                loading="lazy"
                className="mx-auto mt-8 w-44 sm:w-56"
              />
              <h2 className="mt-4 text-3xl">{ANIMALS[result.primary].name}</h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed">
                {ANIMALS[result.primary].description}
              </p>
              <div className="mx-auto mt-10 max-w-md space-y-5 text-left">
                {CATEGORIES.map((c) => (
                  <Meter key={c} label={CATEGORY_LABELS[c]} score={result.scores[c]} />
                ))}
              </div>
              <p className="mx-auto mt-10 max-w-md font-serif text-base italic">
                {ANIMALS[result.primary].tips[0]}
              </p>
              <p className="mt-8 text-sm text-muted-foreground">Completed {dateLabel}</p>
              <div className="mx-auto mt-8 flex h-32 w-32 items-center justify-center rounded-full border border-foreground p-1">
                <span className="flex h-full w-full items-center justify-center rounded-full border border-foreground px-3 font-serif text-[10px] leading-tight">
                  {COPY.certificateSeal}
                </span>
              </div>
              <p className="mx-auto mt-8 max-w-md text-xs leading-relaxed text-muted-foreground">
                {COPY.certificateSmallPrint}
              </p>
            </div>

            <div className="no-print mt-8 flex flex-wrap gap-4">
              <SafariButton onClick={handlePdf}>Download PDF</SafariButton>
              <SafariButton variant="outline" onClick={() => window.print()}>
                Print
              </SafariButton>
              <SafariButton variant="outline" onClick={() => setStage("result")}>
                Return to my results
              </SafariButton>
            </div>
            {pdfError && (
              <p role="alert" className="no-print mt-4 text-sm text-destructive">
                The PDF could not be generated in this browser. You can use Print instead and choose
                “Save as PDF”.
              </p>
            )}
          </section>
        )}

        <footer className="no-print mt-20 border-t border-foreground pt-6 text-xs leading-relaxed text-muted-foreground">
          <p>{COPY.footnote}</p>
          <p className="mt-3 flex flex-wrap gap-4">
            <a className="underline underline-offset-4" href={COPY.paperUrl} target="_blank" rel="noreferrer">
              Read the paper
            </a>
            <button className="underline underline-offset-4" onClick={() => setMethodOpen(true)}>
              How this result works
            </button>
            <button className="underline underline-offset-4" onClick={() => setPrivacyOpen(true)}>
              Privacy
            </button>
          </p>
        </footer>
      </main>

      <Modal open={methodOpen} onClose={() => setMethodOpen(false)} title="How this result works">
        {COPY.methodology.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Modal>
      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Privacy">
        {COPY.privacy.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Modal>
    </div>
  );
}
