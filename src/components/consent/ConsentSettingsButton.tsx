"use client";

import { useState } from "react";
import { revokeConsent, readConsent } from "@/lib/consent";

/** Pozwala wycofać zgodę i ponownie wywołać banner (sekcja 21). */
export function ConsentSettingsButton() {
  const [done, setDone] = useState(false);

  return (
    <div className="not-prose">
      <button
        type="button"
        onClick={() => {
          revokeConsent();
          setDone(true);
          // Przeładowanie usuwa z DOM skrypty załadowane na podstawie starej zgody.
          setTimeout(() => window.location.reload(), 400);
        }}
        className="min-h-[44px] rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-text-primary hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-gold-focus"
      >
        Zmień zgody na cookies
      </button>
      {done && (
        <p role="status" className="mt-3 text-sm text-success">
          Zgody wycofane. Odświeżam stronę…
        </p>
      )}
      <p className="mt-3 text-xs text-text-secondary/70">
        Obecny stan:{" "}
        {typeof window !== "undefined" && readConsent()
          ? `statystyczne ${readConsent()?.analytics ? "tak" : "nie"}, marketingowe ${readConsent()?.marketing ? "tak" : "nie"}`
          : "brak decyzji"}
      </p>
    </div>
  );
}
