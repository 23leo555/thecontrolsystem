import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { LEAD_STATUSES, NEXT_ACTION_TYPES } from "@/lib/crm/views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  owner?: string | null;
  lead_status?: string;
  next_action_type?: string | null;
  next_action_at?: string | null;
  do_not_contact?: boolean;
}

/**
 * PATCH /api/admin/crm/lead/:id — praca handlowa na kontakcie (G2, O).
 *
 * Reguła z sekcji O: aktywny lead nie może zostać bez właściciela i bez
 * następnego kroku. Endpoint jej pilnuje, zamiast liczyć na dyscyplinę
 * osoby klikającej — inaczej widok „bez next action" zapełnia się sam.
 *
 * `do_not_contact` jest nadrzędne (I5): ustawienie go zamyka lead i kasuje
 * zaplanowane działania, bo każde z nich byłoby kontaktem wbrew sprzeciwowi.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return unauthorized();

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Body;

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    last_sales_activity_at: new Date().toISOString(),
  };

  if (body.do_not_contact === true) {
    patch.do_not_contact = true;
    patch.lead_status = "do_not_contact";
    patch.phone_status = "do_not_call";
    patch.next_action_at = null;
    patch.next_action_type = null;
    patch.owner = null;
  } else {
    if (body.owner !== undefined) patch.owner = body.owner?.trim() || null;

    if (body.lead_status !== undefined) {
      if (!LEAD_STATUSES.includes(body.lead_status as never)) {
        return NextResponse.json({ ok: false, error: "Nieznany status." }, { status: 400 });
      }
      patch.lead_status = body.lead_status;
    }

    if (body.next_action_type !== undefined) {
      if (body.next_action_type && !NEXT_ACTION_TYPES.includes(body.next_action_type as never)) {
        return NextResponse.json({ ok: false, error: "Nieznany typ działania." }, { status: 400 });
      }
      patch.next_action_type = body.next_action_type || null;
    }

    if (body.next_action_at !== undefined) {
      patch.next_action_at = body.next_action_at || null;
    }
  }

  const db = supabaseAdmin();

  // Stan po zmianie liczymy na podstawie tego, co faktycznie będzie w bazie,
  // a nie tego, co przyszło w żądaniu — klient przysyła zwykle jedno pole.
  const { data: current, error: readError } = await db
    .from("leads")
    .select("lead_status, owner, next_action_at, do_not_contact")
    .eq("id", id)
    .maybeSingle();

  if (readError || !current) {
    return NextResponse.json({ ok: false, error: "Nie znaleziono kontaktu." }, { status: 404 });
  }

  const after = {
    lead_status: (patch.lead_status ?? current.lead_status) as string | null,
    owner: (patch.owner !== undefined ? patch.owner : current.owner) as string | null,
    next_action_at: (patch.next_action_at !== undefined
      ? patch.next_action_at
      : current.next_action_at) as string | null,
    do_not_contact: (patch.do_not_contact ?? current.do_not_contact) as boolean,
  };

  const ACTIVE = [
    "new",
    "awaiting_review",
    "contact_allowed",
    "contact_attempted",
    "connected",
    "follow_up_required",
  ];

  if (!after.do_not_contact && after.lead_status && ACTIVE.includes(after.lead_status)) {
    if (!after.owner || !after.next_action_at) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Aktywny lead musi mieć właściciela i termin następnego działania. " +
            "Ustaw oba albo przenieś go do nurture, unqualified lub closed.",
        },
        { status: 422 },
      );
    }
  }

  const { error } = await db.from("leads").update(patch).eq("id", id);
  if (error) {
    console.error("[admin/crm] zapis kontaktu nieudany", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
