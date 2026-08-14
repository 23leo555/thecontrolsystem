import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/leads — lista leadów z filtrami (sekcja 15).
 * Filtry: lifecycle, status A/B/C, zakres dat, min. score, źródło, wyszukiwarka.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return unauthorized();

  const p = req.nextUrl.searchParams;
  const lifecycle = p.get("lifecycle");
  const status = p.get("status");
  const source = p.get("source");
  const from = p.get("from");
  const to = p.get("to");
  const minScore = p.get("minScore");
  const q = p.get("q")?.trim();
  const limit = Math.min(Number(p.get("limit") ?? 100), 500);

  const db = supabaseAdmin();

  // Aplikacje dociągamy razem z leadem — panel pokazuje najnowszą aplikację leada.
  let query = db
    .from("leads")
    .select(
      `id, created_at, first_name, email, phone_e164, lifecycle_status,
       utm_source, source_first, notes,
       applications ( id, score, qualification_status, cap_reason, hard_rule_reason,
                      submitted_at, manual_decision, is_draft )`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (lifecycle) query = query.eq("lifecycle_status", lifecycle);
  if (source) query = query.eq("utm_source", source);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);
  if (q) {
    const safe = q.replace(/[%,()]/g, "");
    query = query.or(
      `first_name.ilike.%${safe}%,email.ilike.%${safe}%,phone_e164.ilike.%${safe}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Filtry po polach aplikacji stosujemy po stronie serwera — relacja zagnieżdżona.
  type AppRow = {
    id: string; score: number | null; qualification_status: "A" | "B" | "C" | null;
    cap_reason: string | null; hard_rule_reason: string | null;
    submitted_at: string | null; manual_decision: string | null; is_draft: boolean;
  };

  const rows = (data ?? [])
    .map((lead) => {
      const apps = ((lead.applications ?? []) as AppRow[])
        .filter((a) => !a.is_draft)
        .sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""));
      const latest = apps[0] ?? null;
      const { applications: _drop, ...rest } = lead as typeof lead & { applications: unknown };
      return { ...rest, application: latest };
    })
    .filter((r) => {
      if (status && r.application?.qualification_status !== status) return false;
      if (minScore && (r.application?.score ?? -1) < Number(minScore)) return false;
      return true;
    });

  return NextResponse.json({ ok: true, leads: rows, count: rows.length });
}
