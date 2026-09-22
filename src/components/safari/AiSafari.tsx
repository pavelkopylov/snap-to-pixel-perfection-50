import { useEffect, useMemo, useState } from "react";
import {
  ANIMALS,
  CATEGORY_LABELS,
  COPY,
  FEEDBACK,
  FRAMING,
  MEANING,
  QUESTIONS,
  SCALE_OPTIONS,
  STORAGE_KEY,
  type CategoryId,
} from "@/config/aiSafari";
import { calculateResult, type Answers } from "@/lib/safari-scoring";
import { downloadCertificate } from "@/lib/safari-pdf";
import { jungleService } from "@/lib/jungle-stats";
import { Meter, Modal, SafariButton } from "@/components/safari/Primitives";
import jungleWelcome from "@/assets/jungle-welcome.jpg";

type Stage = "welcome" | "quiz" | "result" | "certificate";

interface Persisted {
  answers: Answers;
  index: number;
  stage: Stage;
  completedAt?: string | undefined;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as CategoryId[];

function CreativeCommonsIcons() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1"
      aria-label="Creative Commons Attribution ShareAlike"
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[7px] font-semibold"
        aria-hidden="true"
      >
        CC
      </span>
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full border border-current"
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="8" cy="5" r="2" />
          <path d="M4.5 13c.25-2.4 1.4-3.6 3.5-3.6s3.25 1.2 3.5 3.6" />
        </svg>
      </span>
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full border border-current"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 16 16"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.5 5.5A5 5 0 1 0 13 10" />
          <path d="m10.5 3 2 2.5L10 7" />
        </svg>
      </span>
    </span>
  );
}

function CopyrightAndLicense({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] leading-relaxed text-muted-foreground ${className}`}
    >
      <CreativeCommonsIcons />
      <span>© Pavel Kopylov, 2026.</span>
      <span>
        This work is licensed under a{" "}
        <a
          className="underline underline-offset-2"
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          target="_blank"
          rel="license noreferrer"
        >
          Creative Commons Attribution-ShareAlike 4.0 International License
        </a>
        .
      </span>
    </p>
  );
}

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
  const [completedAt, setCompletedAt] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);

  const [methodOpen, setMethodOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const [consent, setConsent] = useState<"yes" | "no">("no");
  const [shared, setShared] = useState(false);
  const [fit, setFit] = useState<string | undefined>();

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setAnswers(saved.answers ?? {});
      setIndex(saved.index ?? 0);
      setStage(saved.stage ?? "welcome");
      setCompletedAt(saved.completedAt);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const data: Persisted = { answers, index, stage, completedAt };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage may be unavailable; the exercise still works */
    }
  }, [answers, index, stage, completedAt, hydrated]);

  const complete = QUESTIONS.every((q) => answers[q.id]);
  const result = useMemo(() => (complete ? calculateResult(answers) : null), [answers, complete]);
  const question = QUESTIONS[index] ?? QUESTIONS[0]!;

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
    setIndex(0);
    setCompletedAt(undefined);
    setShared(false);
    setConsent("no");
    setFit(undefined);
    setStage("welcome");
  }

  function answer(value: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
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
    await jungleService.submit({
      animal: result.primary,
      scores: result.scores,
      completedAt: completedAt ?? new Date().toISOString(),
      ...(fit ? { feedback: { fit } } : {}),
    });
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
            <figure className="mt-10 overflow-hidden border border-foreground bg-card">
              <img
                src={jungleWelcome}
                alt="A hand-drawn jungle with a lion, leopard, monkey and turtle"
                width={1672}
                height={941}
                className="aspect-[16/9] w-full object-cover"
              />
            </figure>
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

            <h2 className="mt-10 text-2xl leading-snug sm:text-3xl">{question.text}</h2>

            <div className="mt-8 space-y-3">
              {SCALE_OPTIONS.map((option) => {
                const selected = answers[question.id] === option.value;
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
                disabled={!answers[question.id]}
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
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {ANIMALS[result.primary].why}
              </p>
            </div>

            <div className="space-y-6 border-t border-foreground pt-8">
              {CATEGORIES.map((c) => (
                <Meter key={c} label={CATEGORY_LABELS[c]} score={result.scores[c]} />
              ))}
              <p className="text-xs text-muted-foreground">
                These bars describe tendencies, not problems.
              </p>
            </div>

            <div className="border-t border-foreground pt-8">
              <h2 className="text-2xl">{MEANING.heading}</h2>
              {MEANING.intro.map((p) => (
                <p key={p} className="mt-4 text-base leading-relaxed">
                  {p}
                </p>
              ))}
              <p className="mt-8 text-base leading-relaxed">{MEANING.researchIntro}</p>
              <div className="mt-6 space-y-6">
                {MEANING.dimensions.map((d) => (
                  <div key={d.title} className="border-t border-border pt-5">
                    <h3 className="text-lg">{d.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed">{d.body}</p>
                    <p className="mt-2 font-serif text-sm italic text-muted-foreground">“{d.quote}”</p>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-sm leading-relaxed">{MEANING.lionNote}</p>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{MEANING.caveat}</p>
              <button
                className="mt-6 text-xs underline underline-offset-4"
                onClick={() => setMethodOpen(true)}
              >
                How this result works
              </button>
            </div>

            <div className="border-t border-foreground pt-8">
              <h2 className="text-2xl">Would you like to add your animal to the anonymous AI jungle?</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Shared if you agree: your animal, the three theme scores, the completion date and your
                optional answer below. Never shared: name, email, account, location or device
                fingerprint.
              </p>
              <div className="mt-6 flex flex-wrap gap-3" role="radiogroup" aria-label="Sharing consent">
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

              <div className="mt-8">
                <p className="text-sm">{FEEDBACK.fit.question}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FEEDBACK.fit.options.map((option) => (
                    <button
                      key={option}
                      aria-pressed={fit === option}
                      onClick={() => setFit(option)}
                      className={`border border-foreground px-4 py-2 text-sm ${
                        fit === option
                          ? "bg-foreground text-primary-foreground"
                          : "bg-card hover:bg-accent"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <SafariButton onClick={share} disabled={consent !== "yes" || shared}>
                  {shared ? "Added to the jungle" : "Send anonymously"}
                </SafariButton>
              </div>
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
              <CopyrightAndLicense className="mt-8 justify-center" />
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
          <CopyrightAndLicense className="mt-5" />
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
