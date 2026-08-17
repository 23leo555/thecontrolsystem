"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QUESTIONS, TOTAL_STEPS, type Answers, type QuestionId } from "@/lib/apply/questions";
import { applyIntro, applyReview } from "@/content/apply";
import { site } from "@/lib/site";
import { track } from "@/lib/analytics";
import { touchForSubmission } from "@/lib/analytics";

type Phase = "intro" | "questions" | "review" | "sending";

const FIELD =
  "w-full rounded-xl border border-tcs-border bg-tcs-surface px-4 py-3 text-[16px] text-tcs-text placeholder:text-tcs-text-muted/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue";

export function ApplyFlow() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  // Pole "Coś innego" / "Inna sytuacja" — jedno per pytanie z revealsTextField,
  // kluczowane po QuestionId (role, blocker, whyNow).
  const [extraText, setExtraText] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const applicationId = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  /** Klucz idempotencji — jeden na całe wypełnianie, żeby dubel kliknięcia nie tworzył duplikatu (W1). */
  const idempotencyKey = useRef<string>("");

  const question = QUESTIONS[index];

  /* --- Start: anonimowe application_id + zamrożenie źródła ruchu (T4) --- */
  const startApplication = useCallback(async () => {
    idempotencyKey.current = crypto.randomUUID();
    track("application_start");
    try {
      const res = await fetch("/api/apply/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: touchForSubmission() }),
      });
      if (res.ok) {
        const data = (await res.json()) as { applicationId?: string };
        applicationId.current = data.applicationId ?? null;
      }
    } catch {
      // Brak draftu nie może zablokować wypełniania — zapis ponowimy przy submit.
    }
    setPhase("questions");
  }, []);

  /* --- Focus na nagłówku kolejnego pytania (T3) --- */
  useEffect(() => {
    if (phase === "questions") headingRef.current?.focus();
  }, [index, phase]);

  const setAnswer = (id: QuestionId, value: Answers[QuestionId]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setError(null);
  };

  /** Walidacja po stronie klienta — wyłącznie dla UX. Wiążąca jest serwerowa (W3). */
  const validateCurrent = (): string | null => {
    const v = answers[question.id];
    switch (question.kind) {
      case "single": {
        if (typeof v !== "string") return "Wybierz jedną odpowiedź.";
        if (question.revealsTextField && v === question.revealsTextField) {
          const extra = extraText[question.id] ?? "";
          if (extra.trim().length < 2) return "Opisz krótko w kilku słowach.";
        }
        return null;
      }
      case "multi": {
        const arr = Array.isArray(v) ? v : [];
        if (arr.length === 0) return "Zaznacz przynajmniej jedną odpowiedź.";
        return null;
      }
      case "text": {
        const t = typeof v === "string" ? v.trim() : "";
        const min = question.minLength ?? 1;
        const max = question.maxLength ?? 800;
        if (t.length < min) return `Napisz co najmniej ${min} znaków.`;
        if (t.length > max) return `Maksymalnie ${max} znaków.`;
        return null;
      }
      case "name": {
        const n = v as { first?: string; last?: string } | undefined;
        if (!n?.first?.trim() || !n?.last?.trim()) return "Podaj imię i nazwisko.";
        return null;
      }
      case "email":
        return typeof v === "string" && /.+@.+\..+/.test(v) ? null : "Podaj poprawny adres e-mail.";
      case "phone":
        return typeof v === "string" && v.replace(/\D/g, "").length >= 9
          ? null
          : "Podaj poprawny numer telefonu.";
      default:
        return null;
    }
  };

  const saveDraft = useCallback(async () => {
    if (!applicationId.current) return;
    try {
      await fetch("/api/apply/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: applicationId.current, step: index + 1 }),
      });
    } catch {
      // Zapis draftu jest best-effort; nie blokuje użytkownika.
    }
  }, [index]);

  const next = async () => {
    const err = validateCurrent();
    if (err) {
      setError(err);
      return;
    }
    track("application_step_complete", { step: index + 1 });
    void saveDraft();
    if (index + 1 < TOTAL_STEPS) setIndex((i) => i + 1);
    else setPhase("review");
  };

  const back = () => {
    setError(null);
    if (index === 0) setPhase("intro");
    else setIndex((i) => i - 1);
  };

  const submit = async () => {
    if (!consent) {
      setServerErrors({ consent: "Potwierdzenie jest wymagane, żeby wysłać aplikację." });
      return;
    }
    setPhase("sending");
    setServerErrors({});
    track("application_submit");

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Wielokrotne kliknięcia nie tworzą duplikatów (W1).
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          applicationId: applicationId.current,
          // Pola "Coś innego" idą pod kluczem `${id}Other`, tak jak czyta je
          // walidacja serwerowa (validateApplication).
          answers: {
            ...answers,
            ...Object.fromEntries(Object.entries(extraText).map(([id, v]) => [`${id}Other`, v])),
          },
          consent,
          source: touchForSubmission(),
        }),
      });

      const data = (await res.json()) as { redirect?: string; errors?: Record<string, string> };

      if (!res.ok) {
        setServerErrors(data.errors ?? { form: "Nie udało się wysłać aplikacji. Spróbuj ponownie." });
        setPhase("review");
        return;
      }
      // Status NIE jest ujawniany w tej odpowiedzi — serwer zwraca podpisany link
      // do strony wyniku i to ona decyduje, co pokazać (X2, W3).
      if (data.redirect) window.location.assign(data.redirect);
    } catch {
      setServerErrors({ form: "Brak połączenia. Sprawdź sieć i spróbuj ponownie." });
      setPhase("review");
    }
  };

  /* ------------------------------------------------------------------ */

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16 sm:px-8 sm:py-24">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-xs">
          {applyIntro.eyebrow}
        </p>
        <h1 className="mt-4 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[38px]">
          {applyIntro.headline}
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-tcs-text-muted sm:text-[17px]">
          {applyIntro.supporting}
        </p>
        <button
          type="button"
          onClick={startApplication}
          className="mt-9 inline-flex min-h-[56px] w-full items-center justify-center rounded-[14px] bg-tcs-gold px-6 text-[14px] font-bold tracking-[0.04em] text-[#07090C] transition-colors hover:bg-tcs-gold-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue focus-visible:ring-offset-[3px] focus-visible:ring-offset-tcs-bg sm:w-auto sm:min-w-[280px] sm:text-[15px]"
        >
          {applyIntro.cta}
        </button>
        <p className="mt-6 text-[13px] leading-relaxed text-tcs-text-muted">{applyIntro.microcopy}</p>
      </div>
    );
  }

  if (phase === "review" || phase === "sending") {
    const summary = QUESTIONS.filter(
      (q) => q.id !== "income" && q.id !== "whyFailed" && q.id !== "goal",
    ).map((q) => {
      const v = answers[q.id];
      let text = "";
      if (q.kind === "name") {
        const n = v as { first?: string; last?: string };
        text = `${n?.first ?? ""} ${n?.last ?? ""}`.trim();
      } else if (Array.isArray(v)) {
        text = v.map((x) => q.options?.find((o) => o.value === x)?.label ?? x).join(", ");
      } else if (typeof v === "string") {
        text = q.options?.find((o) => o.value === v)?.label ?? v;
      }
      return { id: q.id, label: q.question, text };
    });

    return (
      <div className="mx-auto max-w-[640px] px-4 py-12 sm:px-8 sm:py-16">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-tcs-text sm:text-[32px]">
          {applyReview.headline}
        </h1>

        <dl className="mt-8 divide-y divide-tcs-border border-y border-tcs-border">
          {summary.map((s) => (
            <div key={s.id} className="py-3">
              <dt className="text-[12px] text-tcs-text-muted">{s.label}</dt>
              <dd className="mt-1 text-[15px] text-tcs-text">{s.text || "—"}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={() => {
            setPhase("questions");
            setIndex(0);
          }}
          className="mt-4 text-[14px] text-tcs-text-muted underline underline-offset-4 hover:text-tcs-text"
        >
          {applyReview.editLabel}
        </button>

        <label className="mt-8 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 rounded border-tcs-border bg-tcs-surface accent-tcs-gold"
          />
          <span className="text-[14px] leading-relaxed text-tcs-text-muted">
            {applyReview.consentLabel}{" "}
            <Link href={site.routes.privacy} className="underline underline-offset-4 hover:text-tcs-text">
              Polityka prywatności
            </Link>
          </span>
        </label>

        {(serverErrors.consent || serverErrors.form) && (
          <p role="alert" className="mt-3 text-[14px] text-tcs-error">
            {serverErrors.consent ?? serverErrors.form}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={phase === "sending"}
          className="mt-8 inline-flex min-h-[56px] w-full items-center justify-center rounded-[14px] bg-tcs-gold px-6 text-[14px] font-bold tracking-[0.04em] text-[#07090C] transition-colors hover:bg-tcs-gold-hover disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue focus-visible:ring-offset-[3px] focus-visible:ring-offset-tcs-bg sm:text-[15px]"
        >
          {phase === "sending" ? applyReview.ctaBusy : applyReview.cta}
        </button>
      </div>
    );
  }

  /* --- Ekran pojedynczego pytania --- */
  const value = answers[question.id];
  const progress = ((index + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-8 sm:py-14">
      <div className="mb-8">
        <div className="flex items-center justify-between text-[12px] text-tcs-text-muted">
          <span>
            Krok {index + 1} z {TOTAL_STEPS}
          </span>
        </div>
        <div
          className="mt-2 h-1 w-full overflow-hidden rounded bg-tcs-border"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label={`Postęp aplikacji: krok ${index + 1} z ${TOTAL_STEPS}`}
        >
          <div className="h-full bg-tcs-gold transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-[24px] font-bold leading-snug tracking-[-0.015em] text-tcs-text outline-none sm:text-[30px]"
      >
        {question.question}
      </h1>
      {question.context && (
        <p className="mt-3 text-[14px] leading-relaxed text-tcs-text-muted">{question.context}</p>
      )}

      <div className="mt-8 space-y-3">
        {question.kind === "single" &&
          question.options?.map((o) => {
            const selected = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setAnswer(question.id, o.value)}
                aria-pressed={selected}
                className={[
                  "w-full rounded-xl border px-5 py-4 text-left text-[15px] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue",
                  selected
                    ? "border-tcs-gold bg-tcs-gold/10 text-tcs-text"
                    : "border-tcs-border bg-tcs-surface text-tcs-text-muted hover:border-tcs-gold/50",
                ].join(" ")}
              >
                {o.label}
              </button>
            );
          })}

        {question.kind === "multi" &&
          question.options?.map((o) => {
            const arr = Array.isArray(value) ? value : [];
            const selected = arr.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  const exclusive = question.exclusiveOption;
                  let nextArr: string[];
                  if (o.value === exclusive) {
                    // „Żaden z powyższych" czyści pozostałe zaznaczenia (W1).
                    nextArr = selected ? [] : [o.value];
                  } else {
                    nextArr = selected
                      ? arr.filter((x) => x !== o.value)
                      : [...arr.filter((x) => x !== exclusive), o.value];
                  }
                  setAnswer(question.id, nextArr);
                }}
                className={[
                  "w-full rounded-xl border px-5 py-4 text-left text-[15px] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue",
                  selected
                    ? "border-tcs-gold bg-tcs-gold/10 text-tcs-text"
                    : "border-tcs-border bg-tcs-surface text-tcs-text-muted hover:border-tcs-gold/50",
                ].join(" ")}
              >
                {o.label}
              </button>
            );
          })}

        {question.revealsTextField && value === question.revealsTextField && (
          <input
            type="text"
            value={extraText[question.id] ?? ""}
            onChange={(e) => setExtraText((t) => ({ ...t, [question.id]: e.target.value }))}
            maxLength={120}
            placeholder="Opisz krótko"
            aria-label="Doprecyzuj odpowiedź"
            className={FIELD}
          />
        )}

        {question.kind === "text" && (
          <>
            <textarea
              value={typeof value === "string" ? value : ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              maxLength={800}
              rows={6}
              className={FIELD}
            />
            <p className="text-right text-[12px] text-tcs-text-muted">
              {(typeof value === "string" ? value.length : 0)} / 800
            </p>
          </>
        )}

        {question.kind === "name" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              autoComplete="given-name"
              placeholder="Imię"
              aria-label="Imię"
              value={(value as { first?: string })?.first ?? ""}
              onChange={(e) =>
                setAnswer(question.id, {
                  first: e.target.value,
                  last: (value as { last?: string })?.last ?? "",
                })
              }
              className={FIELD}
            />
            <input
              type="text"
              autoComplete="family-name"
              placeholder="Nazwisko"
              aria-label="Nazwisko"
              value={(value as { last?: string })?.last ?? ""}
              onChange={(e) =>
                setAnswer(question.id, {
                  first: (value as { first?: string })?.first ?? "",
                  last: e.target.value,
                })
              }
              className={FIELD}
            />
          </div>
        )}

        {question.kind === "email" && (
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            placeholder="adres@example.com"
            aria-label="Adres e-mail"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            className={FIELD}
          />
        )}

        {question.kind === "phone" && (
          <input
            type="tel"
            autoComplete="tel"
            placeholder="+48 600 000 000"
            aria-label="Numer telefonu"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            className={FIELD}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[14px] text-tcs-error">
          {error}
        </p>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={back}
          className="text-[14px] font-semibold tracking-[0.08em] text-tcs-text-muted underline underline-offset-4 transition-colors hover:text-tcs-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tcs-blue"
        >
          WRÓĆ
        </button>
        <button
          type="button"
          onClick={next}
          className="inline-flex min-h-[52px] min-w-[160px] items-center justify-center rounded-[14px] bg-tcs-gold px-6 text-[14px] font-bold tracking-[0.04em] text-[#07090C] transition-colors hover:bg-tcs-gold-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue focus-visible:ring-offset-[3px] focus-visible:ring-offset-tcs-bg"
        >
          DALEJ
        </button>
      </div>
    </div>
  );
}
