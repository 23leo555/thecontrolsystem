import "server-only";
import type { Answers, AnswerValue } from "./questions";

/**
 * Scoring aplikacji — druga generacja pytań (2026-08-16), ta sama architektura
 * klasyfikacji co poprzednia wersja (tcs-v1.0): hard gates -> capy Manual
 * Review -> próg punktowy. Zmieniły się tylko pytania i mapowanie punktów —
 * mechanizm decyzyjny został przywrócony na wyraźną prośbę właściciela.
 *
 * ZASADY NIENEGOCJOWALNE (odziedziczone z v1.0):
 * - liczone WYŁĄCZNIE po stronie serwera, po walidacji wszystkich odpowiedzi,
 * - `import "server-only"` gwarantuje, że tabela punktowa i progi nigdy nie
 *   trafią do bundla przeglądarki,
 * - wynik, progi i powód odrzucenia NIE są zwracane użytkownikowi,
 * - odpowiedzi otwarte (whyFailed, goal) nie są oceniane automatycznie.
 *
 * Mapowanie starych wymiarów na nowe pytania (do weryfikacji przez właściciela —
 * wagi są najlepszym możliwym przełożeniem, nie testowaną kalibracją):
 *   age        -> age (te same bramy wiekowe co dawniej, bez najniższego progu
 *                 „poniżej 23", którego już nie ma w ankiecie)
 *   role       -> role (bez zmian)
 *   environment (multi, do 3) -> workMode (single) — więcej zmienności/chaosu
 *                 w grafiku = wyższy sygnał, tak jak dawniej
 *   goal       -> controlArea — dawne „goal" było single-select z tą samą rolą
 *                 diagnostyczną, którą teraz pełni controlArea
 *   impact (skala 1-5) -> USUNIĘTE, nie ma odpowiednika w nowej ankiecie;
 *                 budżet punktowy przeniesiony na pozostałe wymiary
 *   duration   -> duration (bez zmian)
 *   attempts (single) -> attempts (multi) — funkcja licząca zamiast tabeli
 *   urgency    -> whyNow (inne opcje, ta sama rola: sygnał pilności)
 *   process + decision -> połączone w jedno pytanie readiness (4 opcje
 *                 zamiast 3+4) — „analyzing" i „browsing" to capy (dziedziczą
 *                 po process:logistics_uncertain/decision:needs_approval),
 *                 nie hard gate. Brief dopuszcza wyłącznie dwie twarde bramki
 *                 (płeć, dochód), więc dawny hard gate na process:no/
 *                 decision:not_ready NIE ma odpowiednika — zbyt agresywne
 *                 odrzucenie zostało cofnięte 2026-08-17
 *   income     -> income (bez zmian, te same bramy i progi)
 *   motivation -> whyFailed / goal (oba nieocenianie, jak dawniej motivation)
 *   blocker    -> NOWE pytanie bez odpowiednika w v1.0, umiarkowana waga
 */

export const SCORING_VERSION = "tcs-v2.0";
export const MAX_SCORE = 100;

export type Status = "QUALIFIED" | "MANUAL_REVIEW" | "NOT_QUALIFIED";

export interface ScoringResult {
  score: number;
  status: Status;
  /** Powody wyłącznie do audytu i back-office — nigdy do przeglądarki. */
  hardGate: string | null;
  caps: string[];
  breakdown: Record<string, number>;
  version: typeof SCORING_VERSION;
}

const str = (v: AnswerValue | undefined): string | null => (typeof v === "string" ? v : null);
const arr = (v: AnswerValue | undefined): string[] => (Array.isArray(v) ? v : []);

/** Tabela punktowa v2. Maksimum sumuje się dokładnie do 100. */
const POINTS = {
  age: { under_30: 5, "30_39": 10, "40_49": 10, "50_59": 10, "60_plus": 8 },
  role: { owner: 10, exec: 10, specialist: 7, other: 2 },
  workMode: { stable: 2, intense: 4, variable: 8, crisis: 8 },
  controlArea: { body: 8, energy: 8, sleep: 7, training: 7, food: 7, chaos: 6, combo: 10 },
  duration: { lt_6m: 1, "6_12m": 3, "1_3y": 5, gt_3y: 5 },
  // "other" nie jest karane niżej niż środek tabeli — to pole odsłania
  // konkretny, własny opis, co jest silniejszym sygnałem niż wybranie
  // generycznej opcji z listy, nie słabszym (korekta 2026-08-17).
  blocker: { work_time: 3, travel: 3, no_energy: 2, no_plan: 5, consistency: 3, other: 3 },
  whyNow: { health: 9, event: 7, tired_of_waiting: 12, other: 9 },
  readiness: { ready_now: 15, considering_soon: 8, analyzing: 3, browsing: 0 },
  income: { lt_15k: 0, "15_20k": 10, "20_30k": 18, "30_50k": 20, gte_50k: 20 },
} as const;

/** Więcej różnych metod próbowanych wcześniej = wyższy sygnał, tak jak dawniej. */
function scoreAttempts(value: AnswerValue | undefined): number {
  const selected = arr(value);
  if (selected.length === 0) return 0;
  if (selected.includes("none")) return 1;
  if (selected.length === 1) return 3;
  if (selected.length === 2) return 4;
  return 5;
}

function lookup<T extends Record<string, number>>(table: T, key: string | null): number {
  if (key === null) return 0;
  return table[key as keyof T] ?? 0;
}

export function calculateScore(answers: Answers): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    age: lookup(POINTS.age, str(answers.age)),
    role: lookup(POINTS.role, str(answers.role)),
    workMode: lookup(POINTS.workMode, str(answers.workMode)),
    controlArea: lookup(POINTS.controlArea, str(answers.controlArea)),
    duration: lookup(POINTS.duration, str(answers.duration)),
    attempts: scoreAttempts(answers.attempts),
    blocker: lookup(POINTS.blocker, str(answers.blocker)),
    whyNow: lookup(POINTS.whyNow, str(answers.whyNow)),
    readiness: lookup(POINTS.readiness, str(answers.readiness)),
    income: lookup(POINTS.income, str(answers.income)),
  };

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown };
}

/**
 * Hard gates. DOKŁADNIE dwie, zgodnie z briefem kwalifikacyjnym (sekcja 27):
 * płeć i dochód. Żadna inna odpowiedź nie blokuje automatycznie — reszta
 * trafia do capów albo progu punktowego, nigdy do twardego odrzucenia.
 * Zwracany powód służy wyłącznie audytowi — użytkownik go nie zobaczy.
 *
 * Poprzednia wersja dokładała tu trzecią bramkę na `readiness === "browsing"`
 * (dziedziczoną po starym process:no/decision:not_ready) — w praktyce
 * odrzucała niemal wszystkich i została cofnięta 2026-08-17. "Browsing"
 * zostaje capem niżej, nie twardym stopem.
 */
function findHardGate(answers: Answers): string | null {
  if (str(answers.gender) === "female") return "gender";
  if (str(answers.income) === "lt_15k") return "income_below_threshold";
  return null;
}

/** Capy Manual Review. Blokują automatyczny Calendly nawet przy 100 pkt. */
function findCaps(answers: Answers): string[] {
  const caps: string[] = [];
  if (str(answers.age) === "under_30") caps.push("age_under_30");
  if (str(answers.income) === "15_20k") caps.push("income_15_20k");
  if (str(answers.readiness) === "analyzing") caps.push("readiness_analyzing");
  if (str(answers.readiness) === "browsing") caps.push("readiness_browsing");
  return caps;
}

/**
 * Pełna ocena aplikacji — te same progi co w v1.0:
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
