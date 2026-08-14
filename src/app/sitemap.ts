import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    site.routes.system,
    site.routes.reset,
    site.routes.application,
    site.routes.privacy,
    site.routes.cookies,
    site.routes.terms,
  ];
  return paths.map((p) => ({
    url: `${site.url}${p}`,
    lastModified: now,
    changeFrequency: "monthly",
    // /reset jest głównym celem ruchu z Instagrama — traktujemy na równi z /system.
    priority: p === site.routes.system || p === site.routes.reset ? 1 : 0.6,
  }));
}
