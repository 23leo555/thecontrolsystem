import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { CalendlyEmbed } from "@/components/booking/CalendlyEmbed";
import { verifyBookingAccess } from "@/lib/bookingAccess";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rezerwacja rozmowy",
  robots: { index: false, follow: false },
};

// Dostęp zależy od tokenu w URL — strona nie może być prerenderowana.
export const dynamic = "force-dynamic";

/**
 * /rozmowa — kalendarz wyłącznie po Statusie A albo ręcznym zatwierdzeniu (sekcja 13).
 * Bez ważnego tokenu użytkownik NIE widzi Calendly (test T13).
 */
export default async function CallPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const access = await verifyBookingAccess(t);
  const schedulingUrl = process.env.CALENDLY_SCHEDULING_URL;

  if (!access.ok) {
    return <NoAccess reason={access.reason} />;
  }

  return (
    <main id="main" className="min-h-screen">
      <div className="tcs-container max-w-3xl py-10 sm:py-14">
        <Link href={site.routes.system} aria-label={site.brand} className="inline-flex">
          <Logo />
        </Link>

        <h1 className="mt-10 text-display-sm">
          {access.firstName ? `${access.firstName}, wybierz termin rozmowy` : "Wybierz termin rozmowy"}
        </h1>
        <p className="mt-3 text-text-secondary">
          Rozmowa kwalifikacyjna trwa około 30 minut i odbywa się przez Google Meet.
        </p>

        <div className="mt-8">
          {schedulingUrl ? (
            <CalendlyEmbed
              schedulingUrl={schedulingUrl}
              firstName={access.firstName}
              email={access.email}
              applicationId={access.applicationId}
            />
          ) : (
            // Token poprawny, ale kalendarz nie jest jeszcze skonfigurowany.
            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="font-semibold">Kalendarz jest w trakcie konfiguracji</p>
              <p className="mt-2 text-sm text-text-secondary">
                Twój dostęp został potwierdzony. Napisz na{" "}
                <a href={`mailto:${site.ownerEmail}`} className="text-gold underline">
                  {site.ownerEmail}
                </a>
                , a ustalimy termin bezpośrednio.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/** Komunikaty przy braku dostępu — spokojne, bez ujawniania powodów kwalifikacji. */
function NoAccess({ reason }: { reason: "missing" | "invalid" | "expired" | "used" }) {
  const copy = {
    missing: {
      title: "Ta strona wymaga zaproszenia",
      body: "Rezerwacja terminu jest dostępna po wypełnieniu aplikacji kwalifikacyjnej.",
      showApplication: true,
    },
    invalid: {
      title: "Ten link jest nieprawidłowy",
      body: "Sprawdź, czy link został skopiowany w całości.",
      showApplication: true,
    },
    expired: {
      title: "Ten link wygasł",
      body: "Link do wyboru terminu jest ważny przez 72 godziny. Napisz do mnie, a wyślę nowy.",
      showApplication: false,
    },
    used: {
      title: "Termin został już zarezerwowany",
      body: "Szczegóły spotkania znajdziesz w wiadomości potwierdzającej. Zmiany dokonasz linkiem z tej wiadomości.",
      showApplication: false,
    },
  }[reason];

  return (
    <main id="main" className="grid min-h-screen place-items-center">
      <div className="tcs-container max-w-prose py-20 text-center">
        <Link href={site.routes.system} aria-label={site.brand} className="inline-flex">
          <Logo />
        </Link>

        <h1 className="mt-10 text-display-sm">{copy.title}</h1>
        <p className="mt-4 text-text-secondary">{copy.body}</p>

        <p className="mt-6 text-sm text-text-secondary">
          Kontakt:{" "}
          <a href={`mailto:${site.ownerEmail}`} className="text-gold underline">
            {site.ownerEmail}
          </a>
        </p>

        {copy.showApplication && (
          <p className="mt-8">
            <Link
              href={site.routes.application}
              className="inline-flex min-h-[52px] items-center rounded-xl bg-gold px-6 font-semibold text-background hover:brightness-110"
            >
              {site.cta.applicationSecondary}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
