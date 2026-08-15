import { describe, expect, it } from "vitest";
import { validateApplication } from "./validation";

/** Komplet poprawnych odpowiedzi — baza do testowania pojedynczych naruszeń. */
const valid = {
  age: "30_39",
  role: "owner",
  environment: ["long_days", "travel"],
  goal: "waist",
  impact: "4",
  duration: "1_3y",
  attempts: "many",
  urgency: "14d",
  process: "yes",
  decision: "self",
  income: "30_50k",
  motivation: "Chcę wreszcie uporządkować sen i regularność, bo kolejny kwartał tak nie może wyglądać.",
  name: { first: "Krystian", last: "Ćwik" },
  email: "  Krystian.Cwik@Example.COM ",
  phone: "601 234 567",
};

describe("walidacja aplikacji (U, W1)", () => {
  it("przyjmuje komplet poprawnych odpowiedzi", () => {
    const r = validateApplication(valid, true);
    expect(r.errors).toEqual({});
    expect(r.ok).toBe(true);
  });

  it("normalizuje e-mail i telefon do postaci kanonicznej", () => {
    const r = validateApplication(valid, true);
    expect(r.normalized.email).toBe("krystian.cwik@example.com");
    expect(r.normalized.phone).toBe("+48601234567");
  });

  it("wymaga potwierdzenia prywatności (U16)", () => {
    expect(validateApplication(valid, false).errors.consent).toBeDefined();
    expect(validateApplication(valid, undefined).ok).toBe(false);
  });

  it("odrzuca wartość spoza listy opcji", () => {
    const r = validateApplication({ ...valid, income: "gte_500k" }, true);
    expect(r.errors.income).toBeDefined();
  });
});

describe("U3 — reguły wielokrotnego wyboru", () => {
  it("„Żaden z powyższych” nie łączy się z innymi", () => {
    const r = validateApplication({ ...valid, environment: ["none", "travel"] }, true);
    expect(r.errors.environment).toBeDefined();
  });

  it("maksymalnie trzy zaznaczenia", () => {
    const r = validateApplication(
      { ...valid, environment: ["long_days", "travel", "stress", "family"] },
      true
    );
    expect(r.errors.environment).toBeDefined();
  });

  it("puste zaznaczenie jest błędem", () => {
    expect(validateApplication({ ...valid, environment: [] }, true).errors.environment).toBeDefined();
  });

  it("samo „Żaden” jest poprawne", () => {
    expect(validateApplication({ ...valid, environment: ["none"] }, true).ok).toBe(true);
  });
});

describe("U2 — pole tekstowe przy „Inna sytuacja” (W1)", () => {
  it("wymaga opisu 3–120 znaków", () => {
    expect(validateApplication({ ...valid, role: "other", roleOther: "ab" }, true).errors.role).toBeDefined();
    expect(
      validateApplication({ ...valid, role: "other", roleOther: "x".repeat(121) }, true).errors.role
    ).toBeDefined();
  });

  it("akceptuje poprawny opis", () => {
    const r = validateApplication({ ...valid, role: "other", roleOther: "Wolny strzelec, duże kontrakty" }, true);
    expect(r.ok).toBe(true);
  });

  it("nie wymaga opisu, gdy wybrano inną opcję niż „Inna sytuacja”", () => {
    expect(validateApplication({ ...valid, role: "owner", roleOther: "" }, true).ok).toBe(true);
  });
});

describe("U12–U15 — pola tekstowe i kontaktowe", () => {
  it("motywacja poniżej 30 znaków jest odrzucana", () => {
    expect(validateApplication({ ...valid, motivation: "za krótko" }, true).errors.motivation).toBeDefined();
  });

  it("motywacja powyżej 800 znaków jest odrzucana", () => {
    expect(
      validateApplication({ ...valid, motivation: "x".repeat(801) }, true).errors.motivation
    ).toBeDefined();
  });

  it("nazwisko z łącznikiem i apostrofem jest poprawne", () => {
    const r = validateApplication({ ...valid, name: { first: "Jan", last: "Kowalski-O’Brien" } }, true);
    expect(r.errors.name).toBeUndefined();
  });

  it("nazwisko z cyframi jest odrzucane", () => {
    const r = validateApplication({ ...valid, name: { first: "Jan", last: "Kowalski2" } }, true);
    expect(r.errors.name).toBeDefined();
  });

  it("niepoprawny e-mail jest odrzucany", () => {
    expect(validateApplication({ ...valid, email: "nie-email" }, true).errors.email).toBeDefined();
  });

  it("niepoprawny telefon jest odrzucany", () => {
    expect(validateApplication({ ...valid, phone: "123" }, true).errors.phone).toBeDefined();
  });
});
