"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";

/** 500 w stylistyce marki (sekcja 22). */
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="grid min-h-screen place-items-center">
      <div className="tcs-container max-w-prose py-20 text-center">
        <Link href={site.routes.system} aria-label={site.brand} className="inline-flex">
          <Logo />
        </Link>
        <h1 className="mt-10 text-display-sm">Coś poszło nie tak</h1>
        <p className="mt-4 text-text-secondary">
          Po naszej stronie wystąpił błąd. Spróbuj ponownie — jeśli problem się powtórzy, napisz na{" "}
          <a href={`mailto:${site.ownerEmail}`} className="text-gold underline">
            {site.ownerEmail}
          </a>
          .
        </p>
        <Button onClick={reset} className="mt-8">
          SPRÓBUJ PONOWNIE
        </Button>
      </div>
    </main>
  );
}
