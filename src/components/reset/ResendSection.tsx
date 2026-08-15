"use client";

import { useState } from "react";
import { resetCopy } from "@/content/reset";

const c = resetCopy.thanks.resend;

type Status = "idle" | "pending" | "success" | "cooldown" | "rate_limited" | "expired_context" | "error";

/**
 * Sekcja „Wiadomość nie dotarła?" na stronie podziękowania (brief resendu, sekcja 8–9).
 *
 * Bez znajomości e-maila po stronie klienta — kontekst dostawy siedzi wyłącznie
 * w HttpOnly cookie ustawionym przez /api/reset, więc ten komponent po prostu
 * POST-uje bez body i interpretuje odpowiedź.
 */
export function ResendSection({ hasContext }: { hasContext: boolean }) {
  const [status, setStatus] = useState<Status>(hasContext ? "idle" : "expired_context");
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onResend() {
    if (status === "pending" || status === "cooldown") return;
    setStatus("pending");
    setMessage(null);

    try {
      const res = await fetch("/api/reset/resend", { method: "POST" });
      const data = (await res.json()) as {
        ok: boolean;
        code?: Status;
        retryAfterSeconds?: number;
        error?: string;
      };

      if (data.ok) {
        setStatus("success");
        return;
      }

      const code = data.code ?? "error";
      setStatus(code);
      setMessage(data.error ?? null);
      if (code === "cooldown" && data.retryAfterSeconds) {
        setRetryAfter(data.retryAfterSeconds);
      }
    } catch {
      setStatus("error");
      setMessage("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
    }
  }

  if (status === "expired_context") {
    return (
      <p className="mt-6 text-center text-sm text-text-secondary">
        Nie możemy rozpoznać adresu z poprzedniego formularza.{" "}
        <a href="/reset" className="text-primary-glow underline underline-offset-2 hover:text-primary">
          Wróć do strony protokołu
        </a>
        .
      </p>
    );
  }

  return (
    <div className="mt-8 border-t border-border/60 pt-6 text-center">
      <p className="text-sm text-text-secondary">{c.prompt}</p>

      <button
        type="button"
        onClick={onResend}
        disabled={status === "pending" || status === "cooldown"}
        className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold text-text-primary transition-colors duration-step hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "pending" ? c.ctaLoading : c.cta}
      </button>

      <p role="status" aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm">
        {status === "success" && <span className="text-success">{c.success}</span>}
        {status === "cooldown" && (
          <span className="text-text-secondary">
            {retryAfter ? `Wiadomość została już wysłana. Kolejna próba będzie możliwa za ${retryAfter} s.` : message}
          </span>
        )}
        {(status === "rate_limited" || status === "error") && (
          <span className="text-danger">{message ?? c.error}</span>
        )}
      </p>
    </div>
  );
}
