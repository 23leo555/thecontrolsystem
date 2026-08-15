import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Sitemap wg sekcji AL1: obejmuje "/" i wymagane strony prawne.
 *
 * Lejek aplikacji jest świadomie POMINIĘTY — /apply i /apply/result/* mają
 * noindex, nofollow i nie mogą występować w mapie. To samo dotyczy /admin.
 *
 * /reset zostaje w mapie, bo lejek protokołu nadal działa i przyjmuje ruch
 * z zewnątrz, mimo że nowy landing go nie promuje.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: { path: string; priority: number }[] = [
    { path: site.routes.home, priority: 1 },
    { path: site.routes.reset, priority: 0.8 },
    { path: site.routes.privacy, priority: 0.4 },
    { path: site.routes.cookies, priority: 0.4 },
    { path: site.routes.terms, priority: 0.4 },
    { path: site.routes.legal, priority: 0.4 },
    // Warunki gwarancji dołączają do mapy dopiero po publikacji strony (P0).
    ...(site.controlReset90Live ? [{ path: site.routes.controlReset90, priority: 0.4 }] : []),
  ];

  return entries.map(({ path, priority }) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority,
  }));
}
