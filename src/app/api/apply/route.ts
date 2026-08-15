import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { validateApplication } from "@/lib/apply/validation";
import { evaluate, type Status } from "@/lib/apply/scoring";
import type { Answers } from "@/lib/apply/questions";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import {
  qualifiedTemplate,
  manualReviewTemplate,
  notQualifiedTemplate,
  ownerNotificationTemplate,
} from "@/lib/apply/emails";
import { site } from "@/lib/site";

/**
 * Submit aplikacji — sekcje V, W2, W3, X2 i AC.
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

const resultPath = (applicationId: string) =>
  `/apply/result/${signResultToken(applicationId, Date.now() + RESULT_TTL_DAYS * 24 * 60 * 60 * 1000)}`;

const saveFailed = () =>
  NextResponse.json(
    { errors: { form: "Nie udało się zapisać aplikacji. Spróbuj ponownie za chwilę." } },
    { status: 503 },
  );

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

  // Nagłówek pochodzi od klienta i trafia do zapytań, więc dopuszczamy wyłącznie
  // bezpieczny zestaw znaków; cokolwiek innego zastępujemy identyfikatorem aplikacji.
  const rawKey = request.headers.get("Idempotency-Key") ?? "";
  const idempotencyKey = /^[A-Za-z0-9._:-]{1,128}$/.test(rawKey) ? rawKey : applicationId;

  // Snapshot źródła ruchu zamrażany w chwili submitu (T4).
  const source = (typeof body.source === "object" && body.source !== null ? body.source : {}) as Record<
    string,
    unknown
  >;

  const db = supabaseAdmin();

  // --- Ponowienie tego samego submitu (AC7: maksymalnie jedna wiadomość statusowa) ---
  // Dwa warianty powtórki: ten sam klucz idempotencji (ponowienie po timeoucie)
  // albo ta sama aplikacja wysłana drugi raz. W obu oddajemy ten sam link
  // i nie wysyłamy drugiego kompletu e-maili.
  const alreadySubmitted = await findSubmitted(applicationId, idempotencyKey);
  if (alreadySubmitted === "error") return saveFailed();
  if (alreadySubmitted) {
    return NextResponse.json({ redirect: resultPath(alreadySubmitted) }, { status: 200 });
  }

  // --- Lead (AB1) ---
  // Powstaje dopiero przy submicie: do tej chwili aplikacja jest anonimowym draftem (T4).
  // Bez leada webhook Calendly nie miałby czego powiązać z rezerwacją (AA3).
  const leadId = await upsertLead(validation.normalized, source);

  try {
    // UWAGA: klient Supabase NIE rzuca wyjątkiem przy błędzie bazy — zwraca go
    // w polu `error`. Bez tego sprawdzenia nieudany zapis przechodzi bezszelestnie
    // i aplikacja kandydata przepada.
    //
    // Arbitrem konfliktu jest `id`, a NIE `idempotency_key`: draft o tym samym
    // identyfikatorze już istnieje (T4), więc upsert po kluczu idempotencji
    // próbowałby wstawić nowy wiersz i wywracał się na kluczu głównym.
    const { error } = await db.from("applications").upsert(
      {
        id: applicationId,
        lead_id: leadId,
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
      { onConflict: "id" },
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
      return saveFailed();
    }
  } catch (err) {
    console.error("[apply] wyjątek przy zapisie aplikacji", err);
    return saveFailed();
  }

  const redirect = resultPath(applicationId);

  // Aplikacja jest już zapisana — od tej chwili nic nie może cofnąć sukcesu (AB2).
  await dispatchEmails({
    status: result.status,
    score: result.score,
    answers: validation.normalized,
    source,
    applicationId,
    leadId,
    resultUrl: `${site.url}${redirect}`,
  });

  return NextResponse.json({ redirect }, { status: 200 });
}

/**
 * Szuka już wysłanej aplikacji — po identyfikatorze i po kluczu idempotencji.
 * Zwraca id znalezionego zgłoszenia, null przy jego braku albo "error",
 * gdy baza nie odpowiedziała (wtedy nie wolno zgadywać i nadpisywać).
 */
async function findSubmitted(
  applicationId: string,
  idempotencyKey: string,
): Promise<string | null | "error"> {
  const db = supabaseAdmin();

  for (const [column, value] of [
    ["id", applicationId],
    ["idempotency_key", idempotencyKey],
  ] as const) {
    const { data, error } = await db
      .from("applications")
      .select("id, is_draft")
      .eq(column, value)
      .maybeSingle();

    if (error) {
      console.error("[apply] nie udało się sprawdzić idempotencji", error.message);
      return "error";
    }
    if (data && data.is_draft === false) return data.id;
  }

  return null;
}

/**
 * Upsert leada z zachowaniem atrybucji first touch (funkcja `upsert_lead`).
 * Zwraca null, jeśli zapis się nie uda — brak leada nie może przerwać submitu,
 * bo aplikacja i tak zostanie zapisana (lead_id jest od migracji 0006 opcjonalny).
 */
async function upsertLead(answers: Answers, source: Record<string, unknown>): Promise<string | null> {
  const str = (key: string): string | null => {
    const v = source[key];
    return typeof v === "string" && v ? v : null;
  };

  const name = answers.name as { first: string; last: string } | undefined;
  const email = typeof answers.email === "string" ? answers.email : null;
  if (!name?.first || !email) return null;

  const db = supabaseAdmin();

  try {
    const { data, error } = await db.rpc("upsert_lead", {
      p_first_name: name.first,
      p_email: email,
      // Formularz aplikacji zbiera wyłącznie potwierdzenie klauzuli prywatności (U16).
      // Zgody marketingowej tu nie ma, więc nie wolno jej domniemywać.
      p_marketing_consent: false,
      p_source_first: str("source_first") ?? "application",
      p_utm_source: str("utm_source"),
      p_utm_medium: str("utm_medium"),
      p_utm_campaign: str("utm_campaign"),
      p_utm_content: str("utm_content"),
      p_utm_term: str("utm_term"),
      p_referrer: str("referrer"),
      p_landing_path: str("landing_path"),
    });

    if (error) {
      console.error("[apply] nie udało się zapisać leada", error.message);
      return null;
    }

    const lead = Array.isArray(data) ? (data[0] as { id?: string } | undefined) : undefined;
    if (!lead?.id) return null;

    // Telefon jest wymagany w tym formularzu (U15), a `upsert_lead` go nie przyjmuje.
    if (typeof answers.phone === "string" && answers.phone) {
      await db.from("leads").update({ phone_e164: answers.phone }).eq("id", lead.id);
    }

    return lead.id;
  } catch (err) {
    console.error("[apply] wyjątek przy zapisie leada", err);
    return null;
  }
}

/**
 * Wysyłka po submicie (AC2–AC4, AC6) plus zapis statusu dostarczenia w email_events (AC7).
 * Nigdy nie rzuca: aplikacja jest już w bazie, poczta jest best effort (AB2).
 */
async function dispatchEmails(args: {
  status: Status;
  score: number;
  answers: Answers;
  source: Record<string, unknown>;
  applicationId: string;
  leadId: string | null;
  resultUrl: string;
}) {
  const name = args.answers.name as { first: string; last: string } | undefined;
  const email = typeof args.answers.email === "string" ? args.answers.email : null;
  if (!name?.first || !email) return;

  const db = supabaseAdmin();

  // AC7: logujemy status dostarczenia, nigdy treści wiadomości.
  const log = async (templateKey: string, res: { ok: boolean; messageId?: string; error?: string }) => {
    if (!res.ok) console.error(`[apply] e-mail ${templateKey} nie wyszedł`, res.error);
    try {
      await db.from("email_events").insert({
        lead_id: args.leadId,
        provider_message_id: res.messageId ?? null,
        template_key: templateKey,
        event_type: res.ok ? "sent" : "bounced",
        raw_event: res.ok ? null : { error: res.error },
      });
    } catch (err) {
      console.error("[apply] nie udało się zapisać zdarzenia e-mail", err);
    }
  };

  try {
    if (args.status === "QUALIFIED") {
      await log("apply_qualified", await sendEmail({ to: email, ...qualifiedTemplate(name.first, args.resultUrl) }));
    } else if (args.status === "MANUAL_REVIEW") {
      await log("apply_manual_review", await sendEmail({ to: email, ...manualReviewTemplate(name.first) }));
    } else {
      await log("apply_not_qualified", await sendEmail({ to: email, ...notQualifiedTemplate(name.first) }));
    }

    // AC6 — powiadomienie wewnętrzne dla każdego statusu; właściciel musi widzieć
    // także odrzucenia, bo to jedyny sygnał o jakości ruchu z kampanii.
    const owner = ownerNotificationTemplate({
      firstName: name.first,
      lastName: name.last ?? "",
      status: args.status,
      score: args.score,
      answers: args.answers,
      source: args.source,
      applicationId: args.applicationId,
    });
    await log("apply_owner_notification", await sendEmail({ to: process.env.OWNER_EMAIL ?? site.ownerEmail, ...owner }));

    // Lifecycle leada trzyma stan lejka dla panelu i raportów (AB1).
    if (args.leadId) {
      await db.from("leads").update({ lifecycle_status: args.status }).eq("id", args.leadId);
    }
  } catch (err) {
    // Świadomie połykamy — zgłoszenie jest zapisane, poczta nie może go cofnąć.
    console.error("[apply] wyjątek przy wysyłce e-maili", err);
  }
}
