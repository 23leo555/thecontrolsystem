import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, protocolDeliveryTemplate } from "@/lib/email";
import { verifyDeliveryToken, deliveryCookie } from "@/lib/resendToken";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOLDOWN_SEC = 60;
const MAX_IN_WINDOW = 3;
const WINDOW_MIN = 30;

/**
 * POST /api/reset/resend — ponowna wysyłka Protokołu bez tworzenia nowego leada.
 *
 * Kontekst dostawy pochodzi wyłącznie z podpisanego cookie ustawionego przez
 * /api/reset — nie przyjmujemy e-maila w body, żeby resend nie mógł zostać
 * użyty do wysłania Protokołu na dowolny adres (brief resendu, sekcja 9.2).
 * Rate limit liczony z `email_events`, żeby nie dokładać nowej tabeli tylko
 * dla licznika.
 */
export async function POST(req: NextRequest) {
  const leadId = verifyDeliveryToken(req.cookies.get(deliveryCookie.name)?.value);
  if (!leadId) {
    return NextResponse.json(
      { ok: false, code: "expired_context", error: "Sesja wygasła. Wróć do strony protokołu, aby ponownie podać adres." },
      { status: 401 },
    );
  }

  const db = supabaseAdmin();

  const { data: lead, error: leadError } = await db
    .from("leads")
    .select("id, first_name, email, email_bounced")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead) {
    return NextResponse.json(
      { ok: false, code: "expired_context", error: "Sesja wygasła. Wróć do strony protokołu, aby ponownie podać adres." },
      { status: 401 },
    );
  }

  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  const { data: recent, error: eventsError } = await db
    .from("email_events")
    .select("created_at")
    .eq("lead_id", lead.id)
    .eq("template_key", "protocol_delivery")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (eventsError) {
    console.error("[/api/reset/resend] odczyt email_events nieudany:", eventsError.message);
    return NextResponse.json(
      { ok: false, code: "error", error: "Nie udało się ponownie wysłać wiadomości. Odczekaj chwilę i spróbuj ponownie." },
      { status: 500 },
    );
  }

  const events = recent ?? [];
  if (events.length > 0) {
    const lastSentMs = new Date(events[0].created_at).getTime();
    const elapsedSec = (Date.now() - lastSentMs) / 1000;
    if (elapsedSec < COOLDOWN_SEC) {
      const retryAfterSeconds = Math.ceil(COOLDOWN_SEC - elapsedSec);
      return NextResponse.json(
        {
          ok: false,
          code: "cooldown",
          retryAfterSeconds,
          error: `Wiadomość została już wysłana. Kolejna próba będzie możliwa za ${retryAfterSeconds} s.`,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }
  }
  if (events.length >= MAX_IN_WINDOW) {
    return NextResponse.json(
      { ok: false, code: "rate_limited", error: "Nie udało się ponownie wysłać wiadomości. Odczekaj chwilę i spróbuj ponownie." },
      { status: 429 },
    );
  }

  if (lead.email_bounced) {
    return NextResponse.json(
      { ok: false, code: "error", error: "Nie udało się ponownie wysłać wiadomości. Odczekaj chwilę i spróbuj ponownie." },
      { status: 400 },
    );
  }

  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? site.url}/protokol-resetu.pdf`;
  const tpl = protocolDeliveryTemplate(lead.first_name, downloadUrl);
  const sent = await sendEmail({ to: lead.email, subject: tpl.subject, html: tpl.html, text: tpl.text });

  await db.from("email_events").insert({
    lead_id: lead.id,
    provider_message_id: sent.messageId ?? null,
    template_key: "protocol_delivery",
    event_type: sent.ok ? "sent" : "bounced",
    raw_event: sent.ok ? { resend: true } : { resend: true, error: sent.error },
  });

  if (!sent.ok) {
    return NextResponse.json(
      { ok: false, code: "error", error: "Nie udało się ponownie wysłać wiadomości. Odczekaj chwilę i spróbuj ponownie." },
      { status: 502 },
    );
  }

  await db
    .from("leads")
    .update({ email_status: "sent", protocol_sent_at: new Date().toISOString() })
    .eq("id", lead.id);

  return NextResponse.json({ ok: true });
}
