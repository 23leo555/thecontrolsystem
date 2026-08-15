import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ResetHeader, ResetFooter } from "@/components/reset/ResetChrome";
import { PageViewTracker } from "@/components/landing/PageViewTracker";
import { ResendSection } from "@/components/reset/ResendSection";
import { ButtonLink } from "@/components/ui/Button";
import { resetCopy } from "@/content/reset";
import { site } from "@/lib/site";
import { verifyDeliveryToken, deliveryCookie } from "@/lib/resendToken";

const c = resetCopy.thanks;

export const metadata: Metadata = {
  title: "Protokół jest już w drodze",
  robots: { index: false, follow: false },
};

/**
 * Strona /reset/dziekuje (brief sekcja 16).
 *
 * Kolejność jest celowa: najpierw dostarczamy dokładnie to, co obiecaliśmy.
 * Bez VSL, bez Calendly, bez automatycznego przekierowania do sprzedaży.
 * Bridge do /system jest dyskretny i ukryty do czasu publikacji tamtej strony.
 */
export default async function ResetThanksPage() {
  const cookieStore = await cookies();
  const hasDeliveryContext =
    verifyDeliveryToken(cookieStore.get(deliveryCookie.name)?.value) !== null;

  return (
    <>
      <PageViewTracker event="reset_thankyou_view" />

      <ResetHeader />

      <main id="main" className="min-h-[60vh]">
        <div className="tcs-container max-w-xl py-16 sm:py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-6 w-6 text-primary-glow"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12.5l5 5 11-11" />
            </svg>
          </div>

          <h1 className="mt-6 text-display-md">{c.h1}</h1>
          <p className="mt-4 text-text-secondary">{c.body}</p>

          {/* Bez pobierania PDF-a: Protokół dostarczamy wyłącznie e-mailem
              (decyzja właściciela z 2026-08-15). Zostaje wskazówka, gdzie szukać
              wiadomości, i możliwość ponownej wysyłki poniżej. */}
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-surface/80 p-5 shadow-card sm:p-6">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
              <path d="M3 7l9 6 9-6" />
            </svg>
            <p className="text-sm leading-relaxed text-text-secondary">{c.inboxHint}</p>
          </div>

          <ResendSection hasContext={hasDeliveryContext} />

          {/* Bridge do pełnej usługi — nie jest głównym CTA tej strony. */}
          {site.systemPageLive && (
            <div className="mt-12 border-t border-border/60 pt-8">
              <h2 className="font-display text-base font-bold">{c.bridge.h2}</h2>
              <p className="mt-2 text-sm text-text-secondary">{c.bridge.body}</p>
              <ButtonLink href={site.routes.system} variant="secondary" className="mt-5">
                {c.bridge.cta}
              </ButtonLink>
            </div>
          )}
        </div>
      </main>

      <ResetFooter />
    </>
  );
}
