import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIFECYCLE = [
  "NEW_LEAD", "PROTOCOL_DOWNLOADED", "APPLICATION_STARTED", "APPLICATION_COMPLETED",
  "QUALIFIED", "MANUAL_REVIEW", "MANUAL_APPROVED", "NOT_QUALIFIED",
  "CALL_BOOKED", "CALL_CANCELED", "CALL_COMPLETED", "NO_SHOW", "FOLLOW_UP", "CLIENT", "LOST",
] as const;

/** PATCH /api/admin/leads/:id — notatki i zmiana statusu lifecycle (sekcja 15). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return unauthorized();

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    notes?: string;
    lifecycle_status?: string;
  };

  const patch: Record<string, string> = {};
  if (typeof body.notes === "string") patch.notes = body.notes.slice(0, 5000);
  if (body.lifecycle_status) {
    if (!LIFECYCLE.includes(body.lifecycle_status as (typeof LIFECYCLE)[number])) {
      return NextResponse.json({ ok: false, error: "Nieznany status." }, { status: 400 });
    }
    patch.lifecycle_status = body.lifecycle_status;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "Brak zmian." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db.from("leads").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
