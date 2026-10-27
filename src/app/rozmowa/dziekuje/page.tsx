import type { Metadata } from "next";
import Link from "next/link";
import { PageBackground } from "@/components/landing/PageBackground";
import { resultBooked } from "@/content/apply";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rozmowa umówiona",
  robots: { index: false, follow: false },
};

/**
 * /rozmowa/dziekuje — strona po zarezerwowaniu terminu w Calendly (X3).
 * Świadomie bez kolejnej sprzedaży i bez CTA do innych produktów.
 */
export default function CallThanksPage() {
  return (
    <>
      <PageBackground />
      <header className="border-b border-tcs-border/60 bg-tcs-bg/60 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-center px-3 sm:h-20 sm:px-6">
          <Link href={site.routes.home} aria-label={site.name} className="inline-flex">
            <img src="/brand/tcs-logo-poziome.webp" alt="" width={720} height={264} className="h-11 w-auto sm:h-[60px]" />
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[760px] px-4 py-12 text-center sm:px-6 sm:py-20">
        <div
          aria-hidden
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-tcs-gold/50 bg-tcs-gold/10"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#C9A96E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>

        <p className="mt-6 text-[10px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-[11px]">
          {resultBooked.eyebrow}
        </p>
        <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[38px]">
          {resultBooked.headline}
        </h1>
        <p className="mx-auto mt-4 text-[14px] leading-relaxed text-tcs-text-muted sm:text-[16px]">
          {resultBooked.supporting}
        </p>

        <ol className="mt-8 space-y-3 rounded-[18px] border border-tcs-border/70 bg-tcs-bg/75 p-5 text-left backdrop-blur-sm sm:p-6">
          {resultBooked.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-tcs-text sm:text-[15px]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tcs-gold text-[12px] font-bold text-[#07090C]">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-[15px] font-semibold text-tcs-gold">{resultBooked.signature}</p>

        <Link
          href={site.routes.home}
          className="mt-6 inline-block text-[13px] text-tcs-text-muted underline underline-offset-4 transition-colors hover:text-tcs-text"
        >
          Wróć na stronę główną
        </Link>
      </main>
    </>
  );
}
