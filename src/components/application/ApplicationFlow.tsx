"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { QuestionScreen } from "@/components/application/QuestionScreen";
import { ContactScreen } from "@/components/application/ContactScreen";
import { StatusScreen } from "@/components/application/StatusScreen";
import { questions, type Answers, type AnswerValue } from "@/lib/questions";
import { track, touchForSubmission } from "@/lib/analytics";

const STORAGE_KEY = "tcs_application_v1";
const TOTAL = questions.length;

type Phase = "intro" | "questions" | "contact" | "result";
type Status = "A" | "B" | "C";

/**
 * Kontroler aplikacji (sekcja 9).
 * Jedno pytanie = jeden ekran. Cofanie nie kasuje odpowiedzi.
 * Wynik pokazywany DOPIERO po finalnym submit — nigdy w połowie formularza.
 */
export function ApplicationFlow() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [status, setStatus] = useState<Status | null>(null);
  const [callUrl, setCallUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
  );

  // Odtworzenie sesji po odświeżeniu (sekcja 9/23).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { answers?: Answers; step?: number; phase?: Phase };
      if (saved.answers) setAnswers(saved.answers);
      if (typeof saved.step === "number") setStep(saved.step);
      if (saved.phase === "questions" || saved.phase === "contact") setPhase(saved.phase);
    } catch {
      /* uszkodzony wpis ignorujemy */
    }
  }, []);

  useEffect(() => {
    if (phase === "intro" || phase === "result") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step, phase }));
    } catch {
      /* brak miejsca / tryb prywatny */
    }
  }, [answers, step, phase]);

  const question = questions[step];
  const current = answers[question?.id];

  const isAnswered = useMemo(() => {
    if (!question) return false;
    const v = answers[question.id];
    if (question.type === "multi") return Array.isArray(v) && v.length > 0;
    if (question.type === "textarea")
      return typeof v === "string" && v.trim().length >= (question.minLength ?? 0);
    return v !== undefined && v !== null && v !== "";
  }, [question, answers]);

  const setAnswer = useCallback(
    (v: AnswerValue) => setAnswers((a) => ({ ...a, [question.id]: v })),
    [question],
  );

  const goNext = useCallback(() => {
    if (!isAnswered) return;
    track("application_step_complete", { step_id: question.id });
    if (step + 1 < TOTAL) {
      setStep((s) => s + 1);
    } else {
      setPhase("contact");
    }
  }, [isAnswered, question, step]);

  const goBack = useCallback(() => {
    if (phase === "contact") {
      setPhase("questions");
      setStep(TOTAL - 1);
      return;
    }
    if (step > 0) setStep((s) => s - 1);
  }, [phase, step]);

  // Enter przechodzi dalej — ale NIE na ekranach z textarea (sekcja 9).
  useEffect(() => {
    if (phase !== "questions" || question?.type === "textarea") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && isAnswered) {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, question, isAnswered, goNext]);

  useEffect(() => {
    if (phase === "questions" && question) {
      track("application_step_view", { step_id: question.id });
    }
  }, [phase, question]);

  function start() {
    track("application_start");
    setPhase("questions");
    setStep(0);
  }

  function onSubmitted(result: { status: Status; callUrl?: string; firstName: string }) {
    track("application_submit");
    setStatus(result.status);
    setCallUrl(result.callUrl ?? null);
    setFirstName(result.firstName);
    setPhase("result");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignoruj */
    }
  }

  if (phase === "intro") return <IntroScreen onStart={start} />;

  if (phase === "result" && status) {
    return <StatusScreen status={status} firstName={firstName} callUrl={callUrl} />;
  }

  if (phase === "contact") {
    return (
      <ContactScreen
        answers={answers}
        idempotencyKey={idempotencyKey}
        onBack={goBack}
        onSubmitted={onSubmitted}
        source={typeof window !== "undefined" ? touchForSubmission() : {}}
      />
    );
  }

  const progress = ((step + 1) / (TOTAL + 1)) * 100;

  return (
    <div>
      <ProgressBar percent={progress} />
      <p className="mt-6 text-sm text-text-secondary">
        Krok {step + 1} z {TOTAL}
      </p>

      {/* key wymusza remount → subtelne przejście między krokami */}
      <div key={question.id} className="mt-4 animate-[fadeIn_180ms_ease-out]">
        <QuestionScreen question={question} value={current} onChange={setAnswer} />
      </div>

      <div className="mt-10 flex items-center gap-4">
        <Button onClick={goNext} disabled={!isAnswered} className="flex-1 sm:flex-none sm:px-10">
          DALEJ
        </Button>
        {step > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-text-secondary underline-offset-4 hover:text-text-primary hover:underline focus-visible:outline-none focus-visible:shadow-gold-focus"
          >
            Wstecz
          </button>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full bg-surface"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Postęp aplikacji"
    >
      <div
        className="h-full bg-gold transition-[width] duration-step"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center">
      <h1 className="text-display-sm sm:text-display-md">
        Sprawdź, czy The Control System jest właściwym kolejnym krokiem dla Ciebie.
      </h1>
      <p className="mt-5 text-text-secondary">12 krótkich pytań. Około 3 do 5 minut.</p>
      <p className="mt-2 text-sm text-text-secondary/80">
        Odpowiedzi są analizowane dopiero po zakończeniu.
      </p>
      <Button onClick={onStart} className="mt-10 w-full sm:w-auto sm:px-12">
        ZACZYNAM APLIKACJĘ
      </Button>
    </div>
  );
}
