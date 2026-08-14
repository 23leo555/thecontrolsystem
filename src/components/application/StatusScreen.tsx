"use client";

import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/lib/site";

/**
 * Ekrany wyniku A / B / C (sekcja 12).
 * Copy zgodne z briefem. Użytkownik NIGDY nie widzi score ani powodu decyzji.
 */
export function StatusScreen({
  status,
  firstName,
  callUrl,
}: {
  status: "A" | "B" | "C";
  firstName: string;
  callUrl: string | null;
}) {
  const name = firstName.trim() || "Dziękuję";

  if (status === "A") {
    return (
      <Wrapper
        badge="ZAKWALIFIKOWANY"
        badgeClass="border-success/50 bg-success/15 text-success"
        title={`${name}, możesz przejść do kolejnego etapu`}
        body="Na podstawie Twoich odpowiedzi wygląda na to, że The Control System może odpowiadać Twojej obecnej sytuacji. Możesz wybrać dogodny termin rozmowy."
      >
        {callUrl && (
          <ButtonLink href={callUrl} variant="primary" className="w-full sm:w-auto sm:px-12">
            WYBIERAM TERMIN
          </ButtonLink>
        )}
        <p className="mt-4 text-sm text-text-secondary/80">
          Link do wyboru terminu wysłaliśmy Ci również e-mailem. Jest ważny przez 72 godziny.
        </p>
      </Wrapper>
    );
  }

  if (status === "B") {
    return (
      <Wrapper
        badge="INDYWIDUALNA ANALIZA"
        badgeClass="border-warning/50 bg-warning/15 text-warning"
        title={`${name}, Twoja sytuacja wymaga indywidualnego przeanalizowania`}
        body="Zapoznam się z Twoimi odpowiedziami osobiście. Jeżeli zobaczę możliwość realnej współpracy, skontaktuję się z Tobą za pomocą podanego numeru telefonu albo adresu e-mail."
      >
        <p className="text-sm text-text-secondary/80">
          Nie musisz nic robić — odezwę się do Ciebie.
        </p>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      badge="TWÓJ KOLEJNY KROK"
      badgeClass="border-border bg-surface text-text-secondary"
      title={`${name}, prywatna współpraca nie wydaje się teraz właściwym krokiem`}
      body="Na podstawie obecnych odpowiedzi zacznij od 7-dniowego Protokołu Resetu i wdrożenia podstawowego systemu przez najbliższy tydzień."
    >
      <ButtonLink href={site.routes.reset} variant="primary" className="w-full sm:w-auto sm:px-12">
        ODBIERAM PROTOKÓŁ RESETU
      </ButtonLink>
    </Wrapper>
  );
}

function Wrapper({
  badge,
  badgeClass,
  title,
  body,
  children,
}: {
  badge: string;
  badgeClass: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <span
        className={`inline-block rounded-full border px-4 py-1.5 text-xs font-semibold tracking-[0.14em] ${badgeClass}`}
      >
        {badge}
      </span>
      <h1 className="mt-6 text-display-sm">{title}</h1>
      <p className="mx-auto mt-4 max-w-prose text-text-secondary">{body}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
