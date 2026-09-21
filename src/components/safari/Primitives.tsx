import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SafariButton({
  variant = "solid",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "quiet" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center border border-foreground px-6 py-3 font-sans text-sm tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-35",
        variant === "solid" && "bg-foreground text-primary-foreground hover:bg-foreground/85",
        variant === "outline" && "bg-transparent text-foreground hover:bg-accent",
        variant === "quiet" && "border-transparent px-2 py-1 underline underline-offset-4 hover:bg-accent",
        className,
      )}
    />
  );
}

export function Meter({ label, score }: { label: string; score: number }) {
  const pct = ((score - 1) / 4) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs tracking-wide">
        <span>{label}</span>
        <span className="text-muted-foreground">{score.toFixed(1)} / 5</span>
      </div>
      <div
        className="meter-track mt-2"
        role="img"
        aria-label={`${label}: ${score.toFixed(1)} out of 5`}
      >
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl border border-foreground bg-card p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-xl leading-none">
            ×
          </button>
        </div>
        <div className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
