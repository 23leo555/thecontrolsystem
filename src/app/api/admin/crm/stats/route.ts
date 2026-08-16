import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/crm/stats — dane czterech dashboardów z sekcji K2.
 *
 * Wszystkie definicje metryk stoją w widokach SQL, nie tutaj. Ten endpoint
 * tylko je zbiera, żeby panel wykonał jedno żądanie zamiast pięciu.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return unauthorized();

  const db = supabaseAdmin();

  const [funnel, attribution, salesOps, compliance, consents] = await Promise.all([
    db.from("crm_stats_funnel").select("*"),
    db.from("crm_stats_attribution").select("*").limit(20),
    db.from("crm_stats_sales_ops").select("*").maybeSingle(),
    db.from("crm_stats_compliance").select("*").maybeSingle(),
    db.from("crm_stats_consents").select("*"),
  ]);

  const failed = [funnel, attribution, salesOps, compliance, consents].find((r) => r.error);
  if (failed?.error) {
    console.error("[admin/crm/stats] odczyt nieudany", failed.error.message);
    return NextResponse.json({ ok: false, error: failed.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    funnel: funnel.data ?? [],
    attribution: attribution.data ?? [],
    salesOps: salesOps.data ?? null,
    compliance: compliance.data ?? null,
    consents: consents.data ?? [],
  });
}
