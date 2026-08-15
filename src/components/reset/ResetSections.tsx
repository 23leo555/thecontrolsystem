import { resetCopy } from "@/content/reset";

const numberClass =
  "font-display text-xs font-bold tracking-[0.18em] text-primary-glow tabular-nums";

const cardClass =
  "rounded-2xl border border-border bg-surface/70 p-6 shadow-card";

/** Sekcja „To nie jest kolejny ebook" (brief sekcja 9). */
export function NotEbookSection() {
  const c = resetCopy.notEbook;
  return (
    <section className="tcs-container py-16 sm:py-20" aria-labelledby="not-ebook-title">
      <div className="max-w-prose lg:max-w-[60rem]">
        <h2 id="not-ebook-title" className="text-display-sm sm:text-display-md">
          {c.h2}
        </h2>
        <p className="mt-5 max-w-prose text-text-secondary">{c.body}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {c.cards.map((card) => (
          <div key={card.no} className={cardClass}>
            <span className={numberClass}>{card.no}</span>
            <h3 className="mt-3 font-display text-base font-bold">{card.title}</h3>
            <p className="mt-2 text-sm text-text-secondary">{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Mapa 7 dni (brief sekcja 10).
 * Ma być skanowalna w kilka sekund — żadnych rozwinięć ani opisów dnia.
 */
export function SevenDaysSection() {
  const c = resetCopy.sevenDays;
  return (
    <section
      className="border-y border-border/60 bg-surface/30 py-16 sm:py-20"
      aria-labelledby="seven-days-title"
    >
      <div className="tcs-container">
        <h2 id="seven-days-title" className="text-display-sm sm:text-display-md lg:text-center">
          {c.h2}
        </h2>

        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {c.days.map((d) => (
            <li
              key={d.day}
              className="flex items-start gap-4 rounded-xl border border-border bg-background/60 px-5 py-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 font-display text-sm font-bold tabular-nums text-primary-glow">
                {d.day}
              </span>
              <span className="pt-1.5 text-sm text-text-secondary">{d.result}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Sekcja „Dla kogo" (brief sekcja 11) — krótka identyfikacja odbiorcy. */
export function ForWhomSection() {
  const c = resetCopy.forWhom;
  return (
    <section className="tcs-container py-16 sm:py-20" aria-labelledby="for-whom-title">
      <div className="max-w-prose lg:max-w-[60rem]">
        <h2 id="for-whom-title" className="text-display-sm sm:text-display-md">
          {c.h2}
        </h2>

        <ul className="mt-8 max-w-prose space-y-3">
          {c.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-text-secondary">
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="mt-1 h-5 w-5 shrink-0 text-primary-glow"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 10.5l4 4 8-9" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
