import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { validateApplication } from "@/lib/apply/validation";
import { evaluate } from "@/lib/apply/scoring";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Submit aplikacji — sekcje V, W2, W3 i X2.
 *
 * Kontrakt bezpieczeństwa (W3):
 * - status, score ani powód odrzucenia NIE wracają w tej odpowiedzi,
 * - klient dostaje wyłącznie podpisany link do strony wyniku,
 * - scoring liczy się tu i tylko tu; nic z klienta nie jest przyjmowane na wiarę.
 */

export const runtime = "nodejs";

/** Token wyniku ważny 7 dni (X2). */
const RESULT_TTL_DAYS = 7;

function signResultToken(applicationId: string, expiresAt: number): string {
  const secret = process.env.APPLY_RESULT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const payload = `${applicationId}.${expiresAt}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ errors: { form: "Nieprawidłowe żądanie." } }, { status: 400 });
  }

  const validation = validateApplication(body.answers, body.consent);
  if (!validation.ok) {
    // Zwracamy wyłącznie błędy pól — żadnych informacji o scoringu.
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const result = evaluate(validation.normalized);
  const applicationId =
    typeof body.applicationId === "string" && body.applicationId ? body.applicationId : crypto.randomUUID();
  const idempotencyKey = request.headers.get("Idempotency-Key") ?? applicationId;

  // Snapshot źródła ruchu zamrażany w chwili submitu (T4).
  const source = typeof body.source === "object" && body.source !== null ? body.source : {};

  try {
    const db = supabaseAdmin();
    // UWAGA: klient Supabase NIE rzuca wyjątkiem przy błędzie bazy — zwraca go
    // w polu `error`. Bez tego sprawdzenia nieudany zapis przechodzi bezszelestnie
    // i aplikacja kandydata przepada.
    const { error } = await db.from("applications").upsert(
      {
        id: applicationId,
        // Kolumna nazywa się answers_json — nazwa jest z pierwotnego schematu.
        answers_json: validation.normalized,
        form_version: result.version,
        score: result.score,
        status: result.status,
        scoring_version: result.version,
        hard_gate: result.hardGate,
        caps: result.caps,
        breakdown: result.breakdown,
        source_snapshot: source,
        idempotency_key: idempotencyKey,
        is_draft: false,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "idempotency_key" }
    );

    if (error) {
      console.error("[apply] zapis aplikacji nie powiódł się", {
        code: error.code,
        message: error.message,
        details: error.details,
        applicationId,
      });
      // Zgłoszenie kandydata jest zbyt cenne, żeby zniknąć po cichu.
      // Lepiej poprosić o ponowienie niż udawać sukces.
      return NextResponse.json(
        { errors: { form: "Nie udało się zapisać aplikacji. Spróbuj ponownie za chwilę." } },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("[apply] wyjątek przy zapisie aplikacji", err);
    return NextResponse.json(
      { errors: { form: "Nie udało się zapisać aplikacji. Spróbuj ponownie za chwilę." } },
      { status: 503 }
    );
  }

  const expiresAt = Date.now() + RESULT_TTL_DAYS * 24 * 60 * 60 * 1000;
  const token = signResultToken(applicationId, expiresAt);

  return NextResponse.json({ redirect: `/apply/result/${token}` }, { status: 200 });
}
