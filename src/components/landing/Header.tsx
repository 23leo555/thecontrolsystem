"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import { site } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";

/** Header — logo po lewej, jedno CTA po prawej, sticky po pierwszym scrollu. Sekcja 6. */
export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-150 ${
        scrolled ? "border-b border-border bg-background/85 backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="tcs-container flex h-16 items-center justify-between gap-4">
        <Link href={site.routes.system} aria-label={site.brand} className="min-w-0">
          <Logo compactOnMobile />
        </Link>
        <ButtonLink
          href={site.routes.reset}
          variant="primary"
          size="md"
          className="shrink-0 whitespace-nowrap px-3 text-xs sm:px-5 sm:text-sm"
          onClick={() => track("cta_reset_click", { location: "header" })}
        >
          {/* Krótszy wariant na wąskich ekranach — pełny label nie mieści się przy 320px. */}
          <span className="hidden min-[400px]:inline">{site.cta.protocolShort}</span>
          <span className="min-[400px]:hidden">{site.cta.protocolCompact}</span>
        </ButtonLink>
      </div>
    </header>
  );
}
