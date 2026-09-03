/**
 * Warstwa eventów analitycznych — sekcja 18.
 *
 * Zasada nadrzędna (sekcje 21/22): nic nie leci do narzędzi reklamowych przed zgodą.
 * Zdarzenia sprzed decyzji trafiają do kolejki i są wysyłane dopiero po jej udzieleniu.
 * Do narzędzi NIGDY nie wysyłamy surowych odpowiedzi o dochodzie ani zdrowiu.
 */
export type AnalyticsEvent =
  | "page_view_system"
  | "cta_reset_click"
  | "cta_application_click"
  // --- Lejek /reset (brief V2 sekcja 22) ---
  | "reset_page_view"
  | "reset_form_start"
  | "reset_form_submit"
  | "reset_form_error"
  | "reset_thankyou_view"
  | "reset_form_view"
  | "protocol_download"
  | "vsl_start"
  | "vsl_25"
  | "vsl_50"
  | "vsl_75"
  | "vsl_90"
  | "vsl_complete"
  // --- Landing v1.0, sekcja M7. Każde raz na sesję; bez czasu oglądania i bez ID użytkownika. ---
  | "vsl_visible"
  | "vsl_play"
  | "vsl_error"
  | "vsl_replay"
  | "page_view_landing"
  | "cta_click"
  | "application_start"
  | "application_step_view"
  | "application_step_complete"
  | "application_submit"
  | "calendar_view"
  | "booking_complete";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    __tcsConsent?: { analytics: boolean; marketing: boolean };
  }
}

/**
 * Mapowanie naszych zdarzeń na ZDARZENIA STANDARDOWE Meta.
 *
 * Meta optymalizuje kampanie przede wszystkim na własnym słowniku zdarzeń.
 * `trackCustom` też da się wskazać jako cel, ale algorytm uczy się na nim
 * wolniej i część raportów go nie pokazuje. Dlatego dla momentów, które realnie
 * są konwersją, wysyłamy DODATKOWO zdarzenie standardowe.
 *
 * Zdarzenie własne leci nadal, bo niesie szczegóły (`step`, `form_id`,
 * `stage`), których słownik Meta nie ma. Nie zawyża statystyk: zdarzenia własne
 * i standardowe to w Menedżerze zdarzeń dwa osobne zbiory.
 *
 * `booking_complete` nie jest jeszcze nigdzie wywoływane w przeglądarce —
 * rezerwacja wpada webhookiem Calendly po stronie serwera. Mapowanie zostaje
 * gotowe na moment, w którym pojawi się strona potwierdzenia rezerwacji.
 */
const META_STANDARD_EVENTS: Partial<Record<AnalyticsEvent, string>> = {
  reset_page_view: "ViewContent",
  reset_form_submit: "Lead",
  application_submit: "CompleteRegistration",
  booking_complete: "Schedule",
};

/** Parametry, które NIGDY nie opuszczają naszego serwera (sekcja 18). */
const FORBIDDEN_KEYS = new Set(["q11", "income", "dochod", "q4", "q5", "q7", "health", "answers", "score"]);

function sanitize(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (FORBIDDEN_KEYS.has(k)) continue;
    if (typeof v === "string" && v.length > 100) continue;
    out[k] = v;
  }
  return out;
}

interface QueuedEvent {
  event: AnalyticsEvent;
  params: Record<string, unknown>;
}
const queue: QueuedEvent[] = [];

export function track(event: AnalyticsEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  const safe = sanitize(params);
  const consent = window.__tcsConsent;

  // Brak decyzji lub brak zgody na statystykę → do kolejki, nie do sieci.
  if (!consent?.analytics) {
    if (queue.length < 50) queue.push({ event, params: safe });
    return;
  }

  dispatch(event, safe, consent.marketing);
}

function dispatch(event: AnalyticsEvent, params: Record<string, unknown>, marketing: boolean): void {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });

  if (typeof window.gtag === "function") {
    window.gtag("event", event, params);
  }
  if (marketing && typeof window.fbq === "function") {
    const standard = META_STANDARD_EVENTS[event];
    if (standard) window.fbq("track", standard, params);
    window.fbq("trackCustom", event, params);
  }
}

/** Wysyła zdarzenia zebrane przed udzieleniem zgody. */
export function flushQueue(): void {
  if (typeof window === "undefined") return;
  const consent = window.__tcsConsent;
  if (!consent?.analytics) return;

  while (queue.length) {
    const item = queue.shift()!;
    dispatch(item.event, item.params, consent.marketing);
  }
}

/* ------------------------------------------------------------------ */
/* Utrwalanie źródła ruchu — first touch i latest touch (sekcja 18).    */
/* Zapisujemy we własnym storage, nie w narzędziach reklamowych.        */
/* ------------------------------------------------------------------ */

const TOUCH_KEY = "tcs_touch_v1";

export interface TouchData {
  first: Record<string, string>;
  latest: Record<string, string>;
}

const TRACKED_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid",
] as const;

export function captureTouch(): TouchData | null {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const current: Record<string, string> = {};
  for (const key of TRACKED_PARAMS) {
    const v = url.searchParams.get(key);
    if (v) current[key] = v.slice(0, 200);
  }
  if (document.referrer) current.referrer = document.referrer.slice(0, 500);
  current.landing_path = url.pathname;

  let stored: TouchData | null = null;
  try {
    const raw = localStorage.getItem(TOUCH_KEY);
    if (raw) stored = JSON.parse(raw) as TouchData;
  } catch {
    /* ignoruj */
  }

  const hasNewSource = TRACKED_PARAMS.some((k) => current[k]);
  const data: TouchData = {
    // first touch zapisujemy raz i nigdy nie nadpisujemy
    first: stored?.first ?? current,
    latest: hasNewSource || !stored ? current : stored.latest,
  };

  try {
    localStorage.setItem(TOUCH_KEY, JSON.stringify(data));
  } catch {
    /* ignoruj */
  }
  return data;
}

/** Źródło do wysłania z formularzem — priorytet ma first touch. */
export function touchForSubmission(): Record<string, string | undefined> {
  const data = captureTouch();
  if (!data) return {};
  return { ...data.latest, ...data.first };
}
