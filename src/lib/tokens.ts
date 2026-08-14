import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Tokeny dostępu do /rozmowa (sekcja 13).
 * W bazie trzymamy WYŁĄCZNIE hash — nigdy jawnego tokenu.
 * Ważność domyślnie 72 godziny.
 */

export const BOOKING_TOKEN_TTL_HOURS = 72;

export function generateBookingToken(): { token: string; hash: string; expiresAt: string } {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    hash: hashToken(token),
    expiresAt: new Date(Date.now() + BOOKING_TOKEN_TTL_HOURS * 3600_000).toISOString(),
  };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Porównanie odporne na atak czasowy. */
export function tokensMatch(candidateHash: string, storedHash: string): boolean {
  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
