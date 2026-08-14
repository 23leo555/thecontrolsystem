import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateBookingToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { qualifiedNotBookedTemplate } from "@/lib/emailTemplates";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "approve" | "reject" | "resend";

/**
 * POST /api/admin/applications/:id/decision — ręczna decyzja dla Statusu B (sekcja 15/17).
 *
 * approve → manual_decision=approved, lifecycle=MANUAL_APPROVED, nowy token, e-mail z zaproszeniem
 * reject  → manual_decision=rejected, brak kalendarza
 * resend  → nowy token i ponowna wysyłka zaproszenia
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return unauthorized();

  const { id } = await ctx.params;
  const { action } = (await req.json().catch(() => ({}))) as { action?: Action };

  if (!action || !["approve", "reject", "resend"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Nieznana akcja." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: app } = await db
    .from("applications")
    .select("id, qualification_status, leads ( id, first_name, email, email_bounced )")
    .eq("id", id)
    .maybeSingle();

  if (!app) return NextResponse.json({ ok: false, error: "Nie znaleziono." }, { status: 404 });

  const lead = app.leads as unknown as {
    id: string; first_name: string; email: string; email_bounced: boolean;
  };

  if (action === "reject") {
    await db
      .from("applications")
      .update({ manual_decision: "rejected", manual_decided_at: new Date().toISOString() })
      .eq("id", id);
    await db.from("leads").update({ lifecycle_status: "NOT_QUALIFIED" }).eq("id", lead.id);
    return NextResponse.json({ ok: true, action: "reject" });
  }

  // approve / resend — generujemy NOWY token (poprzedni przestaje obowiązywać).
  const booking = generateBookingToken();

  await db
    .from("applications")
    .update({
      manual_decision: "approved",
      manual_decided_at: new Date().toISOString(),
      booking_token_hash: booking.hash,
      booking_token_expires_at: booking.expiresAt,
      booking_token_used_at: null,
    })
    .eq("id", id);

  await db.from("leads").update({ lifecycle_status: "MANUAL_APPROVED" }).eq("id", lead.id);

  const callUrl = `${site.url}${site.routes.call}?t=${booking.token}`;
  let emailOk = false;

  if (!lead.email_bounced) {
    const tpl = qualifiedNotBookedTemplate(lead.first_name, callUrl);
    const sent = await sendEmail({ to: lead.email, ...tpl });
    emailOk = sent.ok;
    await db.from("email_events").insert({
      lead_id: lead.id,
      provider_message_id: sent.messageId ?? null,
      template_key: action === "resend" ? "qualified_reminder" : "manual_approved",
      event_type: sent.ok ? "sent" : "bounced",
      raw_event: sent.ok ? null : { error: sent.error },
    });
  }

  // callUrl zwracamy, żeby Krystian mógł przekazać link ręcznie, gdy e-mail nie działa.
  return NextResponse.json({ ok: true, action, emailSent: emailOk, callUrl });
}
