/**
 * Scoring i twarde reguły — sekcje 11–12 briefu.
 * Deterministyczny, liczony po stronie serwera. Frontend NIGDY nie jest jedynym miejscem tej logiki.
 * PRIORYTET REGUŁ: 1. Hard rule C → 2. Cap B → 3. Warunki A → 4. Score.
 *
 * Progi i punktacja NIE do zmiany bez zgody właściciela (sekcja 0/26).
 */
import type { Answers, AnswerValue } from "@/lib/questions";

export type Status = "A" | "B" | "C";

export interface ScoringResult {
  score: number;
  status: Status;
  hardRuleReason: string | null;
  capReason: string | null;
  /** ślad audytowy — składowe punktów wg obszaru */
  breakdown: Record<string, number>;
}

export interface ScoringConfig {
  /** Bramka „tylko mężczyźni” (sekcja 11). Domyślnie OFF do czasu akceptacji prawnej. */
  maleOnlyGate: boolean;
}

const asString = (v: AnswerValue | undefined): string | null =>
  typeof v === "string" ? v : null;
const asNumber = (v: AnswerValue | undefined): number | null =>
  typeof v === "number" ? v : null;
const asArray = (v: AnswerValue | undefined): string[] =>
  Array.isArray(v) ? v : [];

/** Q3 Odpowiedzialność → maks 10 */
function scoreQ3(v: string | null): number {
  switch (v) {
    case "owner": return 10;
    case "manager": return 9;
    case "expert": return 8;
    case "intense_low_resp": return 5;
    case "other": return 2;
    default: return 0;
  }
}

/** Q5 Wpływ problemu (skala 1–10) → maks 10 */
function scoreQ5(n: number | null): number {
  if (n === null) return 0;
  if (n >= 10) return 10;
  if (n >= 8) return 9;   // 8–9
  if (n >= 6) return 7;   // 6–7
  if (n >= 4) return 4;   // 4–5
  return 2;               // 1–3
}

/** Q6 Czas trwania → maks 5 */
function scoreQ6(v: string | null): number {
  switch (v) {
    case "lt_3m": return 1;
    case "m_3_6": return 2;
    case "m_6_12": return 3;
    case "y_1_3": return 4;
    case "gt_3y": return 5;
    default: return 0;
  }
}

/** Q8 Wcześniejsze próby (multi) → maks 5, wg liczby realnych kategorii */
function scoreQ8(selected: string[]): number {
  const real = selected.filter((id) => id !== "nic_konkretnego");
  if (selected.includes("nic_konkretnego") && real.length === 0) return 1;
  const n = real.length;
  if (n <= 0) return 1;
  if (n === 1) return 2;
  if (n <= 3) return 4; // 2–3
  return 5;             // 4+
}

/** Q9 Start → maks 15 */
function scoreQ9(v: string | null): number {
  switch (v) {
    case "teraz": return 15;
    case "dni_30": return 13;
    case "mies_2_3": return 6;
    case "nie_wiem": return 2;
    case "tylko_sprawdzam": return 0;
    default: return 0;
  }
}

/** Q10 Gotowość (skala 1–10) → maks 20 */
function scoreQ10(n: number | null): number {
  if (n === null) return 0;
  if (n <= 4) return 0;
  switch (n) {
    case 5: return 8;
    case 6: return 10;
    case 7: return 13;
    case 8: return 16;
    case 9: return 18;
    default: return 20; // 10
  }
}

/** Q11 Dochód → maks 25 */
function scoreQ11(v: string | null): number {
  switch (v) {
    case "lt_15k": return 0;
    case "k_15_19": return 10;
    case "k_20_29": return 20;
    case "k_30_49": return 23;
    case "k_50_plus": return 25;
    default: return 0;
  }
}

/** Q12 Premium → maks 10 */
function scoreQ12(v: string | null): number {
  switch (v) {
    case "gotowy_po_ocenie": return 10;
    case "otwarty_zrozumiec": return 7;
    case "musze_przemyslec": return 3;
    case "nie_planuje": return 0;
    case "darmowe": return 0;
    default: return 0;
  }
}

/**
 * Główna funkcja kwalifikacji. Zwraca score 0–100, status i uzasadnienia (audyt).
 */
export function evaluate(answers: Answers, config: ScoringConfig): ScoringResult {
  const q1 = asString(answers.q1);
  const q2 = asString(answers.q2);
  const q3 = asString(answers.q3);
  const q5 = asNumber(answers.q5);
  const q6 = asString(answers.q6);
  const q8 = asArray(answers.q8);
  const q9 = asString(answers.q9);
  const q10 = asNumber(answers.q10);
  const q11 = asString(answers.q11);
  const q12 = asString(answers.q12);

  const breakdown = {
    q3: scoreQ3(q3),
    q5: scoreQ5(q5),
    q6: scoreQ6(q6),
    q8: scoreQ8(q8),
    q9: scoreQ9(q9),
    q10: scoreQ10(q10),
    q11: scoreQ11(q11),
    q12: scoreQ12(q12),
  };
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // --- 1. HARD RULES → Status C (sekcja 11) ---
  const hardRuleReason = firstHardRule({ q1, q2, q9, q10, q11, q12, score, config });
  if (hardRuleReason) {
    return { score, status: "C", hardRuleReason, capReason: null, breakdown };
  }

  // --- 2. CAP → maksymalnie Status B (sekcja 11) ---
  const capReason = firstCap({ q2, q9, q10, q11, q12 });

  // --- 3. WARUNKI A (sekcja 11) ---
  const meetsA =
    !capReason &&
    isAge30Plus(q2) &&
    isIncome20kPlus(q11) &&
    (q9 === "teraz" || q9 === "dni_30") &&
    (q10 ?? 0) >= 8 &&
    (q12 === "gotowy_po_ocenie" || q12 === "otwarty_zrozumiec") &&
    score >= 75;

  if (meetsA) {
    return { score, status: "A", hardRuleReason: null, capReason: null, breakdown };
  }

  // --- 4. SCORE: B jeśli >= 50, inaczej C (sekcja 12) ---
  if (score >= 50) {
    return { score, status: "B", hardRuleReason: null, capReason, breakdown };
  }
  return { score, status: "C", hardRuleReason: "score_below_50", capReason, breakdown };
}

function firstHardRule(a: {
  q1: string | null; q2: string | null; q9: string | null; q10: number | null;
  q11: string | null; q12: string | null; score: number; config: ScoringConfig;
}): string | null {
  // Reguła płci (male_only_gate) — tylko gdy flaga włączona (po akceptacji prawnej).
  if (a.config.maleOnlyGate && (a.q1 === "self_female" || a.q1 === "other_person")) {
    return "male_only_gate";
  }
  if (a.q2 === "age_18_22") return "age_18_22";
  if (a.q9 === "tylko_sprawdzam") return "start_only_checking";
  if (a.q10 !== null && a.q10 >= 1 && a.q10 <= 4) return "readiness_1_4";
  if (a.q11 === "lt_15k") return "income_below_15k";
  if (a.q12 === "nie_planuje") return "not_investing";
  if (a.q12 === "darmowe") return "seeking_free";
  if (a.score < 50) return "score_below_50";
  return null;
}

function firstCap(a: {
  q2: string | null; q9: string | null; q10: number | null;
  q11: string | null; q12: string | null;
}): string | null {
  if (a.q2 === "age_23_29") return "age_23_29";
  if (a.q11 === "k_15_19") return "income_15_19";
  if (a.q9 === "mies_2_3") return "start_2_3_months";
  if (a.q9 === "nie_wiem") return "start_unknown";
  if (a.q10 !== null && a.q10 >= 5 && a.q10 <= 7) return "readiness_5_7";
  if (a.q12 === "musze_przemyslec") return "need_to_think";
  return null;
}

const isAge30Plus = (q2: string | null) =>
  q2 === "age_30_39" || q2 === "age_40_49" || q2 === "age_50_plus";

const isIncome20kPlus = (q11: string | null) =>
  q11 === "k_20_29" || q11 === "k_30_49" || q11 === "k_50_plus";

/** Odczyt flagi male_only_gate z env (serwer). */
export function scoringConfigFromEnv(): ScoringConfig {
  return { maleOnlyGate: process.env.MALE_ONLY_GATE === "true" };
}
