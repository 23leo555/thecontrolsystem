"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { readConsent, onConsentChange } from "@/lib/consent";

/**
 * Skrypty GA4 i Meta Pixel — montowane DOPIERO po zgodzie (sekcje 21/22).
 * Przed decyzją użytkownika żaden z nich nie trafia do DOM, więc nie ma
 * ani żądań sieciowych, ani ciasteczek third-party.
 */
export function AnalyticsScripts() {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const apply = (c: { analytics: boolean; marketing: boolean } | null) => {
      setAnalytics(c?.analytics ?? false);
      setMarketing(c?.marketing ?? false);
    };
    apply(readConsent());
    return onConsentChange(apply);
  }, []);

  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {analytics && ga4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('consent', 'default', {
                ad_storage: '${marketing ? "granted" : "denied"}',
                ad_user_data: '${marketing ? "granted" : "denied"}',
                ad_personalization: '${marketing ? "granted" : "denied"}',
                analytics_storage: 'granted'
              });
              gtag('config', '${ga4}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {marketing && pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixel}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
