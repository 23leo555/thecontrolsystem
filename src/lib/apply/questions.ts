/**
 * Definicja ankiety kwalifikacyjnej /apply — druga generacja (2026-08-16).
 *
 * Zastępuje poprzedni, punktowany zestaw 15 pytań. Ta wersja nie ma scoringu —
 * kwalifikacja opiera się wyłącznie na dwóch twardych bramkach w `scoring.ts`
 * (płeć, dochód). Pytania poniżej mają jeden cel: dać Krystianowi materiał do
 * przygotowania się do rozmowy, nie punkty do zsumowania.
 *
 * Zasady:
 * - jedno pytanie = jeden ekran,
 * - NIE pytamy o diagnozy, depresję ani wyniki badań,
 * - dwa pytania otwarte (whyFailed, goal) celowo nie mają automatycznej oceny.
 */

export type QuestionId =
  | "age"
  | "role"
  | "workMode"
  | "controlArea"
  | "duration"
  | "attempts"
  | "whyFailed"
  | "blocker"
  | "goal"
  | "whyNow"
  | "readiness"
  | "gender"
  | "income"
  | "name"
  | "email"
  | "phone";

export type AnswerValue = string | string[] | number | { first: string; last: string };
export type Answers = Partial<Record<QuestionId, AnswerValue>>;

interface Option {
  value: string;
  label: string;
}

export interface Question {
  id: QuestionId;
  /** Numer ekranu widoczny w pasku postępu („Krok X z 16"). */
  step: number;
  question: string;
  /** Kontekst pod pytaniem. */
  context?: string;
  kind: "single" | "multi" | "text" | "name" | "email" | "phone";
  options?: Option[];
  /** Opcja wykluczająca pozostałe (checkbox „nic konkretnego" itp.). */
  exclusiveOption?: string;
  /** Wartość opcji, która odsłania pole tekstowe na tym samym ekranie. */
  revealsTextField?: string;
  minLength?: number;
  maxLength?: number;
}

export const QUESTIONS: Question[] = [
  {
    id: "age",
    step: 1,
    question: "Ile masz lat?",
    kind: "single",
    options: [
      { value: "under_30", label: "Poniżej 30" },
      { value: "30_39", label: "30–39" },
      { value: "40_49", label: "40–49" },
      { value: "50_59", label: "50–59" },
      { value: "60_plus", label: "60 i więcej" },
    ],
  },
  {
    id: "role",
    step: 2,
    question: "Co najlepiej opisuje Twoją obecną rolę zawodową?",
    context: "Interesuje nas poziom odpowiedzialności, nie tytuł na wizytówce.",
    kind: "single",
    revealsTextField: "other",
    options: [
      { value: "owner", label: "Prowadzę własną firmę / jestem przedsiębiorcą" },
      { value: "exec", label: "Zarządzam firmą lub zespołem (C-level, dyrektor, kierownik)" },
      { value: "specialist", label: "Pracuję jako wysoko wykwalifikowany specjalista lub ekspert" },
      { value: "other", label: "Inna sytuacja zawodowa" },
    ],
  },
  {
    id: "workMode",
    step: 3,
    question: "Jak wygląda Twój typowy tydzień pracy?",
    kind: "single",
    options: [
      { value: "stable", label: "Stabilny, przewidywalny grafik" },
      { value: "intense", label: "Intensywny, dużo godzin, ale w jednym miejscu" },
      { value: "variable", label: "Zmienny — częste wyjazdy, delegacje albo nieprzewidywalny grafik" },
      { value: "crisis", label: "Permanentnie w trybie kryzysowym, bez stałego rytmu" },
    ],
  },
  {
    id: "controlArea",
    step: 4,
    question: "W którym obszarze najbardziej brakuje Ci dziś kontroli?",
    context: "Wybierz to, co najlepiej opisuje Twoją obecną sytuację.",
    kind: "single",
    options: [
      { value: "body", label: "Sylwetka i kondycja fizyczna" },
      { value: "energy", label: "Energia — jestem ciągle zmęczony" },
      { value: "sleep", label: "Sen i regeneracja" },
      { value: "training", label: "Regularność treningu — zaczynam i wypadam z rytmu" },
      { value: "food", label: "Jedzenie — jem nieregularnie albo pod wpływem stresu" },
      { value: "chaos", label: "Organizacja dnia — życie jest chaotyczne" },
      { value: "combo", label: "To połączenie kilku z powyższych" },
    ],
  },
  {
    id: "duration",
    step: 5,
    question: "Od jak dawna to trwa?",
    kind: "single",
    options: [
      { value: "lt_6m", label: "Mniej niż 6 miesięcy" },
      { value: "6_12m", label: "6–12 miesięcy" },
      { value: "1_3y", label: "1–3 lata" },
      { value: "gt_3y", label: "Ponad 3 lata" },
    ],
  },
  {
    id: "attempts",
    step: 6,
    question: "Co już próbowałeś?",
    context: "Zaznacz wszystko, co pasuje.",
    kind: "multi",
    exclusiveOption: "none",
    options: [
      { value: "solo_training", label: "Trenowałem samodzielnie" },
      { value: "diet_app", label: "Próbowałem diety lub aplikacji" },
      { value: "personal_trainer", label: "Współpracowałem z trenerem personalnym" },
      { value: "online_coaching", label: "Korzystałem z coachingu online" },
      { value: "ready_program", label: "Kupiłem gotowy plan albo program" },
      { value: "several", label: "Kilka z powyższych jednocześnie" },
      { value: "none", label: "Nic konkretnego — dopiero zaczynam" },
    ],
  },
  {
    id: "whyFailed",
    step: 7,
    question: "Jak myślisz, dlaczego to wcześniej nie zadziałało na dłużej?",
    kind: "text",
    minLength: 20,
    maxLength: 800,
  },
  {
    id: "blocker",
    step: 8,
    question: "Co dziś najbardziej stoi Ci na przeszkodzie?",
    kind: "single",
    revealsTextField: "other",
    options: [
      { value: "work_time", label: "Brak czasu z powodu pracy" },
      { value: "travel", label: "Częste podróże albo zmienny harmonogram" },
      { value: "no_energy", label: "Brak energii, żeby cokolwiek zacząć" },
      { value: "no_plan", label: "Brak planu dopasowanego do mojego życia" },
      { value: "consistency", label: "Trudność z utrzymaniem konsekwencji" },
      { value: "other", label: "Coś innego" },
    ],
  },
  {
    id: "goal",
    step: 9,
    question: "Gdybyś za 90 dni odzyskał pełną kontrolę, co dokładnie by się zmieniło?",
    kind: "text",
    minLength: 20,
    maxLength: 800,
  },
  {
    id: "whyNow",
    step: 10,
    question: "Co sprawia, że rozważasz to właśnie teraz?",
    kind: "single",
    revealsTextField: "other",
    options: [
      { value: "health", label: "Zdrowie zaczyna na to wskazywać" },
      { value: "event", label: "Zbliża się coś ważnego (wydarzenie, cel, deadline)" },
      { value: "tired_of_waiting", label: "Mam dość odkładania tego w czasie" },
      { value: "other", label: "Coś innego" },
    ],
  },
  {
    id: "readiness",
    step: 11,
    question: "Jak opisałbyś swoją gotowość do rozpoczęcia?",
    kind: "single",
    options: [
      { value: "ready_now", label: "Jestem gotów zacząć od razu, jeśli program mi odpowiada" },
      { value: "considering_soon", label: "Poważnie rozważam zmianę w najbliższych tygodniach" },
      { value: "analyzing", label: "Analizuję możliwości, jeszcze nic nie zdecydowałem" },
      { value: "browsing", label: "Na razie zbieram informacje" },
    ],
  },
  {
    id: "gender",
    step: 12,
    question: "Zaznacz, co Cię dotyczy",
    kind: "single",
    options: [
      { value: "male", label: "Mężczyzna" },
      { value: "female", label: "Kobieta" },
    ],
  },
  {
    id: "income",
    step: 13,
    question: "Jaki jest Twój obecny miesięczny dochód?",
    context:
      "Chodzi o Twój osobisty dochód, nie przychód firmy. Jeśli prowadzisz firmę i dochód bywa zmienny, wskaż wartość typową dla ostatnich miesięcy.",
    kind: "single",
    // UWAGA: ta odpowiedź NIGDY nie trafia do GA4, GTM, pikseli ani treści
    // zwykłego e-maila. Filtr jest w src/lib/analytics.ts.
    options: [
      { value: "lt_15k", label: "Poniżej 15 000 zł" },
      { value: "15_20k", label: "15 000–19 999 zł" },
      { value: "20_30k", label: "20 000–29 999 zł" },
      { value: "30_50k", label: "30 000–49 999 zł" },
      { value: "gte_50k", label: "50 000 zł i więcej" },
    ],
  },
  {
    id: "name",
    step: 14,
    question: "Jak masz na imię i nazwisko?",
    kind: "name",
    minLength: 2,
    maxLength: 60,
  },
  {
    id: "email",
    step: 15,
    question: "Na jaki adres mamy wysłać potwierdzenie i informację o kolejnym kroku?",
    kind: "email",
    maxLength: 254,
  },
  {
    id: "phone",
    step: 16,
    question: "Jaki jest Twój numer telefonu?",
    context: "Użyjemy go wyłącznie w związku z Twoją aplikacją i ewentualną rozmową.",
    kind: "phone",
  },
];

export const TOTAL_STEPS = QUESTIONS.length;

export function getQuestion(id: QuestionId): Question {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Nieznane pytanie: ${id}`);
  return q;
}
