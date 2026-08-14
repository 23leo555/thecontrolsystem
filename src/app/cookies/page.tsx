import type { Metadata } from "next";
import { LegalPage, H2, P, UL } from "@/components/legal/LegalPage";
import { ConsentSettingsButton } from "@/components/consent/ConsentSettingsButton";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Polityka cookies",
  alternates: { canonical: site.routes.cookies },
};

export default function CookiesPage() {
  return (
    <LegalPage title="Polityka cookies" updatedAt="sierpień 2026">
      <H2>Czym są pliki cookie</H2>
      <P>
        To niewielkie pliki zapisywane w Twojej przeglądarce. Używamy ich, aby serwis działał
        poprawnie oraz — po Twojej zgodzie — aby mierzyć skuteczność treści i reklam.
      </P>

      <H2>Rodzaje plików, których używamy</H2>
      <UL>
        <li>
          <strong>Niezbędne</strong> — zapewniają podstawowe działanie serwisu i ochronę formularzy
          przed nadużyciami. Działają zawsze i nie wymagają zgody.
        </li>
        <li>
          <strong>Statystyczne</strong> — Google Analytics 4. Pozwalają zrozumieć, jak korzystasz
          z serwisu. Uruchamiane wyłącznie po Twojej zgodzie.
        </li>
        <li>
          <strong>Marketingowe</strong> — Meta Pixel. Służą do pomiaru skuteczności reklam
          i remarketingu. Uruchamiane wyłącznie po Twojej zgodzie.
        </li>
      </UL>

      <H2>Brak zgody = brak trackerów</H2>
      <P>
        Dopóki nie wyrazisz zgody, skrypty analityczne i marketingowe nie są w ogóle ładowane —
        nie wysyłają żadnych żądań ani nie zapisują plików cookie.
      </P>

      <H2>Zmiana decyzji</H2>
      <P>
        Swój wybór możesz zmienić w każdej chwili. Wycofanie zgody usuwa również powiązane pliki
        cookie z Twojej przeglądarki.
      </P>
      <ConsentSettingsButton />

      <H2>Ustawienia przeglądarki</H2>
      <P>
        Niezależnie od powyższych ustawień możesz zarządzać plikami cookie w swojej przeglądarce.
        Zablokowanie plików niezbędnych może utrudnić korzystanie z serwisu.
      </P>
    </LegalPage>
  );
}
