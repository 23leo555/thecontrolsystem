/**
 * Wspólne tło całego landingu (poprawki 26.10.2026).
 *
 * Grafika mózgu jest przypięta do ekranu (`fixed`), więc ciągnie się pod całą
 * stroną zamiast kończyć się na hero. Gradienty przyciemniają ją na tyle, żeby
 * tekst zawsze miał pełny kontrast. `position: fixed` zamiast
 * `background-attachment: fixed`, bo to drugie nie działa na iOS.
 */
export function PageBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-tcs-bg">
      <picture>
        <source media="(min-width: 768px)" srcSet="/brand/tlo-desktop.webp" />
        <img
          src="/brand/tlo-mobile.webp"
          alt=""
          className="h-full w-full object-cover opacity-[0.34] md:opacity-[0.42]"
        />
      </picture>
      {/* Winieta: środek ekranu ciemniejszy, żeby tekst nie walczył z mózgiem. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(5,8,12,0.62)_0%,rgba(5,8,12,0.25)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-tcs-bg/40 via-transparent to-tcs-bg/70" />
    </div>
  );
}
