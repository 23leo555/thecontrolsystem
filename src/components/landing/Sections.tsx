import { Section } from "@/components/ui/Section";
import { CtaButtons } from "@/components/landing/CtaButtons";
import {
  problem,
  result90,
  whyFail,
  model,
  process,
  caseStudies,
  author,
  guarantee,
  finalCta,
} from "@/content/landing";

/** 2. Problem i napięcie */
export function ProblemSection() {
  return (
    <Section id="problem" eyebrow={problem.eyebrow} title={problem.title}>
      <div className="mx-auto max-w-prose space-y-4 text-text-secondary">
        {problem.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Section>
  );
}

/** 3. Rezultat 90 dni */
export function Result90Section() {
  return (
    <Section id="rezultat" eyebrow={result90.eyebrow} title={result90.title} surface>
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
        {result90.items.map((it) => (
          <div key={it.label} className="rounded-2xl border border-border bg-surface p-6">
            <p className="tcs-eyebrow mb-2">{it.label}</p>
            <p className="text-text-secondary">{it.text}</p>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-prose text-center text-sm text-text-secondary/80">
        {result90.disclaimer}
      </p>
    </Section>
  );
}

/** 5. Dlaczego wcześniejsze próby się rozpadają */
export function WhyFailSection() {
  return (
    <Section id="dlaczego" eyebrow={whyFail.eyebrow} title={whyFail.title}>
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
        {whyFail.reasons.map((r) => (
          <div key={r.title} className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="mb-2 text-lg font-bold text-text-primary">{r.title}</h3>
            <p className="text-text-secondary">{r.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** 6. Model Integracji Biologiczno-Behawioralnej */
export function ModelSection() {
  return (
    <Section id="model" eyebrow={model.eyebrow} title={model.title} intro={model.intro} surface>
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {model.pillars.map((p, i) => (
          <div key={p.name} className="rounded-2xl border border-border bg-surface p-6">
            <span className="mb-4 inline-grid h-9 w-9 place-items-center rounded-lg border border-blue/40 bg-surface-2 text-sm font-bold text-blue">
              {i + 1}
            </span>
            <h3 className="mb-1.5 text-lg font-bold text-text-primary">{p.name}</h3>
            <p className="text-sm text-text-secondary">{p.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** 7. Jak wygląda proces 90 dni */
export function ProcessSection() {
  return (
    <Section id="proces" eyebrow={process.eyebrow} title={process.title}>
      <ol className="mx-auto grid max-w-5xl gap-4 md:grid-cols-4">
        {process.steps.map((s) => (
          <li key={s.n} className="rounded-2xl border border-border bg-surface p-6">
            <span className="font-display text-2xl font-bold text-gold">{s.n}</span>
            <h3 className="mb-1.5 mt-3 text-lg font-bold text-text-primary">{s.name}</h3>
            <p className="text-sm text-text-secondary">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** 8. Case studies — placeholder */
export function CaseStudiesSection() {
  return (
    <Section id="historie" eyebrow={caseStudies.eyebrow} title={caseStudies.title} surface>
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
        {caseStudies.people.map((person) => (
          <div key={person.name} className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex aspect-[4/3] items-center justify-center border-b border-border bg-surface-2 text-sm text-text-secondary">
              Zdjęcie metamorfozy — placeholder
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-text-primary">{person.name}</h3>
              <p className="mt-1 text-sm text-text-secondary">{person.summary}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-prose text-center text-sm text-text-secondary/80">
        {caseStudies.note}
      </p>
    </Section>
  );
}

/** 9. O autorze */
export function AuthorSection() {
  return (
    <Section id="autor">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex h-full items-center justify-center text-center text-sm text-text-secondary">
            Realne zdjęcie Krystiana
            <br />
            (placeholder)
          </div>
        </div>
        <div>
          <p className="tcs-eyebrow mb-3">{author.eyebrow}</p>
          <h2 className="text-display-sm text-text-primary">{author.title}</h2>
          <div className="mt-4 space-y-4 text-text-secondary">
            {author.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/** 10. Gwarancja */
export function GuaranteeSection() {
  return (
    <Section id="gwarancja" eyebrow={guarantee.eyebrow} title={guarantee.title} surface>
      <p className="mx-auto max-w-prose text-center text-text-secondary">{guarantee.body}</p>
    </Section>
  );
}

/** 12. Finalne CTA */
export function FinalCtaSection() {
  return (
    <Section id="start" eyebrow={finalCta.eyebrow} title={finalCta.title} intro={finalCta.body}>
      <div className="mx-auto flex max-w-xl justify-center">
        <CtaButtons />
      </div>
    </Section>
  );
}
