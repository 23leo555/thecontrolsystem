import { CtaButtons } from "@/components/landing/CtaButtons";
import { hero } from "@/content/landing";

/** Hero — obietnica, dla kogo, dwa CTA. Oba CTA w pierwszym ekranie (sekcja 6). */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtelne tło — bez neonów/glow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 70% 0%, rgba(44,102,147,0.18), transparent 60%), radial-gradient(50% 40% at 15% 20%, rgba(198,160,90,0.10), transparent 55%)",
        }}
      />
      <div className="tcs-container relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <p className="tcs-eyebrow mb-4">Prywatny mentoring premium dla mężczyzn 30+</p>
          {/* display-lg: 36px @320px → 64px @desktop (sekcja 19: mobile 36–42, desktop 54–64). */}
          <h1 className="text-display-lg text-text-primary">{hero.h1}</h1>
          <p className="mt-5 max-w-prose text-lg text-text-secondary">{hero.subheadline}</p>
          <CtaButtons className="mt-8" />
          <p className="mt-4 text-sm text-text-secondary/80">{hero.note}</p>
        </div>

        {/* Miejsce na realne zdjęcie Krystiana — placeholder, bez stocków (sekcja 6/26). */}
        <div className="relative">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-gold/50 bg-surface-2 text-gold">
                {/* prosta ikona */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              <span className="px-6 text-sm text-text-secondary">
                Miejsce na realne zdjęcie Krystiana
                <br />
                (placeholder — do podmiany)
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
