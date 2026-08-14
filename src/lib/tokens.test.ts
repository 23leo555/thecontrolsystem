import { describe, it, expect } from "vitest";
import {
  generateBookingToken,
  hashToken,
  tokensMatch,
  BOOKING_TOKEN_TTL_HOURS,
} from "@/lib/tokens";

describe("tokeny dostępu do /rozmowa (sekcja 13)", () => {
  it("generuje losowy token i jego hash", () => {
    const a = generateBookingToken();
    const b = generateBookingToken();
    expect(a.token).not.toBe(b.token);
    expect(a.token.length).toBeGreaterThanOrEqual(32);
    expect(a.hash).toHaveLength(64); // sha256 hex
  });

  it("hash odpowiada tokenowi i jest deterministyczny", () => {
    const { token, hash } = generateBookingToken();
    expect(hashToken(token)).toBe(hash);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("hash nie ujawnia tokenu", () => {
    const { token, hash } = generateBookingToken();
    expect(hash).not.toContain(token);
  });

  it("dopasowuje poprawny token i odrzuca błędny", () => {
    const { token, hash } = generateBookingToken();
    expect(tokensMatch(hashToken(token), hash)).toBe(true);
    expect(tokensMatch(hashToken("podrobiony-token"), hash)).toBe(false);
  });

  it("nie wywraca się na hashu o innej długości", () => {
    const { hash } = generateBookingToken();
    expect(tokensMatch("abcd", hash)).toBe(false);
  });

  it("ustawia wygaśnięcie na 72 godziny", () => {
    const { expiresAt } = generateBookingToken();
    const diffH = (new Date(expiresAt).getTime() - Date.now()) / 3600_000;
    expect(BOOKING_TOKEN_TTL_HOURS).toBe(72);
    expect(diffH).toBeGreaterThan(71.9);
    expect(diffH).toBeLessThan(72.1);
  });
});
