import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ApplicationFlow } from "@/components/application/ApplicationFlow";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Aplikacja kwalifikacyjna",
  description:
    "12 krótkich pytań. Sprawdź, czy The Control System jest właściwym kolejnym krokiem dla Ciebie.",
};

/**
 * /aplikacja — kwalifikacja (sekcja 9).
 * Bez menu i rozpraszających linków w trakcie formularza; logo prowadzi tylko do /system.
 */
export default function ApplicationPage() {
  return (
    <main id="main" className="min-h-screen">
      <div className="tcs-container max-w-2xl py-10 sm:py-14">
        <Link href={site.routes.system} aria-label={site.brand} className="inline-flex">
          <Logo />
        </Link>
        <div className="mt-10 sm:mt-14">
          <ApplicationFlow />
        </div>
      </div>
    </main>
  );
}
