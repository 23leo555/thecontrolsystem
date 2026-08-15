import { QUESTIONS, type Answers, type QuestionId } from "./questions";
import { isValidEmail, normalizeEmail, toE164 } from "@/lib/validation";

/**
 * Walidacja odpowiedzi aplikacji — sekcje U i W1.
 *
 * Uruchamiana PO STRONIE SERWERA przed scoringiem (V1). Klient może mieć
 * własną walidację dla UX, ale jej wynik nie jest przyjmowany na wiarę (W3).
 */

export interface ValidationResult {
  ok: boolean;
  /** Błędy per pytanie — komunikaty pokazywane inline i w podsumowaniu dla czytnika (W1). */
  errors: Partial<Record<QuestionId | "consent", string>>;
  /** Odpowiedzi po normalizacji (e-mail, telefon, przycięte białe znaki). */
  normalized: Answers;
}

const optionValues = (id: QuestionId): string[] =>
  QUESTIONS.find((q) => q.id === id)?.options?.map((o) => o.value) ?? [];

function validateSingle(id: QuestionId, value: unknown, errors: ValidationResult["errors"]): string | undefined {
  if (typeof value !== "string" || !value) {
    errors[id] = "Wybierz jedną odpowiedź.";
    return undefined;
  }
  if (!optionValues(id).includes(value)) {
    errors[id] = "Nieprawidłowa odpowiedź.";
    return undefined;
  }
  return value;
}

export function validateApplication(raw: unknown, consent: unknown): ValidationResult {
  const errors: ValidationResult["errors"] = {};
  const normalized: Answers = {};
  const input = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  // --- U1, U2, U4, U6, U7, U8, U9, U10, U11: pojedynczy wybór ---
  for (const id of [
    "age",
    "role",
    "goal",
    "duration",
    "attempts",
    "urgency",
    "process",
    "decision",
    "income",
  ] as const) {
    const v = validateSingle(id, input[id], errors);
    if (v) normalized[id] = v;
  }

  // --- U2: „Inna sytuacja" wymaga pola tekstowego 3-120 znaków (W1) ---
  if (normalized.role === "other") {
    const other = typeof input.roleOther === "string" ? input.roleOther.trim() : "";
    if (other.length < 3 || other.length > 120) {
      errors.role = "Opisz swoją sytuację w 3–120 znakach.";
    } else {
      (normalized as Record<string, unknown>).roleOther = other;
    }
  }

  // --- U3: 1-3 zaznaczenia, „Żaden" wyklucza pozostałe ---
  const env = Array.isArray(input.environment) ? input.environment.filter((x) => typeof x === "string") : [];
  const envAllowed = optionValues("environment");
  if (env.length === 0) {
    errors.environment = "Wybierz od jednego do trzech elementów.";
  } else if (env.some((e) => !envAllowed.includes(e as string))) {
    errors.environment = "Nieprawidłowa odpowiedź.";
  } else if (env.includes("none") && env.length > 1) {
    errors.environment = "Odpowiedź „Żaden z powyższych” nie łączy się z innymi.";
  } else if (env.length > 3) {
    errors.environment = "Możesz wybrać maksymalnie trzy elementy.";
  } else {
    normalized.environment = env as string[];
  }

  // --- U5: skala 1-5 ---
  const impact = typeof input.impact === "string" ? input.impact : String(input.impact ?? "");
  if (!["1", "2", "3", "4", "5"].includes(impact)) {
    errors.impact = "Wybierz wartość od 1 do 5.";
  } else {
    normalized.impact = impact;
  }

  // --- U12: 30-800 znaków, bez automatycznej oceny treści ---
  const motivation = typeof input.motivation === "string" ? input.motivation.trim() : "";
  if (motivation.length < 30) {
    errors.motivation = "Napisz co najmniej 30 znaków.";
  } else if (motivation.length > 800) {
    errors.motivation = "Maksymalnie 800 znaków.";
  } else {
    normalized.motivation = motivation;
  }

  // --- U13: imię i nazwisko, Unicode 2-60 znaków każde ---
  const nameInput = (typeof input.name === "object" && input.name !== null ? input.name : {}) as Record<string, unknown>;
  const first = typeof nameInput.first === "string" ? nameInput.first.trim() : "";
  const last = typeof nameInput.last === "string" ? nameInput.last.trim() : "";
  // Dopuszczamy spacje, łączniki i apostrofy — nazwiska dwuczłonowe są normalne.
  const namePattern = /^[\p{L}][\p{L}\s'’-]{1,59}$/u;
  if (!namePattern.test(first)) {
    errors.name = "Podaj imię (2–60 znaków).";
  } else if (!namePattern.test(last)) {
    errors.name = "Podaj nazwisko (2–60 znaków).";
  } else {
    normalized.name = { first, last };
  }

  // --- U14: e-mail, walidacja klient + serwer ---
  const emailRaw = typeof input.email === "string" ? input.email.trim() : "";
  if (emailRaw.length > 254 || !isValidEmail(emailRaw)) {
    errors.email = "Podaj poprawny adres e-mail.";
  } else {
    normalized.email = normalizeEmail(emailRaw);
  }

  // --- U15: telefon w E.164, domyślny prefiks +48 ---
  const phoneRaw = typeof input.phone === "string" ? input.phone.trim() : "";
  const e164 = phoneRaw ? toE164(phoneRaw) : null;
  if (!e164) {
    errors.phone = "Podaj poprawny numer telefonu.";
  } else {
    normalized.phone = e164;
  }

  // --- U16: wymagane potwierdzenie prywatności; brak zgody marketingowej ---
  if (consent !== true) {
    errors.consent = "Potwierdzenie jest wymagane, żeby wysłać aplikację.";
  }

  return { ok: Object.keys(errors).length === 0, errors, normalized };
}
