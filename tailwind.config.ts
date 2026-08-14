import type { Config } from "tailwindcss";

/**
 * Design system landingu — paleta przeniesiona z aplikacji Lovable
 * (Control System Elite, „Midnight Indigo"), żeby lejek publiczny i produkt
 * wyglądały jak jeden system.
 *
 * Kolory podajemy jako literały hex (nie var()), bo tylko wtedy działają
 * modyfikatory krycia Tailwinda — `text-text-secondary/70` czy `bg-primary/10`.
 * Te same wartości leżą w globals.css jako zmienne CSS do użycia poza Tailwindem.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#010205",
        surface: "#060810",
        "surface-elevated": "#0a0e18",
        /** Alias historyczny — używany przez /system i /aplikacja. */
        "surface-2": "#0a0e18",
        secondary: "#141823",
        muted: "#0e111a",

        /** Akcent główny = elektryczny indygo z aplikacji. Jeden CTA na stronę. */
        primary: "#4f76ff",
        "primary-glow": "#5b9eff",
        /** Akcent złoty z briefu V2 — zapas, gdyby właściciel wrócił do rekomendacji. */
        gold: "#c6a25b",
        blue: "#4f76ff",

        "text-primary": "#f9fafc",
        "text-secondary": "#808791",
        foreground: "#f9fafc",
        "muted-foreground": "#808791",

        success: "#42c070",
        warning: "#efa810",
        danger: "#f53b4b",
        destructive: "#f53b4b",

        border: "rgba(45, 51, 64, 0.55)",

        /**
         * Paleta briefu wdrożeniowego v1.0, sekcja AF2 — obowiązuje na landingu `/`.
         * Celowo dodana OBOK tokenów powyżej, a nie zamiast nich: `/reset` i
         * `/aplikacja` zostają na indygo, landing przechodzi na złoto.
         */
        "tcs-bg": "#05080C", // bg-950, główne tło
        "tcs-bg-alt": "#0A1016", // bg-900, sekcje naprzemienne
        "tcs-surface": "#101820", // surface-800, karty
        "tcs-border": "#263440", // border-700
        "tcs-text": "#F4F6F8", // text-50
        "tcs-text-muted": "#A8B3BD", // text-300
        "tcs-gold": "#C9A96E", // accent-gold, CTA
        "tcs-gold-hover": "#D6BC88",
        "tcs-blue": "#8EDBFF", // focus
        "tcs-success": "#83C7A5",
        "tcs-error": "#F29A9A",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-manrope)", "sans-serif"],
      },
      fontSize: {
        // H1 desktop ~54–64px, mobile ~34–40px.
        "display-lg": ["clamp(2.125rem, 4.6vw + 1rem, 4rem)", { lineHeight: "1.04", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(1.75rem, 3.2vw + 0.9rem, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.025em" }],
        "display-sm": ["clamp(1.375rem, 1.8vw + 0.75rem, 1.875rem)", { lineHeight: "1.2", letterSpacing: "-0.018em" }],
      },
      maxWidth: {
        content: "72rem",
        prose: "42rem",
      },
      transitionDuration: {
        step: "200ms", // subtelne przejścia 150–220ms (brief sekcja 2).
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -16px rgba(0,0,0,0.55)",
        elegant: "0 24px 60px -28px rgba(79,118,255,0.45)",
        /** Ring focusowy CTA — nazwa historyczna, kolor akcentu aktualny. */
        "gold-focus": "0 0 0 2px #010205, 0 0 0 4px #5b9eff",
        cta: "0 10px 30px -12px rgba(79,118,255,0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
