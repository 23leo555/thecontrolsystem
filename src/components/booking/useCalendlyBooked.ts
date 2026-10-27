"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { site } from "@/lib/site";

/**
 * Po zarezerwowaniu terminu w osadzonym Calendly przenosi na stronę
 * podziękowania. Calendly wysyła do strony-rodzica wiadomość
 * `calendly.event_scheduled` (postMessage) — reagujemy tylko na nią
 * i tylko z domeny calendly.com.
 */
export function useCalendlyBooked(applicationId?: string) {
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!/^https:\/\/([a-z0-9-]+\.)*calendly\.com$/.test(e.origin)) return;
      const data = e.data as { event?: string } | null;
      if (data?.event !== "calendly.event_scheduled") return;
      track("booking_complete", applicationId ? { application_id: applicationId } : {});
      window.location.assign(site.routes.callThanks);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [applicationId]);
}
