import type { Metadata } from "next";
import { LegalPage, H2, P, UL } from "@/components/legal/LegalPage";
import { footer } from "@/content/landing";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Dane firmy i zastrzeżenia",
  alternates: { canonical: site.routes.legal },
};

/**
 * Strona /legal — sekcja S (stopka linkuje tu „Dane firmy i zastrzeżenia").
 *
 * Do 2026-08-15 ten adres zwracał 404, mimo że stopka na każdej stronie na
 * niego wskazywała. Treść nie jest tu wymyślana: dane rejestrowe pochodzą
 * z `site.company`, a oba zastrzeżenia są tym samym tekstem, który stoi
 * w stopce (`footer.resultsDisclaimer`, `footer.healthDisclaimer`) — dzięki
 * temu nie rozjadą się w dwóch miejscach.
 *
 * Warunki gwarancji Control Reset 90 świadomie NIE są tu opisane: to osobny
 * dokument (P0), którego treść musi dostarczyć właściciel i zatwierdzić prawnik.
 */
export default function LegalInfoPage() {
  return (
    <LegalPage title="Dane firmy i zastrzeżenia" updatedAt="sierpień 2026">
      <H2>Dane rejestrowe</H2>
      <UL>
        <li>Nazwa: {site.company.legalName}</li>
        <li>Adres: {site.company.address}</li>
        <li>NIP: {site.company.nip}</li>
        <li>REGON: {site.company.regon}</li>
        <li>
          Kontakt:{" "}
          <a href={`mailto:${site.ownerEmail}`} className="text-gold underline">
            {site.ownerEmail}
          </a>
        </li>
      </UL>

      <H2>Zastrzeżenie dotyczące rezultatów</H2>
      <P>{footer.resultsDisclaimer}</P>

      <H2>Zastrzeżenie zdrowotne</H2>
      <P>{footer.healthDisclaimer}</P>

      <H2>Charakter materiałów na stronie</H2>
      <P>
        Case studies i materiały wideo prezentują przebieg współpracy z konkretnymi osobami,
        za ich zgodą. Nie są ofertą w rozumieniu przepisów prawa ani zapewnieniem, że
        analogiczny rezultat wystąpi w innej sytuacji.
      </P>

      <H2>Gwarancja Control Reset 90</H2>
      <P>
        Pełne warunki gwarancji są przekazywane przed podjęciem decyzji o współpracy i nie są
        jeszcze opublikowane na stronie. Do czasu ich publikacji wiążące jest wyłącznie
        brzmienie przekazane bezpośrednio przez {site.company.legalName}.
      </P>

      <H2>Pozostałe dokumenty</H2>
      <UL>
        <li>
          <a href={site.routes.privacy} className="text-gold underline">
            Polityka prywatności
          </a>
        </li>
        <li>
          <a href={site.routes.cookies} className="text-gold underline">
            Polityka cookies
          </a>
        </li>
        <li>
          <a href={site.routes.terms} className="text-gold underline">
            Regulamin
          </a>
        </li>
      </UL>
    </LegalPage>
  );
}
