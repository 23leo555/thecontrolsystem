/**
 * Treść landing page — finalne copy z „FINALNY BRIEF WDROŻENIOWY v1.0" (14.08.2026).
 *
 * ŹRÓDŁO PRAWDY. Copy jest zamrożone (sekcja A2 briefu) i nie wolno go zmieniać
 * bez zgody właściciela. Numery sekcji przy każdym bloku odsyłają do briefu.
 *
 * Świadome pominięcia:
 * - brak zakresów „6-12 kg / 6-20 cm w 90 dni" (K, decyzja claimowa + AN3),
 * - brak przycisku do aplikacji w Hero (A2),
 * - brak ceny, FAQ, newslettera, sociali i lead magnetu (A2).
 */

/** Jedyny wariant CTA na całej stronie (sekcja O1). */
export const CTA_LABEL = "ZRÓB PIERWSZY KROK I ODZYSKAJ KONTROLĘ";

/**
 * Sekcja K — Hero.
 *
 * Aktualizacja 15.08.2026 (brief hero, sekcja D): headline bez słowa „pierwszych"
 * i bez pauzy przed „bez". Moduł CONTROL RESET 90 oraz powielony komunikat
 * „KROK 1 · OBEJRZYJ MATERIAŁ 4:43" usunięte z hero — jedyna etykieta kroku 1
 * żyje w `step1.eyebrow`. Footerowy link „Warunki Control Reset 90" i route
 * /control-reset-90 zostają nietknięte (F, sekcja N).
 */
export const hero = {
  eyebrow: "DLA ZAPRACOWANYCH MĘŻCZYZN 30+, KTÓRZY FUNKCJONUJĄ ZAWODOWO NA WYSOKIM POZIOMIE",
  /** Poprawki 25.10.2026 — nowe hero. */
  headline: "Bądź w formie nie tylko zawodowo.",
  /** Dwie części — na telefonie każda w osobnej linii. */
  subheadline: ["Nie odkładaj własnego życia na czas,", "kiedy pracy będzie mniej."],
  lead:
    "Więcej energii od rana, lepsza forma i siła na to, co ważne także poza pracą — to cele, nad którymi możesz pracować w RESET 90.",
  /** Trzy części — na komputerze każda w osobnej linii. */
  supporting: [
    "90 dni indywidualnego mentoringu 1:1 dla przedsiębiorców i menedżerów.",
    "Wspólnie ustalamy priorytety, dopasowujemy działania do Twojego rzeczywistego kalendarza i co tydzień korygujemy je",
    "na podstawie postępów — również wtedy, gdy pojawiają się wyjazdy lub wyjątkowo napięte tygodnie.",
  ],
} as const;

/**
 * Sekcja L — VSL.
 *
 * Poprawki 25.10.2026: nowa treść nad filmem, bez etykiety „KROK 1" i bez
 * napisów pod playerem. Sekcja „KROK 2" z CTA po filmie została usunięta.
 */
export const step1 = {
  headline: "Dlaczego sam plan nie wystarcza, gdy tydzień się komplikuje?",
  supporting:
    "W tym materiale pokazuję, dlaczego nawet dobrze zaplanowane działania potrafią się rozsypać pod wpływem codziennych obowiązków — i na czym polega inne podejście THE CONTROL SYSTEM.",
} as const;

/** Sekcje P + Q — nagłówek bloku Dowód. */
export const proof = {
  eyebrow: "DOWÓD DZIAŁANIA W PRAWDZIWYM ŻYCIU",
  headline: "System ma działać także wtedy, gdy tydzień nie idzie zgodnie z planem.",
  supporting:
    "Długie dni pracy czy regularne delegacje? Zobacz, jak różne warunki wymagają różnych sposobów działania.",
  /** Wspólne microcopy pod metrykami (P1 i Q1 — identyczne brzmienie). */
  metricsNote:
    "Rezultat indywidualny. Dane liczbowe pochodzą z dostarczonego dokumentu case study.",
} as const;

export interface CaseStudy {
  slug: string;
  eyebrow: string;
  headline: string;
  transformation: string;
  metrics: { value: string; label: string }[];
  start: string;
  obstacle: string;
  mechanism: string;
  outcome: string;
  image: {
    base: string;
    widths: number[];
    /** Wymiary własne — konieczne, żeby lazy-loading nie powodował skoku layoutu (AH). */
    intrinsic: { w: number; h: number };
    alt: string;
    caption: string;
  };
}

/** Sekcja P — case study 01. */
export const boleslaw: CaseStudy = {
  slug: "boleslaw",
  eyebrow: "BOLESŁAW",
  headline: "12 godzin pracy. I wreszcie miejsce także dla siebie.",
  transformation:
    "Od długich dni pracy w salonie, przypadkowego jedzenia i braku energii do lepszej sylwetki oraz większej przestrzeni na własne potrzeby.",
  metrics: [
    { value: "−10 kg", label: "masy ciała" },
    { value: "−19 cm", label: "w talii" },
    { value: "+2,5 kg", label: "masy mięśniowej" },
    { value: "12 mies.", label: "współpracy" },
  ],
  start:
    "Bolesław prowadzi własny salon fryzjerski, a jego dni pracy potrafiły trwać nawet 12 godzin. Nie trenował, często wybierał fast foody i brakowało mu energii.",
  obstacle:
    "Po całym dniu pracy własne potrzeby schodziły na dalszy plan. Zdarzało mu się jeść tuż przed snem, wieczory spędzał z telefonem i słabo się regenerował.",
  mechanism:
    "Zmieniliśmy sposób, w jaki traktował własne potrzeby: trening stał się stałym terminem w kalendarzu, a odżywianie i regenerację dostosowaliśmy do jego codzienności.",
  outcome:
    "Nie tylko lepsza sylwetka, ale również więcej energii na życie poza pracą. Bolesław zaczął regularnie dbać o siebie, nie odkładając własnej formy na spokojniejszy okres.",
  image: {
    base: "/cases/boleslaw",
    widths: [400, 600, 800, 1200],
    intrinsic: { w: 1320, h: 2346 },
    alt: "Bolesław przed rozpoczęciem współpracy i po niej — zestawienie sylwetki",
    caption: "Zestawienie sylwetki Bolesława przed i po współpracy · materiał źródłowy",
  },
};

/** Sekcja Q — case study 02. */
export const oskar: CaseStudy = {
  slug: "oskar",
  eyebrow: "OSKAR",
  headline: "Dwa tygodnie na miejscu, dwa tygodnie w trasie. Bez zaczynania od zera.",
  transformation:
    "Oskar regularnie wyjeżdżał, ale nie chciał za każdym razem zaczynać od nowa. Dwa warianty działania pozwoliły mu pracować nad formą w różnych warunkach.",
  metrics: [
    { value: "−16 kg", label: "masy ciała" },
    { value: "−24 cm", label: "w talii" },
    { value: "+1,5 kg", label: "masy mięśniowej" },
    { value: "6 mies.", label: "współpracy" },
  ],
  start:
    "Oskar regularnie wyjeżdżał służbowo, spędzając około dwóch tygodni poza domem i dwóch tygodni na miejscu. Jego warunki treningowe i żywieniowe stale się zmieniały.",
  obstacle:
    "Plan oparty na stałym dostępie do siłowni i podobnym rytmie dnia nie sprawdzał się podczas delegacji. Każda zmiana środowiska utrudniała utrzymanie regularności.",
  mechanism:
    "Przygotowaliśmy dwa warianty działania: jeden na miejscu, drugi w delegacji. Trening i odżywianie dostosowywaliśmy do aktualnych możliwości.",
  outcome:
    "Wyjazd nie musiał już oznaczać przerwania pracy nad formą ani czekania na powrót do domu. Oskar mógł konsekwentnie realizować swój cel mimo zmieniających się warunków.",
  image: {
    // Źródło miało rozszerzenie .png przy zawartości JPEG — naprawione przy konwersji (AN2).
    base: "/cases/oskar",
    widths: [400, 600, 800],
    intrinsic: { w: 864, h: 1536 },
    alt: "Oskar przed rozpoczęciem współpracy i po niej — zestawienie sylwetki",
    caption: "Zestawienie sylwetki Oskara przed i po współpracy · materiał źródłowy",
  },
};

/**
 * Sekcja R — finalne CTA po case studies.
 *
 * Poprawki 25.10.2026: nowa treść i własny napis na przycisku. Link do
 * Protokołu Resetu pod CTA został usunięty.
 */
export const finalCta = {
  eyebrow: "TWÓJ PIERWSZY KROK",
  headline: "Dwie różne historie. A jak wygląda Twoja?",
  supporting:
    "Każdy ma inny punkt wyjścia, cel i obowiązki. Sprawdź, czy indywidualny mentoring RESET 90 odpowiada Twojej sytuacji.",
  ctaLabel: "ROZPOCZNIJ KWALIFIKACJĘ",
  microcopy: "Aplikacja nie jest zakupem ani gwarancją rozmowy.",
} as const;

/** Sekcja S — footer. Oba disclaimery: DO FINALNEJ WERYFIKACJI PRAWNEJ. */
export const footer = {
  role: "Krystian Ćwik · Twórca The Control System",
  resultsDisclaimer:
    "Rezultaty są indywidualne i zależą między innymi od punktu startowego, stanu zdrowia oraz realizacji uzgodnionego procesu. Przedstawione case studies nie stanowią gwarancji identycznego wyniku.",
  healthDisclaimer:
    "Treści na stronie mają charakter informacyjny i nie stanowią diagnozy, porady medycznej ani zastępstwa konsultacji z lekarzem.",
} as const;
