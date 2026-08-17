import { describe, expect, it } from "vitest";
import { validateApplication } from "./validation";

/** Komplet poprawnych odpowiedzi — baza do testowania pojedynczych naruszeń. */
const valid = {
  age: "30_39",
  role: "owner",
  workMode: "variable",
  controlArea: "combo",
  duration: "1_3y",
  attempts: ["solo_training", "diet_app"],
  whyFailed: "Brakowało mi systemu dopasowanego do zmiennego grafiku, nie kolejnej diety.",
  blocker: "no_plan",
  goal: "Chcę wreszcie uporządkować sen i regularność, bo kolejny kwartał tak nie może wyglądać.",
  whyNow: "tired_of_waiting",
  readiness: "ready_now",
  gender: "male",
  income: "30_50k",
  name: { first: "Krystian", last: "Ćwik" },
  email: "  Krystian.Cwik@Example.COM ",
  phone: "601 234 567",
};

describe("walidacja aplikacji", () => {
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

  it("wymaga potwierdzenia prywatności", () => {
    expect(validateApplication(valid, false).errors.consent).toBeDefined();
    expect(validateApplication(valid, undefined).ok).toBe(false);
  });

  it("odrzuca wartość spoza listy opcji", () => {
    const r = validateApplication({ ...valid, income: "gte_500k" }, true);
    expect(r.errors.income).toBeDefined();
  });
});

describe("wcześniejsze próby — wielokrotny wybór", () => {
  it("„Nic konkretnego” nie łączy się z innymi", () => {
    const r = validateApplication({ ...valid, attempts: ["none", "diet_app"] }, true);
    expect(r.errors.attempts).toBeDefined();
  });

  it("puste zaznaczenie jest błędem", () => {
    expect(validateApplication({ ...valid, attempts: [] }, true).errors.attempts).toBeDefined();
  });

  it("samo „Nic konkretnego” jest poprawne", () => {
    expect(validateApplication({ ...valid, attempts: ["none"] }, true).ok).toBe(true);
  });

  it("dowolna liczba wybranych metod jest poprawna (brak limitu)", () => {
    const r = validateApplication(
      { ...valid, attempts: ["solo_training", "diet_app", "personal_trainer", "online_coaching"] },
      true,
    );
    expect(r.errors.attempts).toBeUndefined();
  });
});

describe("pole „Coś innego” przy pytaniach z reveal", () => {
  it("wymaga opisu 2–120 znaków dla role", () => {
    expect(validateApplication({ ...valid, role: "other", roleOther: "a" }, true).errors.role).toBeDefined();
    expect(
      validateApplication({ ...valid, role: "other", roleOther: "x".repeat(121) }, true).errors.role,
    ).toBeDefined();
  });

  it("akceptuje poprawny opis dla role", () => {
    const r = validateApplication({ ...valid, role: "other", roleOther: "Wolny strzelec, duże kontrakty" }, true);
    expect(r.ok).toBe(true);
  });

  it("nie wymaga opisu, gdy wybrano inną opcję niż „Inna sytuacja”", () => {
    expect(validateApplication({ ...valid, role: "owner", roleOther: "" }, true).ok).toBe(true);
  });

  it("wymaga opisu dla blocker i whyNow, gdy wybrano „Coś innego”", () => {
    expect(
      validateApplication({ ...valid, blocker: "other", blockerOther: "" }, true).errors.blocker,
    ).toBeDefined();
    expect(
      validateApplication({ ...valid, whyNow: "other", whyNowOther: "" }, true).errors.whyNow,
    ).toBeDefined();
    expect(
      validateApplication({ ...valid, blocker: "other", blockerOther: "Nieregularne zlecenia" }, true).ok,
    ).toBe(true);
  });
});

describe("pytania otwarte i dane kontaktowe", () => {
  it("whyFailed poniżej 20 znaków jest odrzucane", () => {
    expect(validateApplication({ ...valid, whyFailed: "za krótko" }, true).errors.whyFailed).toBeDefined();
  });

  it("goal powyżej 800 znaków jest odrzucane", () => {
    expect(validateApplication({ ...valid, goal: "x".repeat(801) }, true).errors.goal).toBeDefined();
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
