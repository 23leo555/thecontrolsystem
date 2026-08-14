import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { hashToken } from "@/lib/tokens";

/**
 * Weryfikacja dostępu do /rozmowa (sekcja 13).
 * Kalendarz pokazujemy WYŁĄCZNIE po pozytywnej weryfikacji tokenu.
 * Sprawdzenie dzieje się po stronie serwera — przeglądarka nie decyduje o dostępie.
 */
export type AccessResult =
  | { ok: true; applicationId: string; firstName: string; email: string }
  | { ok: false; reason: "missing" | "invalid" | "expired" | "used" };

export async function verifyBookingAccess(token: string | undefined): Promise<AccessResult> {
  if (!token || token.length < 20) return { ok: false, reason: "missing" };

  const db = supabaseAdmin();
  const hash = hashToken(token);

  // Szukamy po hashu — jawny token nigdy nie jest zapisany w bazie.
  const { data } = await db
    .from("applications")
    .select(
      `id, booking_token_expires_at, booking_token_used_at, qualification_status, manual_decision,
       leads ( first_name, email )`,
    )
    .eq("booking_token_hash", hash)
    .maybeSingle();

  if (!data) return { ok: false, reason: "invalid" };

  // Dodatkowa bramka biznesowa: sam token nie wystarczy — musi istnieć podstawa dostępu.
  const eligible = data.qualification_status === "A" || data.manual_decision === "approved";
  if (!eligible) return { ok: false, reason: "invalid" };

  if (data.booking_token_used_at) return { ok: false, reason: "used" };

  if (!data.booking_token_expires_at || new Date(data.booking_token_expires_at) < new Date()) {
    return { ok: false, reason: "expired" };
  }

  const lead = data.leads as unknown as { first_name: string; email: string } | null;

  return {
    ok: true,
    applicationId: data.id,
    firstName: lead?.first_name ?? "",
    email: lead?.email ?? "",
  };
}
