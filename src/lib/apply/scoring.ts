import "server-only";
import type { Answers, AnswerValue } from "./questions";

/**
 * Scoring aplikacji — sekcje V i W briefu wdrożeniowego v1.0.
 *
 * ZASADY NIENEGOCJOWALNE (V1, W3):
 * - liczone WYŁĄCZNIE po stronie serwera, po walidacji wszystkich odpowiedzi,
 * - `import "server-only"` gwarantuje, że tabela punktowa i progi nigdy nie
 *   trafią do bundla przeglądarki,
 * - wynik, progi i powód odrzucenia NIE są zwracane użytkownikowi,
 * - odpowiedź otwarta (U12) nie jest oceniana automatycznie.
 *
 * Kolejność decyzji (V1 + V4): hard gates -> capy Manual Review -> próg punktowy.
 * Hard gate zawsze wygrywa z punktami. Cap zawsze blokuje automatyczny Calendly,
 * nawet przy komplecie 100 punktów.
 */

export const SCORING_VERSION = "tcs-v1.0";
export const MAX_SCORE = 100;

export type Status = "QUALIFIED" | "MANUAL_REVIEW" | "NOT_QUALIFIED";

export interface ScoringResult {
  score: number;
  status: Status;
  /** Powody wyłącznie do audytu i back-office — nigdy do przeglądarki (W3). */
  hardGate: string | null;
  caps: string[];
  breakdown: Record<string, number>;
  version: typeof SCORING_VERSION;
}

const str = (v: AnswerValue | undefined): string | null => (typeof v === "string" ? v : null);
const arr = (v: AnswerValue | undefined): string[] => (Array.isArray(v) ? v : []);

/** Tabela punktowa V2. Klucz -> punkty. Maksimum sumuje się dokładnie do 100. */
const POINTS = {
  age: { under_23: 0, "23_29": 5, "30_39": 10, "40_49": 10, "50_59": 10, "60_plus": 8 },
  role: { owner: 8, ceo: 8, manager: 8, specialist: 6, other: 2 },
  goal: { waist: 7, energy: 7, athletic: 5, system: 5, unsure: 1 },
  impact: { "1": 0, "2": 2, "3": 5, "4": 8, "5": 10 },
  duration: { lt_3m: 1, "3_12m": 3, "1_3y": 5, gt_3y: 5 },
  attempts: { none: 1, one_plan: 3, many: 5, regular_no_result: 4 },
  urgency: { "14d": 10, "30d": 8, "1_3m": 5, gt_3m: 1, browsing: 0 },
  process: { yes: 15, logistics_uncertain: 8, no: 0 },
  decision: { self: 5, joint: 4, needs_approval: 2, not_ready: 0 },
  income: { lt_15k: 0, "15_20k": 10, "20_30k": 18, "30_50k": 20, gte_50k: 20 },
} as const;

/** U3: „Żaden z powyższych" = 1 pkt, jakikolwiek element nieregularności = 5 pkt. */
function scoreEnvironment(value: AnswerValue | undefined): number {
  const selected = arr(value);
  if (selected.length === 0) return 0;
  return selected.some((s) => s !== "none") ? 5 : 1;
}

function lookup<T extends Record<string, number>>(table: T, key: string | null): number {
  if (key === null) return 0;
  return table[key as keyof T] ?? 0;
}

export function calculateScore(answers: Answers): {
  score: number;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {
    age: lookup(POINTS.age, str(answers.age)),
    role: lookup(POINTS.role, str(answers.role)),
    environment: scoreEnvironment(answers.environment),
    goal: lookup(POINTS.goal, str(answers.goal)),
    impact: lookup(POINTS.impact, str(answers.impact)),
    duration: lookup(POINTS.duration, str(answers.duration)),
    attempts: lookup(POINTS.attempts, str(answers.attempts)),
    urgency: lookup(POINTS.urgency, str(answers.urgency)),
    process: lookup(POINTS.process, str(answers.process)),
    decision: lookup(POINTS.decision, str(answers.decision)),
    income: lookup(POINTS.income, str(answers.income)),
  };

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown };
}

/**
 * Hard gates (W2). Każdy z nich daje NOT_QUALIFIED niezależnie od punktów.
 * Zwracany powód służy wyłącznie audytowi — użytkownik go nie zobaczy (W3).
 */
function findHardGate(answers: Answers): string | null {
  if (str(answers.age) === "under_23") return "age_under_23";
  if (str(answers.income) === "lt_15k") return "income_below_threshold";
  if (str(answers.process) === "no") return "process_not_ready";
  if (str(answers.decision) === "not_ready") return "decision_not_ready";
  return null;
}

/** Capy Manual Review (V2). Blokują automatyczny Calendly nawet przy 100 pkt (V4). */
function findCaps(answers: Answers): string[] {
  const caps: string[] = [];
  if (str(answers.age) === "23_29") caps.push("age_23_29");
  if (str(answers.income) === "15_20k") caps.push("income_15_20k");
  if (str(answers.process) === "logistics_uncertain") caps.push("process_logistics_uncertain");
  if (str(answers.decision) === "needs_approval") caps.push("decision_needs_approval");
  return caps;
}

/**
 * Pełna ocena aplikacji. Odpowiada pseudokodowi kontraktowemu z W2.
 *
 * Progi (V3):
 * - QUALIFIED: >=70, bez hard gate, bez capu,
 * - MANUAL_REVIEW: cap i >=50, albo brak capu i 50-69,
 * - NOT_QUALIFIED: dowolny hard gate albo <50.
 */
export function evaluate(answers: Answers): ScoringResult {
  const { score, breakdown } = calculateScore(answers);
  const hardGate = findHardGate(answers);
  const caps = findCaps(answers);

  let status: Status;
  if (hardGate || score < 50) {
    status = "NOT_QUALIFIED";
  } else if (caps.length > 0 || score < 70) {
    status = "MANUAL_REVIEW";
  } else {
    status = "QUALIFIED";
  }

  return { score, status, hardGate, caps, breakdown, version: SCORING_VERSION };
}
