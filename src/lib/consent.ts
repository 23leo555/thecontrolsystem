/**
 * Zarządzanie zgodami (sekcje 21, 22).
 * Zasada: domyślnie ODMOWA wszystkiego, co nieniezbędne.
 * Żaden tracker marketingowy nie ładuje się przed jawną zgodą.
 */

export interface ConsentState {
  /** Statystyka (GA4). */
  analytics: boolean;
  /** Reklama i remarketing (Meta Pixel). */
  marketing: boolean;
  /** Znacznik czasu decyzji — dowód zgody. */
  decidedAt: string;
  /** Wersja treści zgód; zmiana wymusi ponowne pytanie. */
  version: number;
}

export const CONSENT_VERSION = 1;
const STORAGE_KEY = "tcs_consent_v1";

export const DENY_ALL: Omit<ConsentState, "decidedAt"> = {
  analytics: false,
  marketing: false,
  version: CONSENT_VERSION,
};

type Listener = (c: ConsentState | null) => void;
const listeners = new Set<Listener>();

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    // Nowa wersja zgód = pytamy ponownie.
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = {
    analytics: choice.analytics,
    marketing: choice.marketing,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* tryb prywatny — zgoda obowiązuje tylko w tej sesji */
  }
  applyToWindow(state);
  listeners.forEach((l) => l(state));
  return state;
}

/** Wycofanie zgody — czyści też ciasteczka narzędzi third-party, na ile się da. */
export function revokeConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignoruj */
  }
  clearTrackingCookies();
  applyToWindow(null);
  listeners.forEach((l) => l(null));
}

export function onConsentChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Udostępnia stan zgody warstwie analytics (lib/analytics.ts). */
export function applyToWindow(state: ConsentState | null): void {
  if (typeof window === "undefined") return;
  window.__tcsConsent = {
    analytics: state?.analytics ?? false,
    marketing: state?.marketing ?? false,
  };
}

function clearTrackingCookies(): void {
  if (typeof document === "undefined") return;
  const doomed = /^(_ga|_gid|_gat|_fbp|_fbc)/;
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (!name || !doomed.test(name)) continue;
    for (const domain of [location.hostname, `.${location.hostname}`]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
    }
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}
