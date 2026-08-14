import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Step1Section } from "@/components/landing/Step1Section";
import { Step2Section } from "@/components/landing/Step2Section";
import { ProofSection } from "@/components/landing/ProofSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { Footer } from "@/components/landing/Footer";
import { PageViewTracker } from "@/components/landing/PageViewTracker";

/** Meta — finalne copy z sekcji AL2. Indeksacja wg AL1. */
export const metadata: Metadata = {
  title: "The Control System | Odzyskaj kontrolę w 90 dni",
  description:
    "Indywidualny system 1 na 1 dla zapracowanych mężczyzn 30+. Zredukuj brzuch, odzyskaj energię i dopasuj proces do realnego życia.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "The Control System — system dopasowany do Twojego życia",
    description:
      "Zobacz 4:43 materiał i sprawdź, czy możesz odzyskać kontrolę nad sylwetką, energią i funkcjonowaniem w ciągu pierwszych 90 dni.",
    url: "/",
    type: "website",
  },
};

/**
 * Landing page — sześć sekcji wg sekcji J briefu wdrożeniowego v1.0.
 *
 * 1 Hero (K) · 2 Krok 1 / VSL (L+M) · 3 Krok 2 (N+O)
 * 4 Dowód (P+Q) · 5 Finalne CTA (R) · 6 Footer (S)
 *
 * Czego tu celowo NIE MA (sekcja A2 — decyzje zamrożone):
 * ceny, checkoutu, newslettera, lead magnetu, sociali, publicznego Calendly,
 * bloga, FAQ i produktów pobocznych. Jedyna konwersja to aplikacja.
 */
export default function LandingPage() {
  return (
    <>
      <PageViewTracker event="page_view_landing" />
      <Header />
      <main id="main">
        <Hero />
        <Step1Section />
        <Step2Section />
        <ProofSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}
