"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, saveConsent, applyToWindow, type ConsentState } from "@/lib/consent";
import { flushQueue, captureTouch } from "@/lib/analytics";
import { site } from "@/lib/site";

/**
 * Banner zgód (sekcje 21/22).
 * Domyślnie nic nie jest zaznaczone — odmowa jest równie łatwa jak akceptacja.
 */
export function ConsentBanner() {
  const [consent, setConsent] = useState<ConsentState | null | undefined>(undefined);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    applyToWindow(existing);
    setConsent(existing);
    captureTouch(); // źródło ruchu zapisujemy u siebie, niezależnie od zgód
    if (existing) flushQueue();
  }, []);

  function decide(choice: { analytics: boolean; marketing: boolean }) {
    const state = saveConsent(choice);
    setConsent(state);
    flushQueue();
  }

  // undefined = jeszcze nie sprawdzono; null = brak decyzji → pokaż banner
  if (consent === undefined || consent) return null;

  return (
    <div
      role="dialog"
      aria-label="Zgody na pliki cookie"
      aria-modal="false"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-2/95 backdrop-blur"
    >
      <div className="tcs-container py-5">
        <p className="text-sm text-text-secondary">
          Używamy plików cookie. Niezbędne zapewniają działanie strony. Statystyczne i marketingowe
          włączamy <strong className="text-text-primary">wyłącznie za Twoją zgodą</strong>.{" "}
          <Link href={site.routes.cookies} className="text-primary-glow underline">
            Polityka cookies
          </Link>
        </p>

        {details && (
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-surface p-4">
            <Row
              label="Niezbędne"
              description="Bezpieczeństwo formularzy i podstawowe działanie strony. Zawsze aktywne."
              checked
              disabled
            />
            <Row
              label="Statystyczne"
              description="Anonimowe pomiary ruchu (GA4), żeby wiedzieć, co działa."
              checked={analytics}
              onChange={setAnalytics}
            />
            <Row
              label="Marketingowe"
              description="Remarketing i pomiar skuteczności reklam (Meta Pixel)."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => decide({ analytics: true, marketing: true })}
            // Ta sama waga wizualna co „Tylko niezbędne" — brak dark patternu
            // (brief sekcja 21) i brak konkurencji z głównym CTA strony.
            className="min-h-[44px] rounded-xl border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-gold-focus"
          >
            Akceptuję wszystkie
          </button>
          <button
            type="button"
            onClick={() => decide({ analytics: false, marketing: false })}
            className="min-h-[44px] rounded-xl border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-gold-focus"
          >
            Tylko niezbędne
          </button>
          {details ? (
            <button
              type="button"
              onClick={() => decide({ analytics, marketing })}
              className="min-h-[44px] rounded-xl border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-gold-focus"
            >
              Zapisz wybór
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDetails(true)}
              className="min-h-[44px] px-2 text-sm text-text-secondary underline-offset-4 hover:text-text-primary hover:underline focus-visible:outline-none focus-visible:shadow-gold-focus"
            >
              Dostosuj
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-[#4f76ff]"
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-text-secondary">{description}</span>
      </span>
    </label>
  );
}
