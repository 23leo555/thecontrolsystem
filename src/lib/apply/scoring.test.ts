import { describe, expect, it } from "vitest";
import { calculateScore, evaluate, MAX_SCORE } from "./scoring";
import type { Answers } from "./questions";

/** Profil idealny: maksimum punktów w każdej kategorii, bez capów i hard gate'ów. */
const perfect: Answers = {
  age: "30_39", // 10
  role: "owner", // 10
  workMode: "variable", // 8
  controlArea: "combo", // 10
  duration: "gt_3y", // 5
  attempts: ["solo_training", "diet_app", "personal_trainer"], // 3+ elementy = 5
  whyFailed: "x".repeat(30),
  blocker: "no_plan", // 5
  goal: "x".repeat(30),
  whyNow: "tired_of_waiting", // 12
  readiness: "ready_now", // 15
  gender: "male",
  income: "gte_50k", // 20
};

describe("tabela punktowa v2", () => {
  it("profil idealny daje dokładnie 100 punktów", () => {
    expect(calculateScore(perfect).score).toBe(MAX_SCORE);
  });

  it("suma maksimów z każdej kategorii nie przekracza 100", () => {
    const { breakdown } = calculateScore(perfect);
    expect(Object.values(breakdown).reduce((a, b) => a + b, 0)).toBe(MAX_SCORE);
  });

  it("attempts punktuje więcej metod wyżej, a „nic konkretnego” daje 1 pkt", () => {
    expect(calculateScore({ ...perfect, attempts: ["solo_training"] }).breakdown.attempts).toBe(3);
    expect(calculateScore({ ...perfect, attempts: ["none"] }).breakdown.attempts).toBe(1);
  });

  it("brak odpowiedzi daje 0 punktów, nie wyjątek", () => {
    expect(calculateScore({}).score).toBe(0);
  });
});

describe("hard gates — dokładnie dwie, wygrywają z punktami", () => {
  const cases: [string, Answers, string][] = [
    ["kobieta", { ...perfect, gender: "female" }, "gender"],
    ["dochód poniżej progu", { ...perfect, income: "lt_15k" }, "income_below_threshold"],
  ];

  for (const [name, answers, reason] of cases) {
    it(`${name} → NOT_QUALIFIED niezależnie od reszty`, () => {
      const r = evaluate(answers);
      expect(r.status).toBe("NOT_QUALIFIED");
      expect(r.hardGate).toBe(reason);
    });
  }
});

describe("dostęp do kalendarza — wyłącznie dwa warunki blokują (decyzja 2026-08-18)", () => {
  it("dochód 15-20k NIE blokuje kalendarza — tylko niższe punkty", () => {
    const r = evaluate({ ...perfect, income: "15_20k" });
    expect(r.caps).toEqual([]);
    expect(r.status).toBe("QUALIFIED");
  });

  it("wiek poniżej 30 NIE blokuje kalendarza — tylko niższe punkty", () => {
    const r = evaluate({ ...perfect, age: "under_30" });
    expect(r.caps).toEqual([]);
    expect(r.status).toBe("QUALIFIED");
  });

  it("„analizuję możliwości” NIE blokuje kalendarza — tylko niższe punkty", () => {
    const r = evaluate({ ...perfect, readiness: "analyzing" });
    expect(r.caps).toEqual([]);
    expect(r.status).toBe("QUALIFIED");
  });

  it("„tylko zbieram informacje” NIE blokuje kalendarza — tylko niższe punkty", () => {
    const r = evaluate({ ...perfect, readiness: "browsing" });
    expect(r.caps).toEqual([]);
    expect(r.status).toBe("QUALIFIED");
  });
});

describe("progi (QUALIFIED >= 55, obniżony 2026-08-19 z 70)", () => {
  it("czysty profil >= 55 daje QUALIFIED", () => {
    const r = evaluate(perfect);
    expect(r.score).toBe(100);
    expect(r.status).toBe("QUALIFIED");
    expect(r.caps).toEqual([]);
  });

  it("dochód 15-20k z przeciętną resztą odpowiedzi mieści się w progu QUALIFIED", () => {
    // To dokładnie przypadek, który wywołał obniżenie progu: 10 pkt za dochód
    // (zamiast 18-20 dla wyższych przedziałów) nie może już systemowo
    // zsuwać sensownego zgłoszenia pod próg.
    const r = evaluate({ ...perfect, income: "15_20k" });
    expect(r.score).toBeGreaterThanOrEqual(55);
    expect(r.status).toBe("QUALIFIED");
  });

  it("wynik 50-54 bez capu daje MANUAL_REVIEW", () => {
    // 10+2+2+6+1+1+3+9+8+10 = 52 — w przedziale, bez capów i bramek.
    const r = evaluate({
      ...perfect,
      role: "other",
      roleOther: "Konsultant niezależny",
      workMode: "stable",
      controlArea: "chaos",
      duration: "lt_6m",
      attempts: ["none"],
      blocker: "other",
      blockerOther: "Coś innego",
      whyNow: "other",
      whyNowOther: "Coś innego",
      readiness: "considering_soon",
      income: "15_20k",
    } as Answers);
    expect(r.score).toBeGreaterThanOrEqual(50);
    expect(r.score).toBeLessThan(55);
    expect(r.status).toBe("MANUAL_REVIEW");
    expect(r.hardGate).toBeNull();
  });

  it("wynik poniżej 50 daje NOT_QUALIFIED", () => {
    // 8+2+2+6+1+1+3+9+3+10 = 45.
    const r = evaluate({
      ...perfect,
      age: "60_plus",
      role: "other",
      roleOther: "Konsultant niezależny",
      workMode: "stable",
      controlArea: "chaos",
      duration: "lt_6m",
      attempts: ["none"],
      blocker: "other",
      blockerOther: "Coś innego",
      whyNow: "other",
      whyNowOther: "Coś innego",
      readiness: "analyzing",
      income: "15_20k",
    } as Answers);
    expect(r.hardGate).toBeNull();
    expect(r.caps).toEqual([]);
    expect(r.score).toBeLessThan(50);
    expect(r.status).toBe("NOT_QUALIFIED");
  });
});

describe("bezpieczeństwo biznesowe", () => {
  it("wynik zawiera ślad audytowy, ale to wywołujący decyduje, co ujawnić", () => {
    const r = evaluate(perfect);
    expect(r.version).toBe("tcs-v2.0");
    expect(Object.keys(r.breakdown)).toContain("income");
  });
});
