import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateBookingToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { qualifiedNotBookedTemplate } from "@/lib/emailTemplates";
import { manualApprovedTemplate } from "@/lib/apply/emails";
import { resultPath } from "@/lib/apply/resultToken";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "approve" | "reject" | "resend";

/**
 * POST /api/admin/applications/:id/decision — ręczna decyzja po Manual Review
 * (sekcje 15/17 dla starego lejka, AB3 i AC5 dla lejka /apply).
 *
 * Obsługiwane są oba modele aplikacji naraz, bo w bazie żyją obok siebie:
 *  - /apply (scoring_version ustawione): status → QUALIFIED, wiadomość AC5
 *    z linkiem do podpisanej strony wyniku, na której stoi Calendly (AA1),
 *  - stary /aplikacja: jednorazowy token rezerwacji i strona /rozmowa.
 *
 * Odmowa świadomie nie wysyła niczego: kandydat po Manual Review dostał już
 * wiadomość AC3, a brief nie przewiduje osobnego maila o odrzuceniu.
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
    .select("id, qualification_status, scoring_version, leads ( id, first_name, email, email_bounced )")
    .eq("id", id)
    .maybeSingle();

  if (!app) return NextResponse.json({ ok: false, error: "Nie znaleziono." }, { status: 404 });

  const lead = app.leads as unknown as {
    id: string; first_name: string; email: string; email_bounced: boolean;
  } | null;

  // Aplikacja bez leada to draft sprzed submitu — nie ma komu wysłać decyzji.
  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "Zgłoszenie nie ma przypisanego leada (draft?)." },
      { status: 409 },
    );
  }

  const isV1 = Boolean(app.scoring_version);
  const now = new Date().toISOString();

  if (action === "reject") {
    await db
      .from("applications")
      .update({
        manual_decision: "rejected",
        manual_decided_at: now,
        ...(isV1 ? { status: "NOT_QUALIFIED" } : {}),
      })
      .eq("id", id);
    await db.from("leads").update({ lifecycle_status: "NOT_QUALIFIED" }).eq("id", lead.id);
    return NextResponse.json({ ok: true, action: "reject" });
  }

  // --- approve / resend ---
  let inviteUrl: string;

  if (isV1) {
    // Status w bazie jest źródłem prawdy dla strony wyniku: dopóki nie jest
    // QUALIFIED, kalendarz się nie wyrenderuje, choćby link był poprawny (Z2).
    await db
      .from("applications")
      .update({ status: "QUALIFIED", manual_decision: "approved", manual_decided_at: now })
      .eq("id", id);

    inviteUrl = `${site.url}${resultPath(id)}`;
  } else {
    // Stary lejek: nowy token unieważnia poprzedni.
    const booking = generateBookingToken();
    await db
      .from("applications")
      .update({
        manual_decision: "approved",
        manual_decided_at: now,
        booking_token_hash: booking.hash,
        booking_token_expires_at: booking.expiresAt,
        booking_token_used_at: null,
      })
      .eq("id", id);

    inviteUrl = `${site.url}${site.routes.call}?t=${booking.token}`;
  }

  await db.from("leads").update({ lifecycle_status: "MANUAL_APPROVED" }).eq("id", lead.id);

  let emailOk = false;

  if (!lead.email_bounced) {
    const tpl = isV1
      ? manualApprovedTemplate(lead.first_name, inviteUrl)
      : qualifiedNotBookedTemplate(lead.first_name, inviteUrl);
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

  // Link wraca w odpowiedzi, żeby Krystian mógł go przekazać ręcznie, gdy poczta zawiedzie.
  return NextResponse.json({ ok: true, action, emailSent: emailOk, callUrl: inviteUrl });
}
