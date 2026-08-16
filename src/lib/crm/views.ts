/**
 * Rejestr widoków operacyjnych CRM — sekcja K1 briefu CRM.
 *
 * DECYZJA WŁAŚCICIELA (2026-08-16): brief rekomendował HubSpota i odradzał
 * własny panel. Właściciel zdecydował budować własny — systemem of record
 * zostaje baza projektu.
 *
 * Każdy wpis wskazuje widok SQL. Reguły („kto jest callable", „co znaczy brak
 * next action") żyją w bazie, nie tutaj — dzięki temu ten sam warunek obowiązuje
 * panel, raporty i każde ręczne zapytanie.
 */

export interface CrmViewDef {
  /** Klucz w URL-u i w API. */
  key: string;
  label: string;
  /** Nazwa widoku w Postgresie. */
  table: string;
  /** Krótkie wyjaśnienie pod nagłówkiem — po co ta lista istnieje. */
  hint: string;
  /** Widok, który powinien być pusty; niepusty = coś wymaga naprawy. */
  shouldBeEmpty?: boolean;
}

export const CRM_VIEWS: CrmViewDef[] = [
  {
    key: "to-call",
    label: "Do kontaktu",
    table: "crm_view_to_call",
    hint: "Wyłącznie osoby z numerem, zgodą telefoniczną i bez sprzeciwu. Reszta bazy tu nie trafia.",
  },
  {
    key: "applications",
    label: "Aplikacje do weryfikacji",
    table: "crm_view_applications_to_review",
    hint: "Manual Review czekający na Twoją decyzję.",
  },
  {
    key: "qualified",
    label: "Zakwalifikowani bez terminu",
    table: "crm_view_qualified_no_meeting",
    hint: "Przeszli kwalifikację, ale nie wybrali jeszcze terminu rozmowy.",
  },
  {
    key: "meetings",
    label: "Nadchodzące spotkania",
    table: "crm_view_upcoming_meetings",
    hint: "Potwierdzone rezerwacje z Calendly.",
  },
  {
    key: "no-outcome",
    label: "Rozmowy bez wyniku",
    table: "crm_view_meetings_without_outcome",
    hint: "Spotkanie się odbyło, a wynik nie został wpisany.",
    shouldBeEmpty: true,
  },
  {
    key: "deals",
    label: "Otwarte szanse",
    table: "crm_view_open_deals",
    hint: "Pipeline sprzedażowy — wszystko poza wygranymi i przegranymi.",
  },
  {
    key: "no-action",
    label: "Bez next action",
    table: "crm_view_missing_next_action",
    hint: "Aktywny lead bez właściciela albo bez zaplanowanego kroku. Ta lista ma być pusta.",
    shouldBeEmpty: true,
  },
  {
    key: "nurture",
    label: "Nurture",
    table: "crm_view_nurture",
    hint: "Odłożeni na później, do odgrzania.",
  },
  {
    key: "bad-data",
    label: "Złe dane",
    table: "crm_view_bad_data",
    hint: "Odbicia, nieprawidłowe numery, spam. Nie generują zadań sprzedażowych.",
  },
  {
    key: "dnc",
    label: "Nie kontaktować",
    table: "crm_view_do_not_contact",
    hint: "Sprzeciwy i wycofane zgody. Nadrzędne wobec każdej automatyzacji.",
  },
  {
    key: "reconciliation",
    label: "Rozbieżności",
    table: "crm_reconciliation",
    hint: "Codzienna kontrola spójności: zgłoszenia bez kontaktu, leady bez kroku, przekroczona retencja.",
    shouldBeEmpty: true,
  },
];

export const findView = (key: string | null) =>
  CRM_VIEWS.find((v) => v.key === key) ?? CRM_VIEWS[0]!;

/** Statusy pracy handlowej (G2). */
export const LEAD_STATUSES = [
  "new",
  "awaiting_review",
  "contact_allowed",
  "contact_attempted",
  "connected",
  "follow_up_required",
  "nurture",
  "unqualified",
  "bad_data",
  "spam",
  "do_not_contact",
  "closed",
] as const;

export const NEXT_ACTION_TYPES = ["call", "email", "review", "meeting", "follow_up"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type NextActionType = (typeof NEXT_ACTION_TYPES)[number];
