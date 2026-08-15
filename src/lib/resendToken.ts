import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Podpisany, nieprzewidywalny token kontekstu dostawy — zamiast trzymać e-mail
 * w cookie (nawet HttpOnly) trzymamy wyłącznie id leada + podpis. Ten sam
 * mechanizm co upsert_lead: e-mail nigdy nie opuszcza serwera przez klienta.
 */
const COOKIE_NAME = "tcs_reset_delivery";
const MAX_AGE_SEC = 45 * 60;

function secret(): string | null {
  return process.env.RESET_RESEND_SECRET ?? null;
}

export function signDeliveryToken(leadId: string): string | null {
  const key = secret();
  if (!key) return null;
  const payload = `${leadId}.${Date.now()}`;
  const sig = createHmac("sha256", key).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyDeliveryToken(token: string | undefined | null): string | null {
  const key = secret();
  if (!key || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [leadId, ts, sig] = parts;

  const payload = `${leadId}.${ts}`;
  const expected = createHmac("sha256", key).update(payload).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_SEC * 1000) return null;

  return leadId;
}

export const deliveryCookie = {
  name: COOKIE_NAME,
  maxAgeSec: MAX_AGE_SEC,
};
