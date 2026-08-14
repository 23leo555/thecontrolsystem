import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { questions } from "@/lib/questions";
import type { Answers } from "@/lib/questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/applications/:id — pełny widok aplikacji Q1–Q12 ze score i powodami (sekcja 15). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return unauthorized();

  const { id } = await ctx.params;
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("applications")
    .select(
      `id, created_at, submitted_at, score, qualification_status, hard_rule_reason, cap_reason,
       manual_decision, manual_decided_at, answers_json, booking_token_expires_at, booking_token_used_at,
       leads ( id, first_name, email, phone_e164, lifecycle_status, notes,
               utm_source, utm_medium, utm_campaign, referrer, landing_path, marketing_consent )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "Nie znaleziono." }, { status: 404 });

  // Odpowiedzi w formie czytelnej dla człowieka — etykiety zamiast identyfikatorów.
  const answers = (data.answers_json ?? {}) as Answers;
  const readable = questions.map((q) => {
    const raw = answers[q.id];
    let value: string;
    if (raw === undefined || raw === null || raw === "") value = "—";
    else if (Array.isArray(raw)) value = raw.map((v) => q.options?.find((o) => o.id === v)?.label ?? v).join(", ");
    else if (typeof raw === "number") value = String(raw);
    else value = q.options?.find((o) => o.id === raw)?.label ?? String(raw);
    return { id: q.id, prompt: q.prompt, value };
  });

  return NextResponse.json({ ok: true, application: data, answers: readable });
}
