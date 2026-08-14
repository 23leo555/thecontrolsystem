"use client";

import { ButtonLink } from "@/components/ui/Button";
import { track } from "@/lib/analytics";

/**
 * Pobranie PDF-a ze strony podziękowania.
 * Event `protocol_download` liczy realne kliknięcie, a nie samo wejście na stronę
 * (brief sekcja 22) — dlatego jest osobnym komponentem klienckim.
 */
export function DownloadButton({ href, label }: { href: string; label: string }) {
  return (
    <ButtonLink
      href={href}
      size="cta"
      className="w-full"
      onClick={() => track("protocol_download")}
    >
      {label}
    </ButtonLink>
  );
}
