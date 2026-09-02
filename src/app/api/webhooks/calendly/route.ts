import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, emailLayout, ownerRecipients } from "@/lib/email";
import { eventUriFromInvitee } from "@/lib/calendly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Calendly (sekcje 13, 17, 23 oraz AA3).
 * Obsługiwane: invitee.created, invitee.canceled.
 *
 * Przełożenie terminu NIE jest osobnym zdarzeniem Calendly — przychodzi jako
 * para: anulowanie starego zaproszenia (`rescheduled: true`) i utworzenie
 * nowego (`old_invitee` wskazuje poprzednie). Kolejność dostarczenia nie jest
 * gwarantowana, więc obie gałęzie oznaczają starą rezerwację jako
 * `rescheduled`, a lead z nowym terminem nie jest cofany do CALL_CANCELED.
 *
 * Zasady:
 *  - podpis weryfikowany zgodnie z mechanizmem dostawcy (Calendly-Webhook-Signature),
 *  - handler jest IDEMPOTENTNY — powtórka tego samego zdarzenia nie tworzy duplikatu (T16),
 *  - payload logujemy w webhook_log do audytu.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("calendly-webhook-signature") ?? "";

  if (!verifySignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: "Nieprawidłowy podpis." }, { status: 401 });
  }

  let payload: CalendlyPayload;
  try {
    payload = JSON.parse(raw) as CalendlyPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const event = payload.event;
  const invitee = payload.payload;
  const eventUri = invitee?.scheduled_event?.uri ?? invitee?.uri ?? null;

  // Idempotencja: unikalny wpis (provider, external_id) blokuje ponowne przetworzenie.
  const externalId = eventUri ? `${event}:${eventUri}` : null;
  const { error: logError } = await db.from("webhook_log").insert({
    provider: "calendly",
    external_id: externalId,
    event_type: event,
    payload: payload as unknown as Record<string, unknown>,
  });

  // Naruszenie unikalności = to samo zdarzenie już obsłużone. Zwracamy 200, żeby Calendly nie ponawiał.
  if (logError?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (!eventUri) {
    return NextResponse.json({ ok: true, ignored: "brak identyfikatora wydarzenia" });
  }

  // Powiązanie: najpierw po application_id z utm_content, potem po e-mailu.
  const applicationId = invitee?.tracking?.utm_content ?? null;
  const inviteeEmail = invitee?.email?.toLowerCase() ?? null;

  const link = await resolveLead(applicationId, inviteeEmail);
  if (!link) {
    return NextResponse.json({ ok: true, ignored: "nie znaleziono leada" });
  }

  if (event === "invitee.created") {
    // Calendly nie ma zdarzenia „rescheduled": przy zmianie terminu wysyła
    // anulowanie starego zaproszenia i utworzenie nowego, wiążąc je polem
    // `old_invitee`. Stąd bierzemy poprzedni termin do historii (AA3).
    const previousStartAt = await readPreviousStart(invitee?.old_invitee ?? null);

    await db.from("bookings").upsert(
      {
        lead_id: link.leadId,
        application_id: link.applicationId,
        calendly_event_uri: eventUri,
        start_at: invitee?.scheduled_event?.start_time ?? null,
        end_at: invitee?.scheduled_event?.end_time ?? null,
        status: "booked",
        meeting_url: invitee?.scheduled_event?.location?.join_url ?? null,
        previous_start_at: previousStartAt,
      },
      { onConflict: "calendly_event_uri" },
    );

    // Stara rezerwacja zostaje w bazie jako ślad, ale przestaje być anulowaniem.
    // Zdarzenia potrafią przyjść w odwrotnej kolejności, więc oznaczamy ją
    // z obu stron — operacja jest idempotentna.
    const oldEventUri = eventUriFromInvitee(invitee?.old_invitee ?? null);
    if (oldEventUri) {
      await db.from("bookings").update({ status: "rescheduled" }).eq("calendly_event_uri", oldEventUri);
    }

    await db.from("leads").update({ lifecycle_status: "CALL_BOOKED" }).eq("id", link.leadId);

    // Token jednorazowy — po rezerwacji przestaje działać (sekcja 13).
    if (link.applicationId) {
      await db
        .from("applications")
        .update({ booking_token_used_at: new Date().toISOString() })
        .eq("id", link.applicationId);
    }

    await notifyOwner(invitee, "Nowa rezerwacja rozmowy");
  }

  if (event === "invitee.canceled") {
    // Przełożenie przychodzi jako anulowanie z `rescheduled: true`. Taki lead
    // NIE jest utracony — ma nowy termin, więc nie wolno cofać go do
    // CALL_CANCELED ani straszyć właściciela mailem o anulowaniu.
    const rescheduled = invitee?.rescheduled === true || Boolean(invitee?.new_invitee);

    await db
      .from("bookings")
      .update({ status: rescheduled ? "rescheduled" : "canceled" })
      .eq("calendly_event_uri", eventUri);

    if (!rescheduled) {
      await db.from("leads").update({ lifecycle_status: "CALL_CANCELED" }).eq("id", link.leadId);
    }

    await notifyOwner(invitee, rescheduled ? "Termin przełożony" : "Rezerwacja anulowana");
  }

  return NextResponse.json({ ok: true });
}

/** Weryfikacja podpisu Calendly: nagłówek w formacie `t=<timestamp>,v1=<hmac>`. */
function verifySignature(rawBody: string, header: string): boolean {
  const secret = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

  // Brak klucza = środowisko nieskonfigurowane. Odrzucamy, zamiast udawać weryfikację.
  if (!secret) return false;
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as { t?: string; v1?: string };

  if (!parts.t || !parts.v1) return false;

  // Okno tolerancji 5 minut — ogranicza atak powtórzeniowy.
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(parts.v1, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Termin poprzedniej rezerwacji — do kolumny `previous_start_at` (AA3). */
async function readPreviousStart(oldInviteeUri: string | null): Promise<string | null> {
  const oldEventUri = eventUriFromInvitee(oldInviteeUri);
  if (!oldEventUri) return null;

  const { data } = await supabaseAdmin()
    .from("bookings")
    .select("start_at")
    .eq("calendly_event_uri", oldEventUri)
    .maybeSingle();

  return data?.start_at ?? null;
}

async function resolveLead(
  applicationId: string | null,
  email: string | null,
): Promise<{ leadId: string; applicationId: string | null } | null> {
  const db = supabaseAdmin();

  if (applicationId) {
    const { data } = await db
      .from("applications")
      .select("id, lead_id")
      .eq("id", applicationId)
      .maybeSingle();
    if (data) return { leadId: data.lead_id, applicationId: data.id };
  }

  if (email) {
    const { data } = await db.from("leads").select("id").eq("email", email).maybeSingle();
    if (data) {
      const { data: app } = await db
        .from("applications")
        .select("id")
        .eq("lead_id", data.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { leadId: data.id, applicationId: app?.id ?? null };
    }
  }

  return null;
}

/** Powiadomienie właściciela o rezerwacji / anulowaniu (sekcja 17). */
async function notifyOwner(invitee: CalendlyPayload["payload"], subject: string) {
  const start = invitee?.scheduled_event?.start_time;
  const when = start ? new Date(start).toLocaleString("pl-PL") : "termin nieznany";

  await sendEmail({
    to: ownerRecipients(),
    subject,
    html: emailLayout(`
      <h1 style="margin:0 0 16px;font-size:22px;">${subject}</h1>
      <p style="margin:0;color:#aeb7c2;line-height:1.7;">
        <strong style="color:#fff;">${escapeHtml(invitee?.name ?? "—")}</strong><br>
        ${escapeHtml(invitee?.email ?? "—")}<br>
        Termin: ${escapeHtml(when)}
      </p>
    `),
    text: `${subject}\n\n${invitee?.name ?? "—"}\n${invitee?.email ?? "—"}\nTermin: ${when}`,
  });
}

const escapeHtml = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

interface CalendlyPayload {
  event: string;
  payload?: {
    uri?: string;
    name?: string;
    email?: string;
    /** Ustawiane przez Calendly przy przełożeniu terminu — patrz obsługa AA3. */
    rescheduled?: boolean;
    old_invitee?: string | null;
    new_invitee?: string | null;
    tracking?: { utm_content?: string };
    scheduled_event?: {
      uri?: string;
      start_time?: string;
      end_time?: string;
      location?: { join_url?: string };
    };
  };
}
