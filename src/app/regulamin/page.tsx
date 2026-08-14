import type { Metadata } from "next";
import { LegalPage, H2, P, UL } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Regulamin",
  alternates: { canonical: site.routes.terms },
};

export default function TermsPage() {
  return (
    <LegalPage title="Regulamin serwisu i Protokołu" updatedAt="sierpień 2026">
      <H2>Postanowienia ogólne</H2>
      <P>
        Regulamin określa zasady korzystania z serwisu {site.url.replace("https://", "")} oraz
        z bezpłatnego materiału „7-dniowy Protokół Resetu”. Usługodawcą jest Krystian Ćwik,
        prowadzący działalność pod marką The Control System.
      </P>

      <H2>Usługi świadczone drogą elektroniczną</H2>
      <UL>
        <li>Udostępnienie bezpłatnego materiału po podaniu imienia i adresu e-mail.</li>
        <li>Możliwość złożenia aplikacji kwalifikacyjnej do współpracy prywatnej.</li>
        <li>Rezerwacja terminu rozmowy — dostępna wyłącznie po pozytywnej kwalifikacji.</li>
      </UL>

      <H2>Charakter procesu kwalifikacji</H2>
      <P>
        Złożenie aplikacji nie jest równoznaczne z zawarciem umowy ani z gwarancją podjęcia
        współpracy. Usługodawca prowadzi selekcję i zastrzega sobie prawo do nieprzyjęcia
        zgłoszenia. Warunki finansowe współpracy omawiane są indywidualnie po kwalifikacji.
      </P>

      <H2>Charakter treści i zastrzeżenie rezultatów</H2>
      <P>
        Materiały mają charakter edukacyjny i nie stanowią diagnozy ani leczenia. Przed wdrożeniem
        zmian w diecie lub aktywności fizycznej skonsultuj się z lekarzem, szczególnie w przypadku
        chorób przewlekłych. Opisywane efekty zależą od indywidualnej sytuacji i konsekwencji
        wdrożenia — nie są gwarantowane.
      </P>

      <H2>Prawa autorskie</H2>
      <P>
        Materiały udostępniane w serwisie są chronione prawem autorskim. Nie mogą być kopiowane,
        rozpowszechniane ani udostępniane osobom trzecim bez zgody autora.
      </P>

      <H2>Reklamacje</H2>
      <P>
        Reklamacje można składać na adres {site.ownerEmail}. Odpowiedź zostanie udzielona
        w terminie 14 dni od otrzymania zgłoszenia.
      </P>

      <H2>Rezygnacja</H2>
      <P>
        W każdej chwili możesz zrezygnować z otrzymywania wiadomości, korzystając z odnośnika
        w stopce wiadomości lub pisząc na {site.ownerEmail}.
      </P>
    </LegalPage>
  );
}
