"use client";

import { ButtonLink } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import { site } from "@/lib/site";

type Layout = "row" | "stack";

/** Para CTA: Primary → /reset (Protokół), Secondary → /aplikacja. Sekcja 6. */
export function CtaButtons({
  layout = "row",
  primaryLabel = site.cta.protocolPrimary,
  secondaryLabel = site.cta.applicationSecondary,
  className = "",
}: {
  layout?: Layout;
  primaryLabel?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full gap-3 ${
        layout === "row" ? "flex-col sm:flex-row sm:flex-wrap" : "flex-col"
      } ${className}`}
    >
      <ButtonLink
        href={site.routes.reset}
        variant="primary"
        size="lg"
        onClick={() => track("cta_reset_click", { location: layout })}
        className="w-full sm:w-auto"
      >
        {primaryLabel}
      </ButtonLink>
      <ButtonLink
        href={site.routes.application}
        variant="secondary"
        size="lg"
        onClick={() => track("cta_application_click", { location: layout })}
        className="w-full sm:w-auto"
      >
        {secondaryLabel}
      </ButtonLink>
    </div>
  );
}
