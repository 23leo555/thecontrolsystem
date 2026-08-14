"use client";

import { useState } from "react";
import { Section } from "@/components/ui/Section";
import { faq } from "@/content/landing";

/** FAQ — cena niewidoczna, kwalifikacja, czas, trening, dieta, badania. Sekcja 6. */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" eyebrow={faq.eyebrow} title={faq.title}>
      <div className="mx-auto max-w-prose divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {faq.items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-text-primary hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2"
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden
                    className={`shrink-0 text-gold transition-transform duration-150 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
              </h3>
              {isOpen && (
                <div className="px-5 pb-5 text-text-secondary">{item.a}</div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
