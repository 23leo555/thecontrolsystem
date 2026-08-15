/**
 * Definicja 15 pytań aplikacji — sekcja U briefu wdrożeniowego v1.0.
 *
 * Zasady z U0:
 * - jedno pytanie = jeden ekran,
 * - scoring jest ukryty przed użytkownikiem,
 * - NIE pytamy o diagnozy, depresję ani wyniki badań (szczególne kategorie
 *   danych zdrowotnych nie mają prawa pojawić się na etapie sprzedażowym),
 * - U1-U15 są obowiązkowe.
 */

export type QuestionId =
  | "age"
  | "role"
  | "environment"
  | "goal"
  | "impact"
  | "duration"
  | "attempts"
  | "urgency"
  | "process"
  | "decision"
  | "income"
  | "motivation"
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
  /** Numer ekranu widoczny w pasku postępu („Krok X z 15"). */
  step: number;
  question: string;
  /** Kontekst pod pytaniem — max 160 znaków (T3). */
  context?: string;
  kind: "single" | "multi" | "scale" | "text" | "name" | "email" | "phone";
  options?: Option[];
  /** Dla multi: maksymalna liczba zaznaczeń. */
  maxSelect?: number;
  /** Opcja wykluczająca pozostałe (U3 „Żaden z powyższych"). */
  exclusiveOption?: string;
  /** Opcja odsłaniająca pole tekstowe na tym samym ekranie (W1). */
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
      { value: "under_23", label: "Poniżej 23" },
      { value: "23_29", label: "23–29" },
      { value: "30_39", label: "30–39" },
      { value: "40_49", label: "40–49" },
      { value: "50_59", label: "50–59" },
      { value: "60_plus", label: "60 lub więcej" },
    ],
  },
  {
    id: "role",
    step: 2,
    question: "Który opis najlepiej odpowiada Twojej sytuacji zawodowej?",
    context: "Interesuje nas poziom odpowiedzialności, nie tytuł na wizytówce.",
    kind: "single",
    revealsTextField: "other",
    options: [
      { value: "owner", label: "Prowadzę firmę / jestem właścicielem" },
      { value: "ceo", label: "CEO / zarząd" },
      { value: "manager", label: "Manager / lider" },
      { value: "specialist", label: "Specjalista z dużą odpowiedzialnością" },
      { value: "other", label: "Inna sytuacja" },
    ],
  },
  {
    id: "environment",
    step: 3,
    question: "Które elementy najbardziej utrudniają Ci utrzymanie regularności?",
    kind: "multi",
    maxSelect: 3,
    exclusiveOption: "none",
    options: [
      { value: "long_days", label: "Długie dni pracy" },
      { value: "irregular", label: "Nieregularny kalendarz" },
      { value: "travel", label: "Częste wyjazdy" },
      { value: "dining", label: "Restauracje / spotkania biznesowe" },
      { value: "family", label: "Obowiązki rodzinne" },
      { value: "stress", label: "Wysoki stres i presja" },
      { value: "none", label: "Żaden z powyższych" },
    ],
  },
  {
    id: "goal",
    step: 4,
    question: "Jaki rezultat w pierwszych 90 dniach jest dla Ciebie najważniejszy?",
    kind: "single",
    options: [
      { value: "waist", label: "Zredukować brzuch i obwód talii" },
      { value: "energy", label: "Odzyskać energię i jakość funkcjonowania" },
      { value: "athletic", label: "Zbudować bardziej atletyczną sylwetkę" },
      { value: "system", label: "Wreszcie utrzymać regularny system" },
      { value: "unsure", label: "Nie potrafię jeszcze wskazać jednego celu" },
    ],
  },
  {
    id: "impact",
    step: 5,
    question: "Na ile obecna sytuacja wpływa na Twoją pewność siebie, energię i pracę?",
    kind: "scale",
    // Etykiety tekstowe są obowiązkowe — sam kolor nie może nieść znaczenia (U5, a11y).
    options: [
      { value: "1", label: "1 — wpływ jest niewielki" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5 — wpływ jest bardzo duży" },
    ],
  },
  {
    id: "duration",
    step: 6,
    question: "Jak długo ten problem trwa?",
    kind: "single",
    options: [
      { value: "lt_3m", label: "Krócej niż 3 miesiące" },
      { value: "3_12m", label: "3–12 miesięcy" },
      { value: "1_3y", label: "1–3 lata" },
      { value: "gt_3y", label: "Dłużej niż 3 lata" },
    ],
  },
  {
    id: "attempts",
    step: 7,
    question: "Które zdanie najlepiej opisuje Twoje dotychczasowe próby?",
    kind: "single",
    options: [
      { value: "none", label: "Jeszcze nie podjąłem konkretnej próby" },
      { value: "one_plan", label: "Miałem jeden plan, ale nie utrzymałem go" },
      {
        value: "many",
        label:
          "Próbowałem kilku diet, trenerów lub aplikacji i efekty znikały, gdy życie się komplikowało",
      },
      {
        value: "regular_no_result",
        label: "Działam regularnie, ale obecny sposób nie daje potrzebnego rezultatu",
      },
    ],
  },
  {
    id: "urgency",
    step: 8,
    question: "Kiedy chcesz realnie rozpocząć zmianę?",
    kind: "single",
    options: [
      { value: "14d", label: "W ciągu 14 dni" },
      { value: "30d", label: "W ciągu 30 dni" },
      { value: "1_3m", label: "W ciągu 1–3 miesięcy" },
      { value: "gt_3m", label: "Później niż za 3 miesiące" },
      { value: "browsing", label: "Na razie tylko się rozglądam" },
    ],
  },
  {
    id: "process",
    step: 9,
    question:
      "Czy jesteś gotowy na proces obejmujący cotygodniową wideokonferencję, regularne raportowanie i wdrażanie uzgodnionych działań?",
    kind: "single",
    options: [
      { value: "yes", label: "Tak, jestem gotowy na wszystkie trzy elementy" },
      { value: "logistics_uncertain", label: "Tak, ale muszę najpierw potwierdzić logistykę spotkań" },
      { value: "no", label: "Nie, szukam rozwiązania bez regularnego zaangażowania" },
    ],
  },
  {
    id: "decision",
    step: 10,
    question: "Czy decyzję o rozpoczęciu współpracy możesz podjąć samodzielnie?",
    kind: "single",
    options: [
      { value: "self", label: "Tak" },
      { value: "joint", label: "Podejmuję ją wspólnie z drugą osobą, ale mogę zdecydować" },
      { value: "needs_approval", label: "Muszę najpierw uzyskać zgodę / skonsultować budżet" },
      { value: "not_ready", label: "Nie jestem gotowy podejmować decyzji" },
    ],
  },
  {
    id: "income",
    step: 11,
    question: "Jaki jest Twój średni miesięczny dochód netto?",
    context: "To pytanie służy wyłącznie ocenie dopasowania do programu premium 1 na 1.",
    kind: "single",
    // UWAGA: ta odpowiedź NIGDY nie trafia do GA4, GTM, pikseli ani treści
    // zwykłego e-maila (U11). Filtr jest w src/lib/analytics.ts.
    options: [
      { value: "lt_15k", label: "Poniżej 15 000 zł" },
      { value: "15_20k", label: "15 000–19 999 zł" },
      { value: "20_30k", label: "20 000–29 999 zł" },
      { value: "30_50k", label: "30 000–49 999 zł" },
      { value: "gte_50k", label: "50 000 zł lub więcej" },
    ],
  },
  {
    id: "motivation",
    step: 12,
    question: "Dlaczego chcesz odzyskać kontrolę właśnie teraz?",
    context:
      "Napisz konkretnie, co ma się zmienić i dlaczego nie chcesz odkładać tego na kolejny kwartał.",
    kind: "text",
    minLength: 30,
    maxLength: 800,
    // Bez automatycznego NLP i bez oceny po słowach kluczowych (U12).
    // Odpowiedź służy rozmowie i Manual Review.
  },
  {
    id: "name",
    step: 13,
    question: "Jak masz na imię i nazwisko?",
    kind: "name",
    minLength: 2,
    maxLength: 60,
  },
  {
    id: "email",
    step: 14,
    question: "Na jaki adres mamy wysłać potwierdzenie i informację o kolejnym kroku?",
    kind: "email",
    maxLength: 254,
  },
  {
    id: "phone",
    step: 15,
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
