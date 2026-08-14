/**
 * Walidacja i normalizacja danych wejściowych (sekcje 7, 10, 21).
 * Bez zewnętrznych zależności — ta sama logika działa na kliencie i serwerze.
 */

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Walidacja syntaktyczna e-maila — świadomie pragmatyczna, nie RFC-kompletna. */
export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  if (email.length < 6 || email.length > 254) return false;
  if (/\s/.test(email)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(email);
}

export function isValidFirstName(raw: string): boolean {
  return raw.trim().length >= 2 && raw.trim().length <= 60;
}

/**
 * Normalizacja telefonu do E.164 (sekcja 10).
 * `defaultCountry` używany, gdy numer nie zaczyna się od "+".
 */
export function toE164(raw: string, defaultCountryCode = "48"): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;

  let normalized: string;
  if (digits.startsWith("+")) {
    normalized = "+" + digits.slice(1).replace(/\D/g, "");
  } else {
    const bare = digits.replace(/\D/g, "").replace(/^0+/, "");
    normalized = "+" + defaultCountryCode + bare;
  }

  // E.164: "+" + 8..15 cyfr.
  return /^\+\d{8,15}$/.test(normalized) ? normalized : null;
}

/** Zbiera UTM i dane źródła z URL-a oraz referrera (sekcja 18). */
export interface TrafficSource {
  /** Dodatkowe klucze dopuszczone, żeby obiekt dało się przekazać jako zwykły słownik. */
  [key: string]: string | undefined;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  landing_path?: string;
  fbclid?: string;
  gclid?: string;
}

export function parseTrafficSource(url: string, referrer?: string): TrafficSource {
  const out: TrafficSource = {};
  try {
    const u = new URL(url);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"] as const;
    for (const k of keys) {
      const v = u.searchParams.get(k);
      if (v) out[k] = v.slice(0, 200);
    }
    out.landing_path = u.pathname;
  } catch {
    /* ignoruj niepoprawny URL */
  }
  if (referrer) out.referrer = referrer.slice(0, 500);
  return out;
}
