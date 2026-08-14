import type { Metadata } from "next";
import { LegalPage, H2, P, UL } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  alternates: { canonical: site.routes.privacy },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Polityka prywatności" updatedAt="sierpień 2026">
      <H2>Administrator danych</H2>
      <P>
        Administratorem Twoich danych osobowych jest Krystian Ćwik, prowadzący działalność pod marką
        The Control System. Kontakt: {site.ownerEmail}.
      </P>

      <H2>Jakie dane zbieramy</H2>
      <UL>
        <li>Imię i adres e-mail — przy zapisie na 7-dniowy Protokół Resetu.</li>
        <li>Imię, e-mail i numer telefonu — przy składaniu aplikacji kwalifikacyjnej.</li>
        <li>Odpowiedzi udzielone w aplikacji kwalifikacyjnej.</li>
        <li>Źródło wejścia na stronę (parametry UTM, adres odsyłający).</li>
        <li>Dane techniczne niezbędne do ochrony formularzy przed nadużyciami.</li>
      </UL>

      <H2>Cel i podstawa prawna</H2>
      <UL>
        <li>
          Dostarczenie zamówionego materiału i obsługa zgłoszenia — wykonanie umowy lub działania
          na żądanie osoby, której dane dotyczą (art. 6 ust. 1 lit. b RODO).
        </li>
        <li>
          Ocena dopasowania do programu na podstawie odpowiedzi — prawnie uzasadniony interes
          administratora (art. 6 ust. 1 lit. f RODO).
        </li>
        <li>
          Wiadomości marketingowe — wyłącznie na podstawie odrębnej, dobrowolnej zgody
          (art. 6 ust. 1 lit. a RODO), którą możesz wycofać w każdej chwili.
        </li>
      </UL>

      <H2>Odbiorcy danych</H2>
      <P>
        Dane powierzamy dostawcom niezbędnym do działania serwisu: hosting i infrastruktura
        aplikacji, baza danych, system wysyłki wiadomości, narzędzie do rezerwacji terminów oraz
        narzędzia analityczne — te ostatnie wyłącznie po wyrażeniu zgody na pliki cookie.
      </P>

      <H2>Okres przechowywania</H2>
      <P>
        Dane przechowujemy przez okres niezbędny do realizacji wskazanych celów, a następnie przez
        czas wynikający z przepisów o przedawnieniu roszczeń. Dane przetwarzane na podstawie zgody
        usuwamy po jej wycofaniu.
      </P>

      <H2>Twoje prawa</H2>
      <UL>
        <li>Dostęp do danych oraz otrzymanie ich kopii.</li>
        <li>Sprostowanie, usunięcie lub ograniczenie przetwarzania.</li>
        <li>Przenoszenie danych.</li>
        <li>Sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie.</li>
        <li>Wycofanie zgody w dowolnym momencie, bez wpływu na zgodność z prawem wcześniejszego przetwarzania.</li>
        <li>Skarga do Prezesa Urzędu Ochrony Danych Osobowych.</li>
      </UL>
      <P>
        Aby skorzystać z powyższych praw, napisz na {site.ownerEmail}. Na żądanie usuniemy lub
        zanonimizujemy Twoje dane.
      </P>

      <H2>Charakter treści</H2>
      <P>
        Materiały udostępniane w serwisie mają charakter edukacyjny. Nie stanowią diagnozy,
        porady medycznej ani leczenia i nie zastępują konsultacji z lekarzem.
      </P>
    </LegalPage>
  );
}
