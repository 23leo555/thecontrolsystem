"use client";

import type { Question, AnswerValue } from "@/lib/questions";

/**
 * Pojedynczy ekran pytania (sekcja 9).
 * Karty odpowiedzi ≥52px, wyraźny stan selected, pełna obsługa klawiatury.
 */
export function QuestionScreen({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  return (
    <div>
      <h1 className="text-display-sm text-text-primary">{question.prompt}</h1>
      {question.help && <p className="mt-3 text-sm text-text-secondary">{question.help}</p>}

      <div className="mt-8">
        {question.type === "single" && (
          <SingleChoice question={question} value={value as string | undefined} onChange={onChange} />
        )}
        {question.type === "multi" && (
          <MultiChoice question={question} value={(value as string[]) ?? []} onChange={onChange} />
        )}
        {question.type === "scale" && (
          <ScaleChoice question={question} value={value as number | undefined} onChange={onChange} />
        )}
        {question.type === "textarea" && (
          <TextAnswer question={question} value={(value as string) ?? ""} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

const cardBase =
  "flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-gold-focus";
const cardIdle = "border-border bg-surface hover:bg-surface-2 text-text-primary";
const cardSelected = "border-gold bg-gold/10 text-text-primary";

function SingleChoice({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  return (
    <div role="radiogroup" aria-label={question.prompt} className="space-y-3">
      {question.options?.map((o) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.id)}
            className={`${cardBase} ${selected ? cardSelected : cardIdle}`}
          >
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                selected ? "border-gold" : "border-text-secondary/40"
              }`}
            >
              {selected && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
            </span>
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MultiChoice({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string[];
  onChange: (v: AnswerValue) => void;
}) {
  const max = question.maxSelect;
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
      return;
    }
    if (max && value.length >= max) return; // limit zaznaczeń
    onChange([...value, id]);
  };

  return (
    <div className="space-y-3">
      {question.options?.map((o) => {
        const selected = value.includes(o.id);
        const blocked = !selected && !!max && value.length >= max;
        return (
          <button
            key={o.id}
            type="button"
            role="checkbox"
            aria-checked={selected}
            disabled={blocked}
            onClick={() => toggle(o.id)}
            className={`${cardBase} ${selected ? cardSelected : cardIdle} ${
              blocked ? "opacity-40" : ""
            }`}
          >
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                selected ? "border-gold bg-gold" : "border-text-secondary/40"
              }`}
            >
              {selected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 13l4 4L19 7" stroke="#0d0f12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span>{o.label}</span>
          </button>
        );
      })}
      {max && (
        <p className="pt-1 text-sm text-text-secondary">
          Wybrano {value.length} z {max}.
        </p>
      )}
    </div>
  );
}

function ScaleChoice({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: number | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  const min = question.min ?? 1;
  const max = question.max ?? 10;
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <div role="radiogroup" aria-label={question.prompt} className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {items.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={String(n)}
              onClick={() => onChange(n)}
              className={`grid h-14 place-items-center rounded-xl border font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-gold-focus ${
                selected ? "border-gold bg-gold/10 text-gold" : "border-border bg-surface text-text-primary hover:bg-surface-2"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-xs text-text-secondary">
        <span>{question.minLabel}</span>
        <span>{question.maxLabel}</span>
      </div>
    </div>
  );
}

function TextAnswer({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: AnswerValue) => void;
}) {
  const minLength = question.minLength ?? 0;
  const maxLength = question.maxLength ?? 600;
  const tooShort = value.length > 0 && value.length < minLength;

  return (
    <div>
      <label htmlFor="answer-text" className="sr-only">
        {question.prompt}
      </label>
      <textarea
        id="answer-text"
        value={value}
        maxLength={maxLength}
        rows={6}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby="answer-text-help"
        className="w-full rounded-xl border border-border bg-surface p-4 text-text-primary placeholder:text-text-secondary/50 focus-visible:outline-none focus-visible:shadow-gold-focus"
        placeholder="Napisz własnymi słowami…"
      />
      <p id="answer-text-help" className="mt-2 flex justify-between text-sm">
        <span className={tooShort ? "text-danger" : "text-text-secondary"}>
          {tooShort ? `Jeszcze ${minLength - value.length} znaków.` : `Minimum ${minLength} znaków.`}
        </span>
        <span className="text-text-secondary/70">
          {value.length}/{maxLength}
        </span>
      </p>
    </div>
  );
}
