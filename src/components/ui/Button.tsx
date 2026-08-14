import Link from "next/link";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg" | "cta";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold leading-none text-center transition-colors duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  /**
   * Primary = akcent aplikacji (elektryczny indygo), tekst w kolorze tła.
   * Ciemny tekst na jasnym akcencie daje 5.3:1 — biały dałby 3.9:1 i nie
   * spełniałby WCAG AA dla tekstu tej wielkości.
   * Delikatne dwutonowe przejście, bez efektu glossy (brief sekcja 6).
   */
  primary:
    "bg-gradient-to-b from-primary-glow to-primary text-background shadow-cta hover:brightness-[1.07] active:translate-y-px focus-visible:shadow-gold-focus",
  // Secondary = spokojny, obrys.
  secondary:
    "border border-border bg-surface/60 text-text-primary hover:bg-surface focus-visible:shadow-gold-focus",
  ghost: "text-text-secondary hover:text-text-primary",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-4 text-sm sm:text-base min-h-[52px]",
  /** Główne CTA: min 56px na mobile, 58–64px na desktopie (brief sekcja 6). */
  cta: "px-6 text-[0.9375rem] sm:text-base min-h-[56px] sm:min-h-[60px] tracking-[0.04em]",
};

export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

/** Link stylizowany jak przycisk (CTA nawigacyjne). */
export function ButtonLink({
  href,
  variant = "primary",
  size = "lg",
  className = "",
  children,
  onClick,
}: ButtonProps & { href: string; onClick?: () => void }) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  // Pliki statyczne (np. /protokol-resetu.pdf) idą zwykłym <a> — next/link
  // próbowałby nawigacji klienckiej do trasy, której nie ma.
  const isFile = /\.[a-z0-9]{2,4}$/i.test(href.split("?")[0]!);
  const isInternal = href.startsWith("/") && !isFile;
  if (isInternal) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} onClick={onClick}>
      {children}
    </a>
  );
}

/** Zwykły <button> — stany: default/hover/focus/disabled/loading. */
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps &
    React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }
>(function Button(
  { variant = "primary", size = "lg", className = "", children, loading, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});
