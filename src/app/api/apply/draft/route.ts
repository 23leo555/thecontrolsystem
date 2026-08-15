import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Drafty aplikacji — sekcja T4.
 *
 * Tworzy anonimowe application_id na starcie i odnotowuje postęp po każdym
 * kroku. Draft NIE wyzwala żadnego e-maila (T4) — wiadomości wychodzą dopiero
 * po finalnym submicie.
 *
 * Odpowiedzi nie są tu zapisywane w całości: przechowujemy numer kroku, żeby
 * mierzyć porzucenia, a pełne dane trafiają do bazy dopiero przy submicie.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const applicationId = crypto.randomUUID();

  try {
    const body = (await request.json().catch(() => ({}))) as { source?: unknown };
    const db = supabaseAdmin();
    await db.from("applications").insert({
      id: applicationId,
      status: "DRAFT",
      source_snapshot: body.source ?? {},
      started_at: new Date().toISOString(),
    });
  } catch (err) {
    // Brak draftu nie może zablokować wypełniania — submit i tak utworzy rekord.
    console.error("[apply/draft] nie udało się utworzyć draftu", err);
  }

  return NextResponse.json({ applicationId }, { status: 200 });
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { applicationId?: string; step?: number };
    if (!body.applicationId || typeof body.step !== "number") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const db = supabaseAdmin();
    await db
      .from("applications")
      .update({ last_step: body.step, updated_at: new Date().toISOString() })
      .eq("id", body.applicationId)
      .eq("status", "DRAFT");
  } catch (err) {
    console.error("[apply/draft] nie udało się zapisać postępu", err);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
