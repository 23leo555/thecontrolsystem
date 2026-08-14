import { type NextRequest } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Escapowanie pola CSV — cudzysłowy podwajamy, całość w cudzysłowie. */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

/** GET /api/admin/export — eksport CSV listy leadów (sekcja 15). */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return unauthorized();

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("leads")
    .select(
      `created_at, first_name, email, phone_e164, lifecycle_status,
       utm_source, utm_medium, utm_campaign, referrer, marketing_consent, notes,
       applications ( score, qualification_status, cap_reason, hard_rule_reason, submitted_at, is_draft )`,
    )
    .order("created_at", { ascending: false });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  type AppRow = {
    score: number | null; qualification_status: string | null;
    cap_reason: string | null; hard_rule_reason: string | null;
    submitted_at: string | null; is_draft: boolean;
  };

  const headers = [
    "utworzono", "imie", "email", "telefon", "lifecycle", "status", "score",
    "cap_reason", "hard_rule_reason", "wyslano_aplikacje",
    "utm_source", "utm_medium", "utm_campaign", "referrer", "zgoda_marketing", "notatki",
  ];

  const lines = [headers.join(",")];

  for (const lead of data ?? []) {
    const apps = ((lead.applications ?? []) as AppRow[])
      .filter((a) => !a.is_draft)
      .sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""));
    const app = apps[0];

    lines.push(
      [
        lead.created_at, lead.first_name, lead.email, lead.phone_e164, lead.lifecycle_status,
        app?.qualification_status, app?.score, app?.cap_reason, app?.hard_rule_reason, app?.submitted_at,
        lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.referrer,
        lead.marketing_consent ? "tak" : "nie", lead.notes,
      ].map(csvCell).join(","),
    );
  }

  // BOM, żeby Excel poprawnie odczytał polskie znaki.
  const csv = "﻿" + lines.join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leady-${stamp}.csv"`,
    },
  });
}
