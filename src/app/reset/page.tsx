import type { Metadata } from "next";
import { ResetForm } from "@/components/reset/ResetForm";
import { ProtocolMockup } from "@/components/reset/ProtocolMockup";
import { ResetHeader, ResetFooter } from "@/components/reset/ResetChrome";
import {
  NotEbookSection,
  SevenDaysSection,
  ForWhomSection,
} from "@/components/reset/ResetSections";
import { PageViewTracker } from "@/components/landing/PageViewTracker";
import { resetCopy } from "@/content/reset";
import { site } from "@/lib/site";

const c = resetCopy;

export const metadata: Metadata = {
  title: "7 dniowy Protokół Resetu",
  description: c.hero.subheadline,
  alternates: { canonical: site.routes.reset },
  openGraph: {
    title: "7 dniowy Protokół Resetu | The Control System",
    description: c.hero.subheadline,
    url: `${site.url}${site.routes.reset}`,
    type: "website",
    locale: "pl_PL",
  },
};

/**
 * Landing /reset — strona lead generation (brief V2).
 *
 * Jedno zadanie: doprowadzić do odebrania 7 dniowego Protokołu Resetu.
 * Czego tu celowo NIE MA (brief sekcje 1 i 25): VSL, Calendly, aplikacji
 * kwalifikacyjnej, cennika, case studies, FAQ, sliderów, menu, popupów,
 * licznika czasu i drugiego CTA do usługi płatnej.
 */
export default function ResetPage() {
  return (
    <>
      <PageViewTracker event="reset_page_view" />

      <ResetHeader />

      <main id="main">
        {/* ---------------- HERO (brief sekcja 5) ---------------- */}
        <section className="relative overflow-hidden" aria-labelledby="hero-title">
          {/* Grafika marki jako subtelna atmosfera — pod mocnym przyciemnieniem.
              <picture> z media, żeby przeglądarka pobrała TYLKO jedną wersję:
              desktop albo mobile, nigdy obie naraz (brief sekcja 29). */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <picture>
              <source media="(min-width: 640px)" srcSet="/brand/tlo-desktop.webp" />
              <img
                src="/brand/tlo-mobile.webp"
                alt=""
                decoding="async"
                className="h-full w-full object-cover object-top opacity-[0.17]"
              />
            </picture>
            <div className="absolute inset-0 bg-background/75" />
            <div className="tcs-hero-glow absolute inset-0" />
          </div>

          <div className="tcs-container relative py-12 sm:py-16 lg:py-20">
            {/*
              Jedna instancja mockupu, dwa układy — sterowane wyłącznie
              rozmieszczeniem w gridzie, nie duplikatem markupu.

              Mobile (kolejność DOM):  copy → formularz → mockup → korzyści.
                Formularz i CTA stoją wysoko, mockup ich nie spycha (brief sekcja 5).
              Desktop (lg):            lewa kolumna copy + formularz + korzyści,
                                       prawa kolumna mockup.
            */}
            <div className="tcs-fade-in grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start lg:gap-16">
              {/* A — copy */}
              <div className="lg:col-start-1 lg:row-start-1">
                <p className="tcs-eyebrow">{c.hero.eyebrow}</p>

                <h1 id="hero-title" className="mt-4 text-display-lg">
                  {c.hero.h1}
                </h1>

                <p className="mt-5 max-w-prose text-base text-text-primary/90 sm:text-lg">
                  {c.hero.subheadline}
                </p>
                <p className="mt-3 max-w-prose text-sm text-text-secondary sm:text-base">
                  {c.hero.support}
                </p>
              </div>

              {/* B — formularz i CTA */}
              <div className="rounded-2xl border border-border bg-surface/80 p-5 shadow-card backdrop-blur-sm sm:p-6 lg:col-start-1 lg:row-start-2 lg:mt-8">
                <ResetForm formId="hero" />
              </div>

              {/* C — mockup Protokołu */}
              <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:pt-4">
                <ProtocolMockup priority />
              </div>

              {/* D — 3 krótkie korzyści + mikrocopy */}
              <div className="lg:col-start-1 lg:row-start-3 lg:mt-10">
                <ul className="grid gap-5 sm:grid-cols-3">
                  {c.hero.benefits.map((b) => (
                    <li key={b.no}>
                      <span className="font-display text-xs font-bold tracking-[0.18em] tabular-nums text-primary-glow">
                        {b.no}
                      </span>
                      <h2 className="mt-2 font-display text-sm font-bold">{b.title}</h2>
                      <p className="mt-1.5 text-sm text-text-secondary">{b.body}</p>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-sm text-text-secondary/80">{c.hero.microcopy}</p>
              </div>
            </div>
          </div>
        </section>

        <NotEbookSection />
        <SevenDaysSection />
        <ForWhomSection />

        {/* ---------------- FINALNE CTA (brief sekcja 12) ---------------- */}
        <section
          className="border-t border-border/60 bg-surface/30 py-16 sm:py-20"
          aria-labelledby="final-cta-title"
        >
          <div className="tcs-container">
            <div className="mx-auto max-w-xl text-center">
              <h2 id="final-cta-title" className="text-display-sm sm:text-display-md">
                {c.finalCta.h2}
              </h2>
              <p className="mt-4 text-text-secondary">{c.finalCta.body}</p>
            </div>

            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-border bg-surface/80 p-5 text-left shadow-card sm:p-6">
              <ResetForm formId="final" />
            </div>
          </div>
        </section>
      </main>

      <ResetFooter />
    </>
  );
}
