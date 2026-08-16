import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isValidEmail, isValidFirstName, normalizeEmail, toE164 } from "@/lib/validation";
import { verifyTurnstile } from "@/lib/turnstile";
import { rateLimit, pruneRateLimits } from "@/lib/rateLimit";
import { sendEmail, protocolDeliveryTemplate, resetLeadOwnerTemplate } from "@/lib/email";
import { site } from "@/lib/site";
import { resetCopy } from "@/content/reset";
import { recordConsents, retentionUntil } from "@/lib/crm/consent";
import { signDeliveryToken, deliveryCookie } from "@/lib/resendToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ResetBody {
  firstName?: string;
  email?: string;
  phone?: string;
  marketingConsent?: boolean;
  phoneConsent?: boolean;
  consentVersion?: string;
  phoneConsentVersion?: string;
  turnstileToken?: string;
  source?: Record<string, string | undefined>;
}

/**
 * POST /api/reset — zapis leada + wysyłka Protokołu (sekcja 7).
 *
 * Kluczowa zasada z sekcji 23: błąd wysyłki e-maila NIE może skasować leada.
 * Lead zapisujemy zawsze; e-mail jest best-effort i logowany w email_events.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  pruneRateLimits();
  const limited = rateLimit(`reset:${ip}`, 5, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, error: "Zbyt wiele prób. Spróbuj ponownie za chwilę." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let body: ResetBody;
  try {
    body = (await req.json()) as ResetBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const firstName = (body.firstName ?? "").trim();
  const email = normalizeEmail(body.email ?? "");
  // Telefon jest obowiązkowy od 2026-08-15 (decyzja właściciela). Walidacja musi
  // stać także tutaj — sprawdzenie w przeglądarce da się pominąć zwykłym curlem.
  const phone = toE164(body.phone ?? "");

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
  if (!phone) {
    return NextResponse.json(
      { ok: false, field: "phone", error: "Podaj poprawny numer telefonu." },
      { status: 400 },
    );
  }
  // Obie zgody wymagane od 2026-08-16 (decyzja właściciela, nadpisuje brief V2
  // sekcja 8, gdzie były opcjonalne). Walidacja klienta da się pominąć zwykłym
  // curlem, więc serwer nie może ufać samej wartości z body bez sprawdzenia.
  // Nadal NIE wymagamy osobnej zgody na politykę prywatności — to informacja,
  // nie umowa wymagająca zgody.
  if (body.marketingConsent !== true) {
    return NextResponse.json(
      { ok: false, field: "marketingConsent", error: "Zaznacz zgodę na kontakt mailowy, aby otrzymać Protokół." },
      { status: 400 },
    );
  }
  if (body.phoneConsent !== true) {
    return NextResponse.json(
      { ok: false, field: "phoneConsent", error: "Zaznacz zgodę na kontakt telefoniczny, aby otrzymać Protokół." },
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

  const src = body.source ?? {};
  const db = supabaseAdmin();

  // Idempotencja: ten sam e-mail nie tworzy drugiego leada, tylko aktualizuje istniejącego
  // (sekcja 23: „Ten sam email wraca po tygodniu").
  // Atrybucja first-touch jest zachowywana po stronie bazy — patrz funkcja upsert_lead.
  const { data: rows, error: upsertError } = await db.rpc("upsert_lead", {
    p_first_name: firstName,
    p_email: email,
    p_marketing_consent: body.marketingConsent === true,
    // Rozliczalność zgody: zapisujemy, która wersja treści obowiązywała.
    p_consent_version: body.consentVersion ?? site.consentVersion,
    p_source_first: src.source_first ?? "reset_form",
    p_utm_source: src.utm_source ?? null,
    p_utm_medium: src.utm_medium ?? null,
    p_utm_campaign: src.utm_campaign ?? null,
    p_utm_content: src.utm_content ?? null,
    p_utm_term: src.utm_term ?? null,
    p_referrer: src.referrer ?? null,
    p_landing_path: src.landing_path ?? null,
  });

  const lead = Array.isArray(rows)
    ? (rows[0] as { id: string; email_bounced: boolean } | undefined)
    : undefined;

  // `upsert_lead` nie przyjmuje telefonu ani zgody telefonicznej (powstała, gdy
  // formularz zbierał wyłącznie imię i e-mail), więc dopisujemy je osobno.
  // Nieudany zapis nie może przerwać wysyłki Protokołu — lead jest już w bazie.
  if (lead?.id) {
    const marketingConsent = body.marketingConsent === true;
    const phoneConsent = body.phoneConsent === true;
    const emailVersion = body.consentVersion ?? site.consentVersion;
    const phoneVersion = body.phoneConsentVersion ?? site.phoneConsentVersion;

    const { error: phoneError } = await db
      .from("leads")
      .update({
        phone_e164: phone,
        // Sam podany numer NIE jest zgodą na dzwonienie (PKE art. 398) —
        // zapisujemy wyłącznie jawny wybór użytkownika, wraz z dowodem:
        // kiedy i na jakiej treści go dokonał.
        phone_consent: phoneConsent,
        phone_consent_at: phoneConsent ? new Date().toISOString() : null,
        phone_consent_version: phoneConsent ? phoneVersion : null,
        // Model CRM (F1, F2): lejek, atrybucja i termin retencji ustawiane przy
        // pierwszym zapisie. first_* chroni trigger w bazie, więc powrót tej
        // samej osoby nie nadpisze pierwotnego źródła.
        funnel_origin: "protocol_download",
        first_touch_at: new Date().toISOString(),
        latest_touch_at: new Date().toISOString(),
        first_landing_page: src.landing_path ?? "/reset",
        latest_landing_page: src.landing_path ?? "/reset",
        conversion_utm_source: src.utm_source ?? null,
        conversion_utm_campaign: src.utm_campaign ?? null,
        conversion_at: new Date().toISOString(),
        lead_status: "new",
        data_retention_until: retentionUntil({ hasMarketingConsent: marketingConsent }),
      })
      .eq("id", lead.id);
    if (phoneError) console.error("[/api/reset] zapis telefonu/zgody nieudany:", phoneError.message);

    // Rejestr dowodowy (F3) — osobny wpis per kanał, ze skrótem dokładnej treści.
    // Zapisujemy także odmowy: brak zgody to również fakt, który trzeba wykazać.
    await recordConsents({
      leadId: lead.id,
      sourcePage: src.landing_path ?? "/reset",
      formId: "reset_protocol_form",
      privacyNoticeVersion: emailVersion,
      entries: [
        {
          type: "marketing_email",
          status: marketingConsent ? "granted" : "denied",
          version: emailVersion,
          text: resetCopy.form.marketingConsent,
        },
        {
          type: "marketing_phone",
          status: phoneConsent ? "granted" : "denied",
          version: phoneVersion,
          text: resetCopy.form.phoneConsent,
        },
      ],
    });
  }

  if (upsertError || !lead) {
    // Log serwerowy — bez niego 500 jest nie do zdiagnozowania na produkcji.
    // Nie zawiera danych osobowych, tylko komunikat bazy.
    console.error("[/api/reset] upsert_lead nieudany:", {
      message: upsertError?.message,
      code: upsertError?.code,
      details: upsertError?.details,
      hint: upsertError?.hint,
    });
    return NextResponse.json(
      { ok: false, error: "Nie udało się zapisać zgłoszenia. Spróbuj ponownie." },
      { status: 500 },
    );
  }

  // --- Powiadomienie właściciela: best effort, niezależne od maila do leada ---
  // Do tej pory leady z /reset lądowały wyłącznie w bazie — trzeba było
  // sprawdzać panel, żeby je zobaczyć. Ten mail trafia od razu do skrzynki.
  const ownerTpl = resetLeadOwnerTemplate({
    firstName,
    email,
    phone,
    marketingConsent: body.marketingConsent === true,
    source: src,
  });
  const ownerSent = await sendEmail({
    to: process.env.OWNER_EMAIL ?? site.ownerEmail,
    subject: ownerTpl.subject,
    html: ownerTpl.html,
    text: ownerTpl.text,
  });
  await db.from("email_events").insert({
    lead_id: lead.id,
    provider_message_id: ownerSent.messageId ?? null,
    template_key: "reset_lead_owner",
    event_type: ownerSent.ok ? "sent" : "bounced",
    raw_event: ownerSent.ok ? null : { error: ownerSent.error },
  });
  if (!ownerSent.ok) {
    console.error("[/api/reset] powiadomienie właściciela nieudane:", ownerSent.error);
  }

  // --- E-mail do leada: best effort, nie blokuje sukcesu zapisu ---
  let emailOk = false;
  if (!lead.email_bounced) {
    const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? site.url}/protokol-resetu.pdf`;
    const tpl = protocolDeliveryTemplate(firstName, downloadUrl);
    const sent = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    emailOk = sent.ok;

    await db.from("email_events").insert({
      lead_id: lead.id,
      provider_message_id: sent.messageId ?? null,
      template_key: "protocol_delivery",
      event_type: sent.ok ? "sent" : "bounced",
      raw_event: sent.ok ? null : { error: sent.error },
    });

    // Status dostarczenia na samym leadzie (brief sekcja 15) — żeby dało się
    // filtrować bez joinowania email_events. Nieudana wysyłka NIE cofa zapisu
    // leada; użytkownik i tak pobierze PDF ze strony podziękowania.
    await db
      .from("leads")
      .update({
        email_status: sent.ok ? "sent" : "bounced",
        protocol_sent_at: sent.ok ? new Date().toISOString() : null,
      })
      .eq("id", lead.id);
  }

  const response = NextResponse.json({ ok: true, emailSent: emailOk });

  // Kontekst ponownej wysyłki (brief resendu, sekcja 9.1) — wyłącznie id leada,
  // podpisane HMAC-em. Bez sekretu w env po prostu nie wystawiamy cookie:
  // resend wtedy pokaże stan „brak kontekstu", zamiast wywalić 500.
  const token = signDeliveryToken(lead.id);
  if (token) {
    response.cookies.set(deliveryCookie.name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: deliveryCookie.maxAgeSec,
      path: "/",
    });
  }

  return response;
}
