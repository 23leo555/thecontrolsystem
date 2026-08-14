import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { evaluate, scoringConfigFromEnv } from "@/lib/scoring";
import type { Answers } from "@/lib/questions";
import { isValidEmail, isValidFirstName, normalizeEmail, toE164 } from "@/lib/validation";
import { verifyTurnstile } from "@/lib/turnstile";
import { rateLimit, pruneRateLimits } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import {
  qualifiedNotBookedTemplate,
  manualReviewUserTemplate,
  manualReviewOwnerTemplate,
  notQualifiedTemplate,
} from "@/lib/emailTemplates";
import { generateBookingToken } from "@/lib/tokens";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubmitBody {
  answers?: Answers;
  firstName?: string;
  email?: string;
  phone?: string;
  consent?: boolean;
  marketingConsent?: boolean;
  turnstileToken?: string;
  idempotencyKey?: string;
  source?: Record<string, string | undefined>;
}

/**
 * POST /api/aplikacja — finalny submit aplikacji (sekcje 11, 12, 17).
 *
 * Scoring liczony WYŁĄCZNIE tutaj. Klient nigdy nie dostaje score ani powodu decyzji —
 * w odpowiedzi wraca tylko status i (dla A) link do rezerwacji.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  pruneRateLimits();
  const limited = rateLimit(`aplikacja:${ip}`, 5, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, error: "Zbyt wiele prób. Spróbuj ponownie za chwilę." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const firstName = (body.firstName ?? "").trim();
  const email = normalizeEmail(body.email ?? "");
  const phone = body.phone ? toE164(body.phone) : null;
  const answers = body.answers ?? {};

  if (!isValidFirstName(firstName)) {
    return NextResponse.json(
      { ok: false, field: "firstName", error: "Podaj imię (minimum 2 znaki)." },
      { status: 400 },
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, field: "email", error: "Podaj poprawny adres e-mail." },
      { status: 400 },
    );
  }
  if (body.phone && !phone) {
    return NextResponse.json(
      { ok: false, field: "phone", error: "Podaj poprawny numer telefonu." },
      { status: 400 },
    );
  }
  if (body.consent !== true) {
    return NextResponse.json(
      { ok: false, field: "consent", error: "Zgoda na przetwarzanie danych jest wymagana." },
      { status: 400 },
    );
  }

  const turnstile = await verifyTurnstile(body.turnstileToken, ip);
  if (!turnstile.ok) {
    return NextResponse.json(
      { ok: false, error: "Weryfikacja antyspamowa nie powiodła się. Odśwież stronę." },
      { status: 400 },
    );
  }

  const db = supabaseAdmin();
  const src = body.source ?? {};

  // --- Lead (first-touch attribution zachowana przez funkcję w bazie) ---
  const { data: leadRows, error: leadError } = await db.rpc("upsert_lead", {
    p_first_name: firstName,
    p_email: email,
    p_marketing_consent: body.marketingConsent === true,
    p_source_first: src.source_first ?? "application",
    p_utm_source: src.utm_source ?? null,
    p_utm_medium: src.utm_medium ?? null,
    p_utm_campaign: src.utm_campaign ?? null,
    p_utm_content: src.utm_content ?? null,
    p_utm_term: src.utm_term ?? null,
    p_referrer: src.referrer ?? null,
    p_landing_path: src.landing_path ?? null,
  });

  const lead = Array.isArray(leadRows)
    ? (leadRows[0] as { id: string; email_bounced: boolean } | undefined)
    : undefined;

  if (leadError || !lead) {
    return NextResponse.json(
      { ok: false, error: "Nie udało się zapisać aplikacji. Spróbuj ponownie." },
      { status: 500 },
    );
  }

  if (phone) await db.from("leads").update({ phone_e164: phone }).eq("id", lead.id);

  // --- SCORING (server-side, deterministyczny) ---
  const result = evaluate(answers, scoringConfigFromEnv());

  // --- Token do /rozmowa tylko dla Statusu A ---
  const booking = result.status === "A" ? generateBookingToken() : null;

  const lifecycle =
    result.status === "A" ? "QUALIFIED" : result.status === "B" ? "MANUAL_REVIEW" : "NOT_QUALIFIED";

  // Idempotencja podwójnego submitu (sekcja 23).
  const idempotencyKey = body.idempotencyKey ?? null;
  if (idempotencyKey) {
    const { data: existing } = await db
      .from("applications")
      .select("id, qualification_status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, status: existing.qualification_status, duplicate: true });
    }
  }

  const { data: application, error: appError } = await db
    .from("applications")
    .insert({
      lead_id: lead.id,
      form_version: "v1",
      answers_json: answers,
      score: result.score,
      qualification_status: result.status,
      hard_rule_reason: result.hardRuleReason,
      cap_reason: result.capReason,
      is_draft: false,
      submitted_at: new Date().toISOString(),
      booking_token_hash: booking?.hash ?? null,
      booking_token_expires_at: booking?.expiresAt ?? null,
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();

  if (appError || !application) {
    return NextResponse.json(
      { ok: false, error: "Nie udało się zapisać aplikacji. Spróbuj ponownie." },
      { status: 500 },
    );
  }

  await db.from("leads").update({ lifecycle_status: lifecycle }).eq("id", lead.id);

  // --- Automatyzacje e-mail (best effort — błąd nie unieważnia aplikacji, sekcja 23) ---
  const callUrl = booking ? `${site.url}${site.routes.call}?t=${booking.token}` : null;
  void dispatchEmails({
    status: result.status,
    firstName,
    email,
    phone,
    leadId: lead.id,
    emailBounced: lead.email_bounced,
    applicationId: application.id,
    callUrl,
    score: result.score,
    capReason: result.capReason,
    hardRuleReason: result.hardRuleReason,
    answers,
    src,
  });

  // Klient dostaje TYLKO status — nigdy score ani powodu (sekcja 12).
  return NextResponse.json({
    ok: true,
    status: result.status,
    ...(callUrl ? { callUrl } : {}),
  });
}

/** Wysyłka wiadomości zależnie od statusu. Loguje wynik w email_events. */
async function dispatchEmails(args: {
  status: "A" | "B" | "C";
  firstName: string;
  email: string;
  phone: string | null;
  leadId: string;
  emailBounced: boolean;
  applicationId: string;
  callUrl: string | null;
  score: number;
  capReason: string | null;
  hardRuleReason: string | null;
  answers: Answers;
  src: Record<string, string | undefined>;
}) {
  const db = supabaseAdmin();

  const log = async (templateKey: string, res: { ok: boolean; messageId?: string; error?: string }) => {
    await db.from("email_events").insert({
      lead_id: args.leadId,
      provider_message_id: res.messageId ?? null,
      template_key: templateKey,
      event_type: res.ok ? "sent" : "bounced",
      raw_event: res.ok ? null : { error: res.error },
    });
  };

  try {
    if (args.status === "A" && args.callUrl && !args.emailBounced) {
      const tpl = qualifiedNotBookedTemplate(args.firstName, args.callUrl);
      await log("qualified_not_booked", await sendEmail({ to: args.email, ...tpl }));
    }

    if (args.status === "B") {
      if (!args.emailBounced) {
        const tpl = manualReviewUserTemplate(args.firstName);
        await log("manual_review_user", await sendEmail({ to: args.email, ...tpl }));
      }
      // Powiadomienie właściciela — zawsze, niezależnie od stanu skrzynki leada.
      const ownerTpl = manualReviewOwnerTemplate({
        firstName: args.firstName,
        email: args.email,
        phone: args.phone,
        score: args.score,
        capReason: args.capReason,
        hardRuleReason: args.hardRuleReason,
        answers: args.answers,
        utm: {
          utm_source: args.src.utm_source ?? null,
          utm_medium: args.src.utm_medium ?? null,
          utm_campaign: args.src.utm_campaign ?? null,
          referrer: args.src.referrer ?? null,
        },
        applicationId: args.applicationId,
      });
      await log(
        "manual_review_owner",
        await sendEmail({ to: process.env.OWNER_EMAIL ?? site.ownerEmail, ...ownerTpl }),
      );
    }

    if (args.status === "C" && !args.emailBounced) {
      const tpl = notQualifiedTemplate(args.firstName);
      await log("not_qualified", await sendEmail({ to: args.email, ...tpl }));
    }
  } catch {
    // Świadomie połykamy — aplikacja jest już zapisana, e-mail jest best effort.
  }
}
