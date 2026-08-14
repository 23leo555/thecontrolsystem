"use client";

import { useEffect } from "react";
import Script from "next/script";
import { track } from "@/lib/analytics";

/**
 * Osadzenie Calendly (sekcja 13).
 * Prefill imienia i e-maila, żeby użytkownik nie wpisywał ich ponownie.
 * application_id przekazujemy w utm_content — wraca w webhooku i pozwala powiązać rezerwację.
 */
export function CalendlyEmbed({
  schedulingUrl,
  firstName,
  email,
  applicationId,
}: {
  schedulingUrl: string;
  firstName: string;
  email: string;
  applicationId: string;
}) {
  useEffect(() => {
    track("calendar_view", { application_id: applicationId });
  }, [applicationId]);

  const url = new URL(schedulingUrl);
  url.searchParams.set("name", firstName);
  url.searchParams.set("email", email);
  url.searchParams.set("utm_content", applicationId);
  // Dopasowanie widgetu do ciemnego motywu marki.
  url.searchParams.set("background_color", "0d0f12");
  url.searchParams.set("text_color", "ffffff");
  url.searchParams.set("primary_color", "c6a05a");
  url.searchParams.set("hide_gdpr_banner", "1");

  return (
    <>
      <div
        className="calendly-inline-widget min-h-[700px] w-full overflow-hidden rounded-2xl border border-border"
        data-url={url.toString()}
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
    </>
  );
}
