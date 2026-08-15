import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { questions } from "@/lib/questions";
import type { Answers } from "@/lib/questions";
import { QUESTIONS as APPLY_QUESTIONS } from "@/lib/apply/questions";
import type { Answers as ApplyAnswers } from "@/lib/apply/questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/applications/:id — pełny widok aplikacji (sekcje 15 i AB3).
 *
 * W bazie żyją obok siebie DWA modele aplikacji:
 *  - stary lejek /aplikacja: `qualification_status` A/B/C, `hard_rule_reason`, `cap_reason`,
 *  - lejek /apply wg briefu v1.0: `status`, `hard_gate`, `caps`, `scoring_version`.
 *
 * Do 2026-08-15 endpoint czytał wyłącznie stare kolumny, przez co każde nowe
 * zgłoszenie wyglądało w panelu na puste — bez statusu, score i odpowiedzi.
 * Rozpoznajemy model po `scoring_version` i dobieramy właściwy zestaw pytań.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return unauthorized();

  const { id } = await ctx.params;
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("applications")
    .select(
      `id, created_at, submitted_at, score, qualification_status, hard_rule_reason, cap_reason,
       status, scoring_version, hard_gate, caps, is_draft, last_step,
       manual_decision, manual_decided_at, answers_json, booking_token_expires_at, booking_token_used_at,
       leads ( id, first_name, email, phone_e164, lifecycle_status, notes,
               utm_source, utm_medium, utm_campaign, referrer, landing_path, marketing_consent )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "Nie znaleziono." }, { status: 404 });

  const isV1 = Boolean(data.scoring_version);
  const answers = (data.answers_json ?? {}) as Record<string, unknown>;

  // Odpowiedzi w formie czytelnej dla człowieka — etykiety zamiast identyfikatorów.
  const readable = isV1 ? readApplyAnswers(answers as ApplyAnswers) : readLegacyAnswers(answers as Answers);

  return NextResponse.json({ ok: true, application: { ...data, is_v1: isV1 }, answers: readable });
}

/** Lejek /apply — opcje mają pole `value`, a odpowiedzi zawierają też imię, e-mail i telefon. */
function readApplyAnswers(answers: ApplyAnswers) {
  return APPLY_QUESTIONS.map((q) => {
    const raw = answers[q.id];
    let value: string;

    if (raw === undefined || raw === null || raw === "") value = "—";
    else if (Array.isArray(raw)) value = raw.map((v) => q.options?.find((o) => o.value === v)?.label ?? v).join(", ");
    else if (typeof raw === "object" && "first" in raw) value = `${raw.first} ${raw.last}`;
    else value = q.options?.find((o) => o.value === raw)?.label ?? String(raw);

    return { id: q.id, prompt: q.question, value };
  });
}

/** Stary lejek /aplikacja — opcje mają pole `id`. */
function readLegacyAnswers(answers: Answers) {
  return questions.map((q) => {
    const raw = answers[q.id];
    let value: string;

    if (raw === undefined || raw === null || raw === "") value = "—";
    else if (Array.isArray(raw)) value = raw.map((v) => q.options?.find((o) => o.id === v)?.label ?? v).join(", ");
    else if (typeof raw === "number") value = String(raw);
    else value = q.options?.find((o) => o.id === raw)?.label ?? String(raw);

    return { id: q.id, prompt: q.prompt, value };
  });
}
