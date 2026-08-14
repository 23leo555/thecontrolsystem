import { describe, it, expect } from "vitest";
import { evaluate, type ScoringConfig } from "@/lib/scoring";
import type { Answers } from "@/lib/questions";

const GATE_OFF: ScoringConfig = { maleOnlyGate: false };
const GATE_ON: ScoringConfig = { maleOnlyGate: true };

/** Bazowy „idealny” mężczyzna — poszczególne testy nadpisują wybrane pola. */
function base(overrides: Answers = {}): Answers {
  return {
    q1: "self_male",
    q2: "age_40_49",
    q3: "owner",
    q4: ["brzuch"],
    q5: 10,
    q6: "gt_3y",
    q7: "Chcę odzyskać kontrolę nad energią i sylwetką w 90 dni.",
    q8: ["trener_personalny", "dietetyk", "badania", "suplementacja"],
    q9: "teraz",
    q10: 10,
    q11: "k_30_49",
    q12: "gotowy_po_ocenie",
    ...overrides,
  };
}

describe("Testy akceptacyjne T01–T20 (sekcja 24)", () => {
  it("T01: mężczyzna 35, dochód 30–49k, teraz, gotowość 10, premium gotowy → A", () => {
    const r = evaluate(base({ q2: "age_30_39" }), GATE_OFF);
    expect(r.status).toBe("A");
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.hardRuleReason).toBeNull();
    expect(r.capReason).toBeNull();
  });

  it("T02: mężczyzna 27, mocny score → B przez age cap", () => {
    const r = evaluate(base({ q2: "age_23_29", q11: "k_50_plus" }), GATE_OFF);
    expect(r.status).toBe("B");
    expect(r.capReason).toBe("age_23_29");
  });

  it("T03: dochód poniżej 15k, reszta idealna → C przez income hard rule", () => {
    const r = evaluate(base({ q11: "lt_15k" }), GATE_OFF);
    expect(r.status).toBe("C");
    expect(r.hardRuleReason).toBe("income_below_15k");
  });

  it("T04: gotowość 3 → C przez readiness hard rule", () => {
    const r = evaluate(base({ q10: 3 }), GATE_OFF);
    expect(r.status).toBe("C");
    expect(r.hardRuleReason).toBe("readiness_1_4");
  });

  it("T05: start Tylko sprawdzam → C", () => {
    const r = evaluate(base({ q9: "tylko_sprawdzam" }), GATE_OFF);
    expect(r.status).toBe("C");
    expect(r.hardRuleReason).toBe("start_only_checking");
  });

  it("T06: premium darmowe materiały → C", () => {
    const r = evaluate(base({ q12: "darmowe" }), GATE_OFF);
    expect(r.status).toBe("C");
    expect(r.hardRuleReason).toBe("seeking_free");
  });

  it("T07: dochód 15–19 999, wysoki score → B przez income cap", () => {
    const r = evaluate(base({ q11: "k_15_19" }), GATE_OFF);
    expect(r.status).toBe("B");
    expect(r.capReason).toBe("income_15_19");
  });

  it("T08: start 2–3 miesiące → B przez start cap", () => {
    const r = evaluate(base({ q9: "mies_2_3" }), GATE_OFF);
    expect(r.status).toBe("B");
    expect(r.capReason).toBe("start_2_3_months");
  });

  it("T09: gotowość 7 → B przez readiness cap", () => {
    const r = evaluate(base({ q10: 7 }), GATE_OFF);
    expect(r.status).toBe("B");
    expect(r.capReason).toBe("readiness_5_7");
  });

  it("T10: brak hard rules, score 49 → C", () => {
    const answers = base({
      q3: "other", q5: 6, q6: "lt_3m", q8: ["nic_konkretnego"],
      q9: "dni_30", q10: 5, q11: "k_15_19", q12: "otwarty_zrozumiec",
    });
    const r = evaluate(answers, GATE_OFF);
    expect(r.score).toBe(49);
    expect(r.status).toBe("C");
    expect(r.hardRuleReason).toBe("score_below_50");
  });

  it("T11: brak hard rules, score 60 → B", () => {
    const answers = base({
      q3: "other", q5: 8, q6: "gt_3y", q8: ["dietetyk", "badania"],
      q9: "dni_30", q10: 6, q11: "k_15_19", q12: "otwarty_zrozumiec",
    });
    const r = evaluate(answers, GATE_OFF);
    expect(r.score).toBe(60);
    expect(r.status).toBe("B");
  });

  it("T20: kobieta z male_only_gate ON → C", () => {
    const r = evaluate(base({ q1: "self_female" }), GATE_ON);
    expect(r.status).toBe("C");
    expect(r.hardRuleReason).toBe("male_only_gate");
  });

  it("T20b: kobieta z male_only_gate OFF → brak automatycznego C z tytułu płci", () => {
    const r = evaluate(base({ q1: "self_female" }), GATE_OFF);
    expect(r.hardRuleReason).not.toBe("male_only_gate");
    expect(r.status).toBe("A"); // reszta odpowiedzi idealna
  });

  it("Max score = 100 przy idealnych odpowiedziach premium/dochód 50k", () => {
    const r = evaluate(base({ q11: "k_50_plus" }), GATE_OFF);
    expect(r.score).toBe(100);
  });
});
