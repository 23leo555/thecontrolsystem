"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { track, touchForSubmission } from "@/lib/analytics";
import { isValidEmail, isValidFirstName, toE164 } from "@/lib/validation";
import { site } from "@/lib/site";
import { resetCopy } from "@/content/reset";

const c = resetCopy.form;

/**
 * Formularz odbioru Protokołu (brief sekcje 7 i 8).
 *
 * Zasady, których nie wolno rozluźnić:
 * - trzy pola: imię, email i telefon (telefon obowiązkowy od 2026-08-15,
 *   decyzja właściciela; brief V2 sekcja 7 przewidywał tylko dwa),
 * - zgody są OSOBNE dla kanału e-mail i telefonicznego, domyślnie niezaznaczone,
 *   a brak którejkolwiek nie blokuje wysyłki Protokołu (PKE art. 398 wymaga
 *   uprzedniej zgody na kontakt telefoniczny — sam podany numer nią nie jest),
 * - nie ma checkboxa „akceptuję politykę prywatności" — polityka jest
 *   informacją, nie umową wymagającą zgody,
 * - błąd nie kasuje wpisanych danych,
 * - podwójne kliknięcie nie tworzy dwóch leadów.
 */
export function ResetForm({ formId }: { formId: string }) {
  const router = useRouter();
  const uid = useId();
  const nameId = `${uid}-name`;
  const emailId = `${uid}-email`;
  const phoneId = `${uid}-phone`;

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [touched, setTouched] = useState<{ firstName?: boolean; email?: boolean; phone?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const inFlight = useRef(false);
  const started = useRef(false);

  const nameValid = isValidFirstName(firstName);
  const emailValid = isValidEmail(email);
  // Ta sama normalizacja co po stronie serwera — użytkownik może wpisać numer
  // ze spacjami, z zerem albo z prefiksem, a i tak zapiszemy go w E.164.
  const phoneValid = toE164(phone) !== null;
  const canSubmit = nameValid && emailValid && phoneValid && !submitting;

  /** reset_form_start — pierwszy focus w formularzu, raz na sesję widoku. */
  function onFirstFocus() {
    if (started.current) return;
    started.current = true;
    track("reset_form_start", { form_id: formId });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ firstName: true, email: true, phone: true });
    if (!canSubmit || inFlight.current) return; // blokada podwójnego kliknięcia

    inFlight.current = true;
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email,
          phone,
          marketingConsent,
          phoneConsent,
          consentVersion: site.consentVersion,
          phoneConsentVersion: site.phoneConsentVersion,
          // Źródło z utrwalonego first-touch — przetrwa przejście przez podstrony.
          source: touchForSubmission(),
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };

      if (!res.ok || !data.ok) {
        // Dane w formularzu zostają — użytkownik poprawia i próbuje ponownie.
        track("reset_form_error", { form_id: formId, status: res.status });
        setFormError(data.error ?? "Coś poszło nie tak. Spróbuj ponownie.");
        return;
      }

      track("reset_form_submit", { form_id: formId, marketing_consent: marketingConsent });
      router.push(site.routes.resetThanks);
    } catch {
      track("reset_form_error", { form_id: formId, status: "network" });
      setFormError("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  const fieldClass =
    "min-h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-text-primary " +
    "placeholder:text-text-secondary/60 transition-colors duration-step " +
    "hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none " +
    "focus-visible:shadow-gold-focus";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" onFocus={onFirstFocus}>
      <div>
        <label htmlFor={nameId} className="mb-1.5 block text-sm font-semibold">
          {c.firstNameLabel}
        </label>
        <input
          id={nameId}
          name="firstName"
          type="text"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
          aria-invalid={touched.firstName && !nameValid ? true : undefined}
          aria-describedby={touched.firstName && !nameValid ? `${nameId}-error` : undefined}
          className={fieldClass}
          placeholder={c.firstNamePlaceholder}
        />
        {touched.firstName && !nameValid && (
          // Błąd opisany tekstem, nie samym kolorem (brief sekcja 23).
          <p id={`${nameId}-error`} className="mt-1.5 text-sm text-danger">
            {c.firstNameError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={emailId} className="mb-1.5 block text-sm font-semibold">
          {c.emailLabel}
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          aria-invalid={touched.email && !emailValid ? true : undefined}
          aria-describedby={touched.email && !emailValid ? `${emailId}-error` : undefined}
          className={fieldClass}
          placeholder={c.emailPlaceholder}
        />
        {touched.email && !emailValid && (
          <p id={`${emailId}-error`} className="mt-1.5 text-sm text-danger">
            {c.emailError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={phoneId} className="mb-1.5 block text-sm font-semibold">
          {c.phoneLabel}
        </label>
        <input
          id={phoneId}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          aria-invalid={touched.phone && !phoneValid ? true : undefined}
          aria-describedby={touched.phone && !phoneValid ? `${phoneId}-error` : undefined}
          className={fieldClass}
          placeholder={c.phonePlaceholder}
        />
        {touched.phone && !phoneValid ? (
          <p id={`${phoneId}-error`} className="mt-1.5 text-sm text-danger">
            {c.phoneError}
          </p>
        ) : (
          <p className="mt-1.5 text-[0.75rem] leading-relaxed text-text-secondary/80">
            {c.phoneHelp}
          </p>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-text-primary"
        >
          {formError}
        </p>
      )}

      <Button type="submit" size="cta" disabled={!canSubmit} loading={submitting} className="w-full">
        {submitting ? c.ctaLoading : c.cta}
      </Button>

      {/* Zgody — osobne per kanał, opcjonalne, domyślnie niezaznaczone.
          Jeden wspólny checkbox „na wszystko" jest wprost zakazany. */}
      <label className="flex cursor-pointer items-start gap-3 pt-1 text-[0.8125rem] leading-relaxed text-text-secondary">
        <input
          type="checkbox"
          name="marketingConsent"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#4f76ff]"
        />
        <span>{c.marketingConsent}</span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-[0.8125rem] leading-relaxed text-text-secondary">
        <input
          type="checkbox"
          name="phoneConsent"
          checked={phoneConsent}
          onChange={(e) => setPhoneConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#4f76ff]"
        />
        <span>{c.phoneConsent}</span>
      </label>

      {/* Klauzula informacyjna — informacja, nie zgoda (brief sekcja 8). */}
      <p className="text-[0.6875rem] leading-relaxed text-text-secondary/80">
        {c.legalNotice}{" "}
        <Link
          href={site.routes.privacy}
          className="text-primary-glow underline underline-offset-2 hover:text-primary"
        >
          {c.legalNoticeLinkLabel}
        </Link>
        .
      </p>
    </form>
  );
}
