interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  className?: string;
  surface?: boolean;
  children?: React.ReactNode;
}

/** Wrapper sekcji landingu — spójny rytm pionowy i nagłówki. */
export function Section({ id, eyebrow, title, intro, className = "", surface, children }: SectionProps) {
  return (
    <section
      id={id}
      className={`py-16 sm:py-24 ${surface ? "bg-surface-2" : ""} ${className}`}
    >
      <div className="tcs-container">
        {(eyebrow || title || intro) && (
          <div className="mx-auto mb-10 max-w-prose text-center sm:mb-14">
            {eyebrow && <p className="tcs-eyebrow mb-3">{eyebrow}</p>}
            {title && (
              <h2 className="text-display-sm sm:text-display-md text-text-primary">{title}</h2>
            )}
            {intro && <p className="mt-4 text-text-secondary">{intro}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
