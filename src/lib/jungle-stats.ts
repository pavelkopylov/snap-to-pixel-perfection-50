/**
 * Placeholder data service for the anonymous jungle statistics.
 * Deliberately separated from the UI so a lightweight backend (e.g. Supabase)
 * can replace the internals without touching any component.
 *
 * The current implementation keeps aggregate counts in this browser only.
 */

import type { AnimalId, CategoryId } from "@/config/aiSafari";

export interface AnonymousSubmission {
  animal: AnimalId;
  scores: Record<CategoryId, number>;
  completedAt: string;
  feedback?: {
    fit?: string;
    experience?: string;
    suggestion?: string;
  };
}

export interface JungleStats {
  total: number;
  counts: Record<AnimalId, number>;
}

const LOCAL_KEY = "ai-safari-jungle-v1";

const EMPTY: JungleStats = {
  total: 0,
  counts: { lion: 0, leopard: 0, monkey: 0, turtle: 0 },
};

function read(): JungleStats {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as JungleStats;
    return { ...EMPTY, ...parsed, counts: { ...EMPTY.counts, ...parsed.counts } };
  } catch {
    return EMPTY;
  }
}

export const jungleService = {
  async submit(submission: AnonymousSubmission): Promise<JungleStats> {
    const stats = read();
    const next: JungleStats = {
      total: stats.total + 1,
      counts: { ...stats.counts, [submission.animal]: stats.counts[submission.animal] + 1 },
    };
    try {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — statistics are non-essential */
    }
    return next;
  },

  async getStats(): Promise<JungleStats> {
    return read();
  },
};
