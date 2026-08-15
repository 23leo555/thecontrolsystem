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
  headline:
    "Zredukuj brzuch, zmniejsz talię i odzyskaj energię w ciągu 90 dni bez podporządkowywania życia kolejnej diecie i planowi treningowemu.",
  supporting:
    "The Control System to indywidualny proces 1 na 1, który łączy biologię, zachowanie i realne warunki Twojego życia w jeden system. Nie dopasowujemy Twojego życia do planu. Dopasowujemy system do Twojego życia.",
} as const;

/** Sekcja L — Krok 1 / VSL. */
export const step1 = {
  /** Bez długości materiału — czas nie jest eksponowany w CTA do filmu (brief hero, D+F). */
  eyebrow: "KROK 1 · OBEJRZYJ MATERIAŁ",
  headline:
    "Zobacz, dlaczego kolejna dieta albo plan treningowy prawdopodobnie nie rozwiążą Twojego problemu.",
  supporting:
    "Włącz materiał i sprawdź, jak The Control System łączy Biologię, Zachowanie, Środowisko i System w proces, który działa również wtedy, kiedy tydzień nie wygląda idealnie.",
  microcopy: "Z dźwiękiem · Polskie napisy · Bez autoplay",
} as const;

/** Sekcja N — Krok 2 / aplikacja. */
export const step2 = {
  eyebrow: "KROK 2",
  headline: "Jeśli rozpoznajesz siebie w tym materiale, zrób pierwszy krok.",
  supporting:
    "Wypełnij krótką aplikację kwalifikacyjną. Sprawdzimy, czy The Control System 1 na 1 może zostać dopasowany do Twojej sytuacji, celu i realnych warunków życia.",
  microcopy:
    "Krótka aplikacja kwalifikacyjna. Jeśli zobaczymy dopasowanie, otrzymasz możliwość wyboru terminu rozmowy online 1 na 1 z Krystianem. Nie każdy kandydat przechodzi do etapu rozmowy.",
} as const;

/** Sekcje P + Q — nagłówek bloku Dowód. */
export const proof = {
  eyebrow: "DOWÓD DZIAŁANIA W PRAWDZIWYM ŻYCIU",
  headline: "System ma działać wtedy, kiedy życie nie wygląda idealnie.",
  supporting:
    "Dwa różne punkty startowe. Ten sam mechanizm: zobaczyć rzeczywistość, uporządkować system, utrzymać działanie i dopiero wtedy skalować progres.",
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
  eyebrow: "CASE STUDY 01 · BOLESŁAW",
  headline:
    "Nie potrzebował więcej dyscypliny. Potrzebował systemu, który wytrzyma jego prawdziwe życie.",
  transformation:
    "Od pracy nawet 7 dni w tygodniu po około 12 godzin dziennie i chaosu całego trybu życia — do regularnego procesu, większej energii i widocznej transformacji sylwetki.",
  metrics: [
    { value: "−10 kg", label: "masy ciała" },
    { value: "−19 cm", label: "w talii" },
    { value: "+2,5 kg", label: "masy mięśniowej" },
    { value: "12 mies.", label: "współpracy" },
  ],
  start:
    "Bolesław jest fryzjerem i prowadzi własny salon. Przeciążenie pracą, niedobór snu, niska energia, mgła poznawcza i brak regularności sprawiały, że kolejny plan tylko dokładał obowiązków.",
  obstacle:
    "Problemem nie był brak wiedzy. Problemem był chaos całego systemu funkcjonowania.",
  mechanism:
    "Najpierw ustabilizowaliśmy podstawy: rytm dnia, regenerację i warunki do regularnego działania. Dopiero na tej bazie rozpoczął się progres sylwetkowy.",
  // „deklarował" jest wymagane przez P2 — nie przedstawiamy tego jako efektu medycznego.
  outcome:
    "Bolesław deklarował większą energię, pewność siebie, lepszą prezencję i bardziej zdecydowany sposób funkcjonowania. Transformacja była zauważalna również dla ludzi wokół niego.",
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
  eyebrow: "CASE STUDY 02 · OSKAR",
  headline: "System nie kończył się wtedy, kiedy zaczynał się kolejny wyjazd.",
  transformation:
    "Przy częstych wyjazdach trwających nawet 2–3 tygodnie i bez stałego dostępu do siłowni Oskar zbudował proces, który zmieniał formę — ale nie przestawał działać.",
  metrics: [
    { value: "−16 kg", label: "masy ciała" },
    { value: "−24 cm", label: "w talii" },
    { value: "+1,5 kg", label: "masy mięśniowej" },
    { value: "6 mies.", label: "współpracy" },
  ],
  start:
    "Oskar pracuje w branży kolejowej i często funkcjonuje poza standardowym środowiskiem. Długie wyjazdy, stres i ograniczony dostęp do siłowni rozbijały klasyczne plany.",
  obstacle:
    "Plan oparty na idealnym tygodniu przestawał działać po zmianie miejsca i rytmu dnia.",
  mechanism:
    "W standardowych warunkach Oskar realizował właściwy plan treningowy. W wyjazdach system przechodził na rozwiązania możliwe w aktualnym środowisku, w tym trening z masą własnego ciała. Zmieniał się plan wykonania, nie kierunek procesu.",
  outcome:
    "Oskar deklarował poprawę energii, samopoczucia, pewności siebie i codziennego funkcjonowania oraz większe poczucie kontroli.",
  image: {
    // Źródło miało rozszerzenie .png przy zawartości JPEG — naprawione przy konwersji (AN2).
    base: "/cases/oskar",
    widths: [400, 600, 800],
    intrinsic: { w: 864, h: 1536 },
    alt: "Oskar przed rozpoczęciem współpracy i po niej — zestawienie sylwetki",
    caption: "Zestawienie sylwetki Oskara przed i po współpracy · materiał źródłowy",
  },
};

/** Sekcja R — finalne CTA po case studies. */
export const finalCta = {
  eyebrow: "TWÓJ PIERWSZY KROK",
  headline: "Przestań odkładać siebie na kolejny kwartał.",
  supporting:
    "Jeśli chcesz potraktować swoje ciało, energię i sposób funkcjonowania z taką samą powagą jak biznes, rozpocznij kwalifikację do The Control System 1 na 1.",
  microcopy:
    "Krótka aplikacja kwalifikacyjna. Jeśli zobaczymy dopasowanie, przejdziesz do wyboru terminu rozmowy online 1 na 1. Samo wypełnienie aplikacji nie gwarantuje rozmowy ani przyjęcia do programu.",
} as const;

/**
 * Zejście do Protokołu Resetu pod finalnym CTA.
 *
 * ODSTĘPSTWO OD BRIEFU, decyzja właściciela z 2026-08-15: sekcja G4 wyklucza
 * „darmowy protokół" z landingu, a G1 pilnuje jednej decyzji. Właściciel
 * przesądził, że /reset nie jest osobnym landingiem kampanijnym, więc musi mieć
 * wejście ze strony głównej.
 *
 * Celowo zwykły link, nie drugi przycisk: aplikacja zostaje jedyną dominującą
 * decyzją, a to jest wyjście dla osób, które nie są na nią gotowe.
 */
export const protocolBridge = {
  question: "Nie czujesz się jeszcze gotowy na proces 1 na 1?",
  linkLabel: "Zacznij od bezpłatnego 7-dniowego Protokołu Resetu",
} as const;

/** Sekcja S — footer. Oba disclaimery: DO FINALNEJ WERYFIKACJI PRAWNEJ. */
export const footer = {
  role: "Krystian Ćwik · Twórca The Control System",
  resultsDisclaimer:
    "Rezultaty są indywidualne i zależą między innymi od punktu startowego, stanu zdrowia oraz realizacji uzgodnionego procesu. Przedstawione case studies nie stanowią gwarancji identycznego wyniku.",
  healthDisclaimer:
    "Treści na stronie mają charakter informacyjny i nie stanowią diagnozy, porady medycznej ani zastępstwa konsultacji z lekarzem.",
} as const;
