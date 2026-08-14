import Image from "next/image";

/**
 * Logo The Control System — realny znak marki z paczki assetów.
 * Plik `/brand/tcs-logo.webp` ma kołową maskę alfa, więc siada zarówno na tle
 * strony, jak i na jaśniejszych powierzchniach (karty, banner zgód).
 */
export function Logo({
  className = "",
  compactOnMobile = false,
  /** Rozmiar znaku w px — wordmark skaluje się razem z nim. */
  size = 36,
}: {
  className?: string;
  /** Chowa napis poniżej 400px (header /system, żeby CTA zmieściło się przy 320px). */
  compactOnMobile?: boolean;
  size?: number;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/brand/tcs-logo.webp"
        alt=""
        aria-hidden
        width={256}
        height={256}
        priority
        style={{ width: size, height: size }}
        className="shrink-0"
      />
      <span
        className={`font-display text-sm font-bold tracking-[0.14em] text-text-primary ${
          compactOnMobile ? "hidden min-[400px]:inline" : ""
        }`}
      >
        THE CONTROL SYSTEM
      </span>
    </span>
  );
}
