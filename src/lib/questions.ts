/**
 * Pytania kwalifikacyjne Q1–Q12 — sekcja 10 briefu.
 * NIE dodawać/zmieniać pytań ani odpowiedzi bez zgody właściciela (sekcja 0/26).
 * ID odpowiedzi są stabilne i używane przez scoring (lib/scoring.ts) — nie zmieniać.
 */

export type QuestionId =
  | "q1" | "q2" | "q3" | "q4" | "q5" | "q6"
  | "q7" | "q8" | "q9" | "q10" | "q11" | "q12";

export type QuestionType = "single" | "multi" | "scale" | "textarea";

export interface Option {
  id: string;
  label: string;
}

export interface Question {
  id: QuestionId;
  type: QuestionType;
  prompt: string;
  help?: string;
  options?: Option[];
  /** multi: maksymalna liczba zaznaczeń */
  maxSelect?: number;
  /** scale */
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  /** textarea */
  minLength?: number;
  maxLength?: number;
}

export const questions: Question[] = [
  {
    id: "q1",
    type: "single",
    prompt: "Dla kogo składasz tę aplikację?",
    options: [
      { id: "self_male", label: "Dla siebie, jestem mężczyzną" },
      { id: "self_female", label: "Dla siebie, jestem kobietą" },
      { id: "other_person", label: "Dla innej osoby" },
    ],
  },
  {
    id: "q2",
    type: "single",
    prompt: "Ile masz lat?",
    options: [
      { id: "age_18_22", label: "18–22" },
      { id: "age_23_29", label: "23–29" },
      { id: "age_30_39", label: "30–39" },
      { id: "age_40_49", label: "40–49" },
      { id: "age_50_plus", label: "50 i więcej" },
    ],
  },
  {
    id: "q3",
    type: "single",
    prompt: "Które zdanie najlepiej opisuje Twój poziom odpowiedzialności zawodowej?",
    options: [
      { id: "owner", label: "Właściciel firmy lub wspólnik" },
      { id: "manager", label: "Zarządzam zespołem lub kluczowymi projektami" },
      { id: "expert", label: "Jestem wysoko wyspecjalizowanym ekspertem" },
      { id: "intense_low_resp", label: "Mam intensywną pracę, ale niewielką odpowiedzialność decyzyjną" },
      { id: "other", label: "Inne" },
    ],
  },
  {
    id: "q4",
    type: "multi",
    maxSelect: 3,
    prompt: "Co obecnie najbardziej odbiera Ci poczucie kontroli nad sobą?",
    help: "Wybierz maksymalnie 3.",
    options: [
      { id: "nadwaga", label: "Nadwaga" },
      { id: "brzuch", label: "Brzuch" },
      { id: "brak_energii", label: "Brak energii" },
      { id: "slaby_sen", label: "Słaby sen" },
      { id: "zmeczenie", label: "Zmęczenie" },
      { id: "koncentracja", label: "Koncentracja" },
      { id: "nieregularny_trening", label: "Nieregularny trening" },
      { id: "jedzenie", label: "Jedzenie" },
      { id: "regeneracja", label: "Regeneracja" },
      { id: "pewnosc_siebie", label: "Pewność siebie" },
      { id: "libido", label: "Libido" },
      { id: "ciagle_od_poczatku", label: "Ciągle zaczynanie od początku" },
      { id: "inne", label: "Inne" },
    ],
  },
  {
    id: "q5",
    type: "scale",
    min: 1,
    max: 10,
    minLabel: "Prawie wcale",
    maxLabel: "Bardzo mocno",
    prompt: "Jak mocno ten problem wpływa dziś na Twoje codzienne funkcjonowanie?",
  },
  {
    id: "q6",
    type: "single",
    prompt: "Od jak dawna realnie zmagasz się z tym problemem?",
    options: [
      { id: "lt_3m", label: "Mniej niż 3 miesiące" },
      { id: "m_3_6", label: "3 do 6 miesięcy" },
      { id: "m_6_12", label: "6 do 12 miesięcy" },
      { id: "y_1_3", label: "1 do 3 lat" },
      { id: "gt_3y", label: "Ponad 3 lata" },
    ],
  },
  {
    id: "q7",
    type: "textarea",
    minLength: 20,
    maxLength: 600,
    prompt: "Gdybyśmy spotkali się za 90 dni, co konkretnie musiałoby się zmienić, żebyś uznał ten czas za przełomowy?",
    help: "Minimum 20 znaków.",
  },
  {
    id: "q8",
    type: "multi",
    prompt: "Czego próbowałeś do tej pory?",
    help: "Możesz wybrać kilka.",
    options: [
      { id: "trener_personalny", label: "Trener personalny" },
      { id: "prowadzenie_online", label: "Prowadzenie online" },
      { id: "dietetyk", label: "Dietetyk" },
      { id: "samodzielna_dieta", label: "Samodzielna dieta" },
      { id: "liczenie_kalorii", label: "Liczenie kalorii" },
      { id: "aplikacje", label: "Aplikacje" },
      { id: "badania", label: "Badania" },
      { id: "suplementacja", label: "Suplementacja" },
      { id: "gotowe_programy", label: "Gotowe programy" },
      { id: "nic_konkretnego", label: "Nic konkretnego" },
      { id: "inne", label: "Inne" },
    ],
  },
  {
    id: "q9",
    type: "single",
    prompt: "Kiedy chcesz realnie rozpocząć zmianę?",
    options: [
      { id: "teraz", label: "Teraz" },
      { id: "dni_30", label: "W ciągu 30 dni" },
      { id: "mies_2_3", label: "W ciągu 2 do 3 miesięcy" },
      { id: "nie_wiem", label: "Jeszcze nie wiem" },
      { id: "tylko_sprawdzam", label: "Tylko sprawdzam możliwości" },
    ],
  },
  {
    id: "q10",
    type: "scale",
    min: 1,
    max: 10,
    minLabel: "Trudno mi",
    maxLabel: "W pełni gotowy",
    prompt: "Na ile jesteś gotowy wdrażać ustalone działania również wtedy, gdy tydzień nie będzie idealny?",
  },
  {
    id: "q11",
    type: "single",
    prompt: "Jaki jest Twój średni miesięczny dochód osobisty netto?",
    options: [
      { id: "lt_15k", label: "Poniżej 15 000 zł" },
      { id: "k_15_19", label: "15 000 do 19 999 zł" },
      { id: "k_20_29", label: "20 000 do 29 999 zł" },
      { id: "k_30_49", label: "30 000 do 49 999 zł" },
      { id: "k_50_plus", label: "50 000 zł i więcej" },
    ],
  },
  {
    id: "q12",
    type: "single",
    prompt: "The Control System jest prywatnym mentoringiem premium wymagającym czasu, zaangażowania i inwestycji. Które zdanie najlepiej opisuje Twoją sytuację?",
    options: [
      { id: "gotowy_po_ocenie", label: "Jestem gotowy zainwestować, jeśli zobaczę dopasowanie" },
      { id: "otwarty_zrozumiec", label: "Jestem otwarty na inwestycję, ale chcę najpierw zrozumieć proces" },
      { id: "musze_przemyslec", label: "Muszę to jeszcze przemyśleć" },
      { id: "nie_planuje", label: "Nie planuję teraz inwestycji" },
      { id: "darmowe", label: "Szukam głównie darmowych materiałów" },
    ],
  },
];

export const questionById = Object.fromEntries(questions.map((q) => [q.id, q])) as Record<
  QuestionId,
  Question
>;

/** Wartość odpowiedzi zależnie od typu pytania. */
export type AnswerValue = string | string[] | number;
export type Answers = Partial<Record<QuestionId, AnswerValue>>;
