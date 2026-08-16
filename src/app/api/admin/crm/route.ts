import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { CRM_VIEWS, findView } from "@/lib/crm/views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/crm — jeden widok operacyjny plus liczniki wszystkich (K1).
 *
 * Liczniki lecą jednym przebiegiem, żeby pasek nawigacji pokazywał od razu,
 * gdzie coś czeka. To one decydują, czy właściciel w ogóle wejdzie na listę.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return unauthorized();

  const view = findView(req.nextUrl.searchParams.get("view"));
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 100), 500);
  const db = supabaseAdmin();

  const [rowsRes, counts] = await Promise.all([
    db.from(view.table).select("*").limit(limit),
    Promise.all(
      CRM_VIEWS.map(async (v) => {
        const { count } = await db.from(v.table).select("*", { count: "exact", head: true });
        return [v.key, count ?? 0] as const;
      }),
    ),
  ]);

  if (rowsRes.error) {
    console.error("[admin/crm] odczyt widoku nieudany", view.table, rowsRes.error.message);
    return NextResponse.json({ ok: false, error: rowsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    view: view.key,
    rows: rowsRes.data ?? [],
    counts: Object.fromEntries(counts),
  });
}
