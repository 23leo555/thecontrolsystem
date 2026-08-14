/**
 * Weryfikacja Cloudflare Turnstile PO STRONIE SERWERA (sekcja 21).
 * Gdy sekret nie jest skonfigurowany (dev/staging), weryfikacja jest pomijana,
 * ale fakt pominięcia jest zwracany, żeby nie udawać ochrony, której nie ma.
 */
export interface TurnstileResult {
  ok: boolean;
  skipped: boolean;
  error?: string;
}

export async function verifyTurnstile(token: string | undefined, remoteIp?: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };

  if (!token) return { ok: false, skipped: false, error: "missing-token" };

  try {
    const form = new URLSearchParams({ secret, response: token });
    if (remoteIp) form.set("remoteip", remoteIp);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    return data.success
      ? { ok: true, skipped: false }
      : { ok: false, skipped: false, error: (data["error-codes"] ?? []).join(",") };
  } catch (err) {
    return { ok: false, skipped: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
