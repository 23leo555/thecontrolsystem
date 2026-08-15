import type { Metadata } from "next";
import crypto from "node:crypto";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { site } from "@/lib/site";
import {
  resultQualified,
  resultManualReview,
  resultNotQualified,
  resultProtocolOffer,
} from "@/content/apply";

/**
 * Strona wyniku aplikacji — sekcje X2, Y1, Z1.
 *
 * Status jest odczytywany PO STRONIE SERWERA z bazy na podstawie podpisanego
 * tokenu. Nie ufamy niczemu z URL-a poza podpisem (W3).
 *
 * Calendly renderuje się wyłącznie przy statusie QUALIFIED i dopiero po
 * ponownym potwierdzeniu statusu tutaj (A2, AA1). Przy pozostałych statusach
 * skrypt Calendly nie jest nawet ładowany (Z2).
 */
export const metadata: Metadata = {
  title: "Wynik aplikacji",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Status = "QUALIFIED" | "MANUAL_REVIEW" | "NOT_QUALIFIED";

function verifyToken(token: string): { applicationId: string } | null {
  const secret = process.env.APPLY_RESULT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  // Porównanie w stałym czasie — token jest sekretem dostępowym.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const [applicationId, expiresAt] = payload.split(".");
  if (!applicationId || Number(expiresAt) < Date.now()) return null;

  return { applicationId };
}

async function readStatus(applicationId: string): Promise<Status | null> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("applications").select("status").eq("id", applicationId).single();
    const s = data?.status as string | undefined;
    if (s === "QUALIFIED" || s === "MANUAL_REVIEW" || s === "NOT_QUALIFIED") return s;
    return null;
  } catch {
    return null;
  }
}

/**
 * Droga do Protokołu Resetu dla kandydatów bez rozmowy (decyzja właściciela,
 * odstępstwo od Z1 — patrz komentarz przy `resultProtocolOffer`).
 * Utrzymana wizualnie niżej niż główny komunikat: to wyjście awaryjne, nie oferta.
 */
function ProtocolOffer() {
  return (
    <section className="mt-12 rounded-[14px] border border-tcs-border bg-tcs-surface p-6 sm:p-8">
      <h2 className="text-[20px] font-bold text-tcs-text sm:text-[22px]">{resultProtocolOffer.headline}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-tcs-text-muted sm:text-[16px]">
        {resultProtocolOffer.supporting}
      </p>
      {/* Styl CTA przepisany z ApplyFlow, nie z ButtonLink: lejek aplikacji ma
          własną paletę (złoto), a wspólny komponent renderuje indygo landingu. */}
      <Link
        href={site.routes.reset}
        className="mt-6 inline-flex min-h-[56px] w-full items-center justify-center rounded-[14px] bg-tcs-gold px-6 text-[14px] font-bold tracking-[0.04em] text-[#07090C] transition-colors hover:bg-tcs-gold-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue focus-visible:ring-offset-[3px] focus-visible:ring-offset-tcs-bg sm:w-auto sm:min-w-[280px] sm:text-[15px]"
      >
        {resultProtocolOffer.cta}
      </Link>
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-tcs-bg">
      <header className="border-b border-tcs-border/60">
        <div className="mx-auto flex h-16 max-w-[720px] items-center px-4 sm:px-8">
          <Link href={site.routes.home} aria-label={site.name} className="inline-flex">
            <img src="/brand/tcs-logo.webp" alt="" width={44} height={44} className="h-11 w-11" />
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[720px] px-4 py-16 sm:px-8 sm:py-24">
        {children}
      </main>
    </div>
  );
}

export default async function ResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const verified = verifyToken(token);

  if (!verified) {
    return (
      <Shell>
        <h1 className="text-[26px] font-extrabold text-tcs-text sm:text-[32px]">
          Ten link wygasł albo jest nieprawidłowy.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-tcs-text-muted">
          Link do wyniku jest ważny 7 dni. Jeśli potrzebujesz nowego, odpowiedz na wiadomość
          potwierdzającą wysłanie aplikacji.
        </p>
      </Shell>
    );
  }

  const status = await readStatus(verified.applicationId);

  if (status === "QUALIFIED") {
    const calendlyUrl = process.env.CALENDLY_SCHEDULING_URL;
    return (
      <Shell>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-xs">
          {resultQualified.eyebrow}
        </p>
        <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[34px]">
          {resultQualified.headline}
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-tcs-text-muted sm:text-[17px]">
          {resultQualified.supporting}
        </p>

        <h2 className="mt-12 text-[20px] font-bold text-tcs-text sm:text-[24px]">
          {resultQualified.calendarHeadline}
        </h2>

        {calendlyUrl ? (
          // Embed inline, nie popup (AA1). URL pochodzi z sekretu środowiskowego
          // i nigdy nie trafia do bundla klienta ani do landing page.
          <iframe
            src={calendlyUrl}
            title="Wybór terminu rozmowy"
            className="mt-6 h-[720px] w-full rounded-[14px] border border-tcs-border bg-tcs-surface"
            loading="lazy"
          />
        ) : (
          <p className="mt-6 rounded-[14px] border border-tcs-border bg-tcs-surface p-5 text-[15px] text-tcs-text-muted">
            Kalendarz nie jest jeszcze skonfigurowany. Skontaktujemy się z Tobą e-mailem, żeby
            umówić termin rozmowy.
          </p>
        )}

        <p className="mt-6 text-[13px] leading-relaxed text-tcs-text-muted">
          {resultQualified.microcopy}
        </p>
      </Shell>
    );
  }

  if (status === "MANUAL_REVIEW") {
    return (
      <Shell>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-xs">
          {resultManualReview.eyebrow}
        </p>
        <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[34px]">
          {resultManualReview.headline}
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-tcs-text-muted sm:text-[17px]">
          {resultManualReview.supporting}
        </p>
        <p className="mt-6 text-[13px] leading-relaxed text-tcs-text-muted">
          {resultManualReview.microcopy}
        </p>
        {/* Czekanie na decyzję nie musi być pustym tygodniem. */}
        <ProtocolOffer />
      </Shell>
    );
  }

  // NOT_QUALIFIED oraz brak statusu w bazie: ten sam, neutralny ekran.
  // Bez score, progu, dochodu i powodu decyzji (Z2). Jedyne CTA to Protokół
  // Resetu — świadome odstępstwo od Z1 na decyzję właściciela.
  return (
    <Shell>
      <p className="text-[11px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-xs">
        {resultNotQualified.eyebrow}
      </p>
      <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[34px]">
        {resultNotQualified.headline}
      </h1>
      <p className="mt-5 text-[16px] leading-relaxed text-tcs-text-muted sm:text-[17px]">
        {resultNotQualified.supporting}
      </p>
      <p className="mt-6 text-[13px] leading-relaxed text-tcs-text-muted">
        {resultNotQualified.microcopy}
      </p>
      <ProtocolOffer />
    </Shell>
  );
}
