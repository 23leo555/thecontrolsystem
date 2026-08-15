import crypto from "node:crypto";

/**
 * Podpisany token strony wyniku aplikacji — sekcja X2.
 *
 * Był wcześniej zaimplementowany dwa razy: podpis w `POST /api/apply`,
 * weryfikacja w stronie wyniku. Rozjazd między tymi kopiami oznaczałby, że
 * kandydat dostaje link, którego strona nie przyjmuje, więc trzymamy to
 * w jednym miejscu. Panel korzysta z tego samego podpisu, gdy ręcznie
 * zatwierdza aplikację (AC5).
 */

/** Token wyniku ważny 7 dni (X2). */
export const RESULT_TTL_DAYS = 7;

function secret(): string {
  return process.env.APPLY_RESULT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

/** Zwraca sam token. Domyślnie ważny RESULT_TTL_DAYS od teraz. */
export function signResultToken(applicationId: string, expiresAt?: number): string {
  const exp = expiresAt ?? Date.now() + RESULT_TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${applicationId}.${exp}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

/** Ścieżka strony wyniku dla danej aplikacji. */
export function resultPath(applicationId: string): string {
  return `/apply/result/${signResultToken(applicationId)}`;
}

/** Zwraca applicationId dla poprawnego, nieprzeterminowanego tokenu; inaczej null. */
export function verifyResultToken(token: string): { applicationId: string } | null {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  // Porównanie w stałym czasie — token jest sekretem dostępowym.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const [applicationId, expiresAt] = payload.split(".");
  if (!applicationId || Number(expiresAt) < Date.now()) return null;

  return { applicationId };
}
