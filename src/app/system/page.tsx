import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { VslPlaceholder } from "@/components/landing/VslPlaceholder";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { PageViewTracker } from "@/components/landing/PageViewTracker";
import {
  ProblemSection,
  Result90Section,
  WhyFailSection,
  ModelSection,
  ProcessSection,
  CaseStudiesSection,
  AuthorSection,
  GuaranteeSection,
  FinalCtaSection,
} from "@/components/landing/Sections";

export const metadata: Metadata = {
  title: "Odzyskaj kontrolę nad ciałem, energią i życiem w 90 dni",
  alternates: { canonical: "/system" },
};

/**
 * Landing page /system — kolejność sekcji wg sekcji 6 briefu.
 * 1 Hero · 2 Problem · 3 Rezultat · 4 VSL · 5 Dlaczego · 6 Model · 7 Proces
 * 8 Case studies · 9 Autor · 10 Gwarancja · 11 FAQ · 12 Finalne CTA · 13 Footer
 */
export default function SystemPage() {
  return (
    <>
      <PageViewTracker event="page_view_system" />
      <Header />
      <main id="main">
        <Hero />
        <ProblemSection />
        <Result90Section />
        <VslPlaceholder />
        <WhyFailSection />
        <ModelSection />
        <ProcessSection />
        <CaseStudiesSection />
        <AuthorSection />
        <GuaranteeSection />
        <Faq />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}
