import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { site } from "@/lib/site";

/** Prosta, brandowa zaślepka dla tras budowanych w kolejnych etapach. */
export function Placeholder({
  title,
  description,
  note,
}: {
  title: string;
  description?: string;
  note?: string;
}) {
  return (
    <main id="main" className="grid min-h-screen place-items-center">
      <div className="tcs-container max-w-prose py-20 text-center">
        <Link href={site.routes.system} className="inline-flex" aria-label={site.brand}>
          <Logo />
        </Link>
        <h1 className="mt-10 text-display-sm text-text-primary">{title}</h1>
        {description && <p className="mt-4 text-text-secondary">{description}</p>}
        {note && (
          <p className="mt-6 rounded-xl border border-border bg-surface px-5 py-4 text-sm text-text-secondary/80">
            {note}
          </p>
        )}
        <div className="mt-10">
          <Link href={site.routes.system} className="text-sm text-gold hover:underline">
            ← Wróć na stronę główną
          </Link>
        </div>
      </div>
    </main>
  );
}
