import { describe, expect, it } from "vitest";
import { calculateScore, evaluate, MAX_SCORE } from "./scoring";
import type { Answers } from "./questions";

/** Profil idealny: maksimum punktów w każdej kategorii, bez capów i hard gate'ów. */
const perfect: Answers = {
  age: "30_39", // 10
  role: "owner", // 8
  environment: ["long_days", "travel"], // 5
  goal: "waist", // 7
  impact: "5", // 10
  duration: "gt_3y", // 5
  attempts: "many", // 5
  urgency: "14d", // 10
  process: "yes", // 15
  decision: "self", // 5
  income: "gte_50k", // 20
  motivation: "x".repeat(50),
};

describe("tabela punktowa (V2)", () => {
  it("profil idealny daje dokładnie 100 punktów", () => {
    expect(calculateScore(perfect).score).toBe(MAX_SCORE);
  });

  it("suma maksimów z każdej kategorii nie przekracza 100", () => {
    const { breakdown } = calculateScore(perfect);
    expect(Object.values(breakdown).reduce((a, b) => a + b, 0)).toBe(MAX_SCORE);
  });

  it("U3 punktuje 5 za jakikolwiek element nieregularności i 1 za „żaden”", () => {
    expect(calculateScore({ ...perfect, environment: ["stress"] }).breakdown.environment).toBe(5);
    expect(calculateScore({ ...perfect, environment: ["none"] }).breakdown.environment).toBe(1);
  });

  it("brak odpowiedzi daje 0 punktów, nie wyjątek", () => {
    expect(calculateScore({}).score).toBe(0);
  });
});

describe("hard gates (W2) — wygrywają z punktami (V4)", () => {
  const cases: [string, Answers, string][] = [
    ["wiek poniżej 23", { ...perfect, age: "under_23" }, "age_under_23"],
    ["dochód poniżej progu", { ...perfect, income: "lt_15k" }, "income_below_threshold"],
    ["brak gotowości na proces", { ...perfect, process: "no" }, "process_not_ready"],
    ["brak gotowości decyzyjnej", { ...perfect, decision: "not_ready" }, "decision_not_ready"],
  ];

  for (const [name, answers, reason] of cases) {
    it(`${name} → NOT_QUALIFIED niezależnie od reszty`, () => {
      const r = evaluate(answers);
      expect(r.status).toBe("NOT_QUALIFIED");
      expect(r.hardGate).toBe(reason);
    });
  }
});

describe("capy Manual Review (V4)", () => {
  it("cap blokuje QUALIFIED nawet przy bardzo wysokim wyniku", () => {
    // 23-29 lat: cap + tylko 5 pkt za wiek zamiast 10.
    const r = evaluate({ ...perfect, age: "23_29" });
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.status).toBe("MANUAL_REVIEW");
    expect(r.caps).toContain("age_23_29");
  });

  it("niepewna logistyka spotkań to cap, nie odrzucenie", () => {
    const r = evaluate({ ...perfect, process: "logistics_uncertain" });
    expect(r.status).toBe("MANUAL_REVIEW");
    expect(r.hardGate).toBeNull();
  });

  it("konieczność uzyskania zgody to cap, nie odrzucenie", () => {
    const r = evaluate({ ...perfect, decision: "needs_approval" });
    expect(r.status).toBe("MANUAL_REVIEW");
  });

  it("dochód 15-20k to cap, mimo 10 punktów", () => {
    const r = evaluate({ ...perfect, income: "15_20k" });
    expect(r.status).toBe("MANUAL_REVIEW");
    expect(r.caps).toContain("income_15_20k");
  });
});

describe("progi (V3)", () => {
  it("czysty profil >= 70 daje QUALIFIED", () => {
    const r = evaluate(perfect);
    expect(r.score).toBe(100);
    expect(r.status).toBe("QUALIFIED");
    expect(r.caps).toEqual([]);
  });

  it("wynik 50-69 bez capu daje MANUAL_REVIEW", () => {
    // 10+2+5+1+2+5+1+5+15+5+18 = 69 — tuż pod progiem QUALIFIED, bez capów.
    const r = evaluate({
      ...perfect,
      role: "other",
      goal: "unsure",
      impact: "2",
      attempts: "none",
      urgency: "1_3m",
      income: "20_30k",
    });
    expect(r.score).toBeGreaterThanOrEqual(50);
    expect(r.score).toBeLessThan(70);
    expect(r.status).toBe("MANUAL_REVIEW");
  });

  it("wynik poniżej 50 daje NOT_QUALIFIED nawet bez hard gate'a", () => {
    // 10+2+1+1+0+1+1+0+8+5+18 = 47.
    const r = evaluate({
      ...perfect,
      role: "other",
      environment: ["none"],
      goal: "unsure",
      impact: "1",
      duration: "lt_3m",
      attempts: "none",
      urgency: "browsing",
      process: "logistics_uncertain",
      income: "20_30k",
    });
    expect(r.hardGate).toBeNull();
    expect(r.score).toBeLessThan(50);
    // Próg punktowy wygrywa nad capem: cap sam w sobie nie ratuje przed odrzuceniem.
    expect(r.caps).toContain("process_logistics_uncertain");
    expect(r.status).toBe("NOT_QUALIFIED");
  });
});

describe("bezpieczeństwo biznesowe (W3)", () => {
  it("wynik zawiera ślad audytowy, ale to wywołujący decyduje, co ujawnić", () => {
    const r = evaluate(perfect);
    expect(r.version).toBe("tcs-v1.0");
    expect(Object.keys(r.breakdown)).toContain("income");
  });
});
