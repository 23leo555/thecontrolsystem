"use client";

import { Section } from "@/components/ui/Section";
import { track } from "@/lib/analytics";
import { vsl } from "@/content/landing";

/**
 * VSL — placeholder gotowy do podmiany bez kodowania (sekcja 6).
 * Eventy vsl_start/25/50/75/90/complete podłączone pod odtwarzacz po dostarczeniu materiału.
 */
export function VslPlaceholder() {
  return (
    <Section id="vsl" eyebrow={vsl.eyebrow} title={vsl.title} surface>
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => track("vsl_start", { placeholder: true })}
          className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-border bg-surface-2 focus-visible:shadow-gold-focus"
          aria-label="Odtwórz nagranie (placeholder)"
        >
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gold text-background transition-transform duration-150 group-hover:scale-105">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
          <span className="absolute bottom-4 left-0 right-0 px-6 text-center text-sm text-text-secondary">
            {vsl.note}
          </span>
        </button>
      </div>
    </Section>
  );
}
