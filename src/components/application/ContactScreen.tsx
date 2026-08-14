"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/application/ApplicationFlow";
import { isValidEmail, isValidFirstName, toE164 } from "@/lib/validation";
import type { Answers } from "@/lib/questions";
import { site } from "@/lib/site";

/** Ekran danych kontaktowych — pojawia się po Q12, przed finalnym submit (sekcja 10). */
export function ContactScreen({
  answers,
  idempotencyKey,
  source,
  onBack,
  onSubmitted,
}: {
  answers: Answers;
  idempotencyKey: string;
  source: Record<string, string | undefined>;
  onBack: () => void;
  onSubmitted: (r: { status: "A" | "B" | "C"; callUrl?: string; firstName: string }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const nameValid = isValidFirstName(firstName);
  const emailValid = isValidEmail(email);
  const phoneValid = phone.trim() === "" || toE164(phone) !== null;
  const canSubmit = nameValid && emailValid && phoneValid && consent && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || inFlight.current) return;

    inFlight.current = true;
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/aplikacja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          firstName,
          email,
          phone: phone.trim() || undefined,
          consent,
          marketingConsent,
          idempotencyKey,
          source,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        status?: "A" | "B" | "C";
        callUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.status) {
        // Odpowiedzi i dane kontaktowe zostają — użytkownik może ponowić (sekcja 23).
        setFormError(data.error ?? "Nie udało się wysłać aplikacji. Spróbuj ponownie.");
        return;
      }
      onSubmitted({ status: data.status, callUrl: data.callUrl, firstName });
    } catch {
      setFormError("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div>
      <ProgressBar percent={100} />
      <p className="mt-6 text-sm text-text-secondary">Ostatni krok</p>

      <h1 className="mt-4 text-display-sm">Gdzie mam wysłać wynik?</h1>
      <p className="mt-3 text-sm text-text-secondary">
        Twoje odpowiedzi analizujemy dopiero po wysłaniu aplikacji.
      </p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <Field
          id="firstName"
          label="Imię"
          value={firstName}
          onChange={setFirstName}
          onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
          invalid={touched.firstName && !nameValid}
          error="Podaj imię — minimum 2 znaki."
          autoComplete="given-name"
          placeholder="Jak masz na imię?"
        />
        <Field
          id="email"
          label="Adres e-mail"
          type="email"
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          invalid={touched.email && !emailValid}
          error="Podaj poprawny adres e-mail."
          autoComplete="email"
          placeholder="twoj@email.pl"
        />
        <Field
          id="phone"
          label="Numer telefonu"
          type="tel"
          value={phone}
          onChange={setPhone}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          invalid={touched.phone && !phoneValid}
          error="Podaj poprawny numer (np. +48 601 234 567)."
          autoComplete="tel"
          placeholder="+48 601 234 567"
          hint="Z kodem kraju. Kontaktuję się telefonicznie tylko w uzasadnionych przypadkach."
        />

        <div className="space-y-3 pt-1">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[#c6a05a]"
            />
            <span>
              Wyrażam zgodę na przetwarzanie moich danych w celu rozpatrzenia aplikacji, zgodnie z{" "}
              <Link href={site.routes.privacy} className="text-gold underline">
                polityką prywatności
              </Link>
              . <span className="text-danger">*</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[#c6a05a]"
            />
            <span>Chcę otrzymywać dalsze materiały od The Control System (opcjonalnie).</span>
          </label>
        </div>

        {formError && (
          <p role="alert" className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm">
            {formError}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" disabled={!canSubmit} loading={submitting} className="flex-1">
            WYŚLIJ APLIKACJĘ
          </Button>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-text-secondary underline-offset-4 hover:text-text-primary hover:underline focus-visible:outline-none focus-visible:shadow-gold-focus"
          >
            Wstecz
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  invalid,
  error,
  type = "text",
  autoComplete,
  placeholder,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  invalid?: boolean;
  error: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
}) {
  const describedBy = invalid ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="min-h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-text-primary placeholder:text-text-secondary/50 focus-visible:outline-none focus-visible:shadow-gold-focus"
      />
      {invalid ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-xs text-text-secondary/70">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
