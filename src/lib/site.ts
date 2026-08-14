/**
 * Globalna konfiguracja witryny.
 * Wszystkie kluczowe linki i dane brandu w jednym miejscu — edytowalne bez ruszania komponentów.
 */
export const site = {
  name: "The Control System",
  brand: "THE CONTROL SYSTEM by Krystian Ćwik",
  author: "Krystian Ćwik",
  ownerEmail: "krystian.cwik@thecontrolsystem.biz",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecontrolsystem.biz",
  instagram: "@krystian_cwik",
  instagramUrl: "https://instagram.com/krystian_cwik",

  /** Dane działalności — klauzula informacyjna i footer (brief sekcja 28). */
  company: {
    legalName: "Krystian Ćwik",
    address: "ul. Telefoniczna 21 lok. 152, 91-728 Łódź",
    nip: "7312089605",
    regon: "540285409",
  },

  /**
   * Wersja treści zgód zapisywana przy leadzie (brief sekcja 8 — rozliczalność).
   * Każda zmiana brzmienia zgody marketingowej = podbicie tej wartości.
   */
  consentVersion: "reset-2026-08",

  /**
   * Bridge „POZNAJ THE CONTROL SYSTEM 1:1" na stronie podziękowania.
   * Brief sekcja 16: sekcję ukryć do czasu publikacji /system.
   * Przełącznik: NEXT_PUBLIC_SYSTEM_PAGE_LIVE=true.
   */
  systemPageLive: process.env.NEXT_PUBLIC_SYSTEM_PAGE_LIVE === "true",

  routes: {
    system: "/system",
    reset: "/reset",
    resetThanks: "/reset/dziekuje",
    application: "/aplikacja",
    call: "/rozmowa",
    privacy: "/polityka-prywatnosci",
    cookies: "/cookies",
    terms: "/regulamin",
  },
  cta: {
    // Copy głównych CTA — NIE zmieniać bez zgody właściciela (sekcja 0).
    protocolPrimary: "ODBIERAM 7-DNIOWY PROTOKÓŁ RESETU",
    protocolShort: "ODBIERAM PROTOKÓŁ RESETU",
    /** Wariant na ekrany <400px — pełny label nie mieści się przy 320px. */
    protocolCompact: "PROTOKÓŁ RESETU",
    applicationSecondary: "SPRAWDŹ, CZY THE CONTROL SYSTEM JEST DLA MNIE",
  },
} as const;

export type Site = typeof site;
