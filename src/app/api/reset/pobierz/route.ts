import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, protocolDownloadOwnerTemplate } from "@/lib/email";
import { verifyDownloadToken, PROTOCOL_PDF_PATH } from "@/lib/downloadToken";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Odstęp między powiadomieniami o pobraniach tego samego leada. */
const NOTIFY_COOLDOWN_HOURS = 24;

interface DownloadRow {
  first_download: boolean;
  download_count: number;
  should_notify: boolean;
  first_name: string | null;
  email: string | null;
  phone_e164: string | null;
}

/**
 * GET /api/reset/pobierz?t=<token> — pobranie Protokołu przez podpisany link.
 *
 * Zasada nadrzędna (ta sama co w sekcji 23 dla wysyłki): telemetria nigdy nie
 * może stanąć między człowiekiem a obiecanym dokumentem. Cokolwiek pójdzie nie
 * tak — brak tokenu, wygasły podpis, padnięta baza, błąd Resenda — kończy się
 * przekierowaniem na PDF-a. Powiadomienie właściciela jest efektem ubocznym,
 * nie warunkiem pobrania.
 *
 * Deduplikacja siedzi w bazie (`register_protocol_download`): prefetch linku
 * przez klienta pocztowego czy dwuklik nie generują dwóch maili.
 */
export async function GET(req: NextRequest) {
  const pdfUrl = new URL(PROTOCOL_PDF_PATH, req.nextUrl.origin);
  const redirect = NextResponse.redirect(pdfUrl, 302);
  // Link bywa otwierany przez skanery i podglądy w klientach pocztowych —
  // cache po drodze zamieniłby go w „pobranie bez pobrania".
  redirect.headers.set("Cache-Control", "no-store, max-age=0");

  const leadId = verifyDownloadToken(req.nextUrl.searchParams.get("t"));
  if (!leadId) return redirect;

  try {
    const db = supabaseAdmin();
    const { data, error } = await db.rpc("register_protocol_download", {
      p_lead_id: leadId,
      p_notify_cooldown_hours: NOTIFY_COOLDOWN_HOURS,
    });

    if (error) {
      console.error("[/api/reset/pobierz] zapis pobrania nieudany:", error.message);
      return redirect;
    }

    const row = Array.isArray(data) ? (data[0] as DownloadRow | undefined) : undefined;
    // Brak wiersza = token wskazuje na leada, którego już nie ma (usunięcie na
    // żądanie, retencja). Nie ma o czym powiadamiać.
    if (!row?.email || !row.should_notify) return redirect;

    const tpl = protocolDownloadOwnerTemplate({
      firstName: row.first_name ?? "",
      email: row.email,
      phone: row.phone_e164,
      downloadCount: row.download_count,
      firstDownload: row.first_download,
    });

    const sent = await sendEmail({
      to: process.env.OWNER_EMAIL ?? site.ownerEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    await db.from("email_events").insert({
      lead_id: leadId,
      provider_message_id: sent.messageId ?? null,
      template_key: "protocol_download_owner",
      event_type: sent.ok ? "sent" : "bounced",
      raw_event: sent.ok
        ? { download_count: row.download_count, first_download: row.first_download }
        : { download_count: row.download_count, error: sent.error },
    });

    if (!sent.ok) {
      console.error("[/api/reset/pobierz] powiadomienie właściciela nieudane:", sent.error);
    }
  } catch (err) {
    console.error(
      "[/api/reset/pobierz] nieoczekiwany błąd:",
      err instanceof Error ? err.message : "unknown error",
    );
  }

  return redirect;
}
