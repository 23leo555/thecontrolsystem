import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import { site } from "@/lib/site";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import "./globals.css";

// Body — Manrope (globals.css: body font-family).
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

// Nagłówki — Sora (globals.css: h1–h4 oraz tailwind fontFamily.display).
const sora = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "The Control System — odzyskaj kontrolę nad ciałem, energią i życiem",
    template: "%s | The Control System",
  },
  description:
    "Prywatny mentoring premium dla mężczyzn działających na wysokim poziomie zawodowym. W 90 dni odzyskaj kontrolę nad sylwetką, energią i codziennym funkcjonowaniem.",
  applicationName: site.name,
  authors: [{ name: site.author }],
  // Domyślny canonical; każda strona nadpisuje go własnym (landing → "/", AL1).
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: site.url,
    siteName: site.name,
    title: "The Control System by Krystian Ćwik",
    description:
      "System selekcji, nie agresywny formularz. Odzyskaj kontrolę nad ciałem, energią i życiem w 90 dni.",
    // Obrazek OG generuje app/opengraph-image.tsx; favicon — app/icon.tsx.
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#010205",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${manrope.variable} ${sora.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-background"
        >
          Przejdź do treści
        </a>
        {children}
        <ConsentBanner />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
