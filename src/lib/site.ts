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

  /**
   * Strona z pełnymi warunkami gwarancji (brief: /control-reset-90, bloker P0).
   *
   * Warunków jeszcze nie ma — musi je dostarczyć właściciel i zatwierdzić
   * prawnik. Do tego czasu link w stopce jest ukryty, bo prowadził w 404,
   * a hero obiecuje zwrot „zgodnie z warunkami gwarancji".
   * Po opublikowaniu strony: NEXT_PUBLIC_CONTROL_RESET_90_LIVE=true.
   */
  controlReset90Live: process.env.NEXT_PUBLIC_CONTROL_RESET_90_LIVE === "true",

  /**
   * VSL (brief sekcja M3). Master 311 MB nie trafia do repo ani do deployu —
   * na Vercel Blob leży wersja 720p/28,8 MB, mieszcząca się w budżecie <=30 MB.
   * Poster jest statyczny, więc pierwszy render nie czeka na sieć.
   */
  vsl: {
    src:
      process.env.NEXT_PUBLIC_VSL_URL ??
      "https://vrbicbwiimyu2c2q.public.blob.vercel-storage.com/vsl/the-control-system-vsl-720p.mp4",
    poster: "/vsl/poster",
    /** Napisy pl.vtt — bloker P0 (AN1). Player pokazuje track dopiero, gdy plik istnieje. */
    captions: process.env.NEXT_PUBLIC_VSL_CAPTIONS ?? null,
    durationLabel: "4:43",
    durationSeconds: 283,
  },

  routes: {
    /** Landing wg briefu v1.0 stoi pod „/". `/system` przekierowuje tu 308. */
    home: "/",
    apply: "/apply",
    legal: "/legal",
    controlReset90: "/control-reset-90",

    /**
     * Alias historyczny. Landing przeniósł się spod /system na "/" (brief I1),
     * więc wszystkie stare linki wewnętrzne prowadzą teraz wprost do korzenia
     * i nie przechodzą przez redirect.
     */
    system: "/",
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
