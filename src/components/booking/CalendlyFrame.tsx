"use client";

import { useEffect, useState } from "react";
import { useCalendlyBooked } from "./useCalendlyBooked";

/**
 * Kalendarz Calendly jako iframe na stronie wyniku aplikacji.
 *
 * `embed_domain` i `embed_type` są wymagane, żeby Calendly wysłał do nas
 * wiadomość o rezerwacji — bez nich nie da się przekierować na stronę
 * podziękowania. Adres składamy po stronie klienta, bo zależy od domeny.
 */
export function CalendlyFrame({ schedulingUrl }: { schedulingUrl: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useCalendlyBooked();

  useEffect(() => {
    const url = new URL(schedulingUrl);
    url.searchParams.set("embed_domain", window.location.hostname);
    url.searchParams.set("embed_type", "Inline");
    setSrc(url.toString());
  }, [schedulingUrl]);

  return (
    <iframe
      src={src ?? undefined}
      title="Wybór terminu rozmowy"
      className="mt-6 h-[720px] w-full rounded-[14px] border border-tcs-border bg-tcs-surface"
    />
  );
}
