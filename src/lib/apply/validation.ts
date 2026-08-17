import { QUESTIONS, type Answers, type QuestionId } from "./questions";
import { isValidEmail, normalizeEmail, toE164 } from "@/lib/validation";

/**
 * Walidacja odpowiedzi aplikacji — druga generacja pytań (2026-08-16).
 *
 * Uruchamiana PO STRONIE SERWERA przed scoringiem. Klient ma własną walidację
 * dla UX, ale jej wynik nie jest przyjmowany na wiarę.
 */

export interface ValidationResult {
  ok: boolean;
  /** Błędy per pytanie — komunikaty pokazywane inline i w podsumowaniu dla czytnika. */
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

/** Pytania single-select z opcją „Coś innego" / „Inna sytuacja" odsłaniającą pole tekstowe. */
const REVEALS_OTHER: QuestionId[] = ["role", "blocker", "whyNow"];

export function validateApplication(raw: unknown, consent: unknown): ValidationResult {
  const errors: ValidationResult["errors"] = {};
  const normalized: Answers = {};
  const input = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  // --- Pytania jednokrotnego wyboru ---
  for (const id of [
    "age",
    "role",
    "workMode",
    "controlArea",
    "duration",
    "blocker",
    "whyNow",
    "readiness",
    "gender",
    "income",
  ] as const) {
    const v = validateSingle(id, input[id], errors);
    if (v) normalized[id] = v;
  }

  // --- Reveal pola „Coś innego" — 2-120 znaków, klucz w body to `${id}Other` ---
  for (const id of REVEALS_OTHER) {
    if (normalized[id] === "other") {
      const key = `${id}Other`;
      const other = typeof input[key] === "string" ? (input[key] as string).trim() : "";
      if (other.length < 2 || other.length > 120) {
        errors[id] = "Opisz krótko w 2–120 znakach.";
      } else {
        (normalized as Record<string, unknown>)[key] = other;
      }
    }
  }

  // --- Wcześniejsze próby: multi-select, „Nic konkretnego" wyklucza pozostałe ---
  const attempts = Array.isArray(input.attempts) ? input.attempts.filter((x) => typeof x === "string") : [];
  const attemptsAllowed = optionValues("attempts");
  if (attempts.length === 0) {
    errors.attempts = "Zaznacz przynajmniej jedną odpowiedź.";
  } else if (attempts.some((a) => !attemptsAllowed.includes(a as string))) {
    errors.attempts = "Nieprawidłowa odpowiedź.";
  } else if (attempts.includes("none") && attempts.length > 1) {
    errors.attempts = "Odpowiedź „Nic konkretnego” nie łączy się z innymi.";
  } else {
    normalized.attempts = attempts as string[];
  }

  // --- Dwa pytania otwarte: 20-800 znaków, bez automatycznej oceny treści ---
  for (const id of ["whyFailed", "goal"] as const) {
    const text = typeof input[id] === "string" ? (input[id] as string).trim() : "";
    if (text.length < 20) {
      errors[id] = "Napisz co najmniej 20 znaków.";
    } else if (text.length > 800) {
      errors[id] = "Maksymalnie 800 znaków.";
    } else {
      normalized[id] = text;
    }
  }

  // --- Imię i nazwisko, Unicode 2-60 znaków każde ---
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

  // --- E-mail, walidacja klient + serwer ---
  const emailRaw = typeof input.email === "string" ? input.email.trim() : "";
  if (emailRaw.length > 254 || !isValidEmail(emailRaw)) {
    errors.email = "Podaj poprawny adres e-mail.";
  } else {
    normalized.email = normalizeEmail(emailRaw);
  }

  // --- Telefon w E.164, domyślny prefiks +48 ---
  const phoneRaw = typeof input.phone === "string" ? input.phone.trim() : "";
  const e164 = phoneRaw ? toE164(phoneRaw) : null;
  if (!e164) {
    errors.phone = "Podaj poprawny numer telefonu.";
  } else {
    normalized.phone = e164;
  }

  // --- Wymagane potwierdzenie prywatności ---
  if (consent !== true) {
    errors.consent = "Potwierdzenie jest wymagane, żeby wysłać aplikację.";
  }

  return { ok: Object.keys(errors).length === 0, errors, normalized };
}
