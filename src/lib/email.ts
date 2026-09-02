/**
 * Warstwa wysyłki e-mail (Resend) — sekcja 16.
 * Tożsamość nadawcy: „Krystian Ćwik | The Control System", Reply-To na Gmaila Krystiana.
 * Gmail NIE jest silnikiem automatyzacji — tylko skrzynką odpowiedzi.
 */
import { site } from "@/lib/site";

export type TemplateKey =
  | "protocol_delivery"
  | "reset_lead_owner"
  | "protocol_download_owner"
  | "reset_day_1" | "reset_day_2" | "reset_day_3" | "reset_day_4"
  | "reset_day_5" | "reset_day_6" | "reset_day_7"
  | "qualified_not_booked" | "qualified_reminder"
  | "manual_review_user" | "manual_review_owner"
  | "manual_approved" | "not_qualified" | "booking_owner";

export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Wysyła wiadomość przez Resend. Nigdy nie rzuca — zwraca `ok:false`,
 * żeby błąd dostarczenia nie wywracał zapisu leada (sekcja 23).
 */
export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };

  const from =
    process.env.RESEND_FROM ??
    `Krystian Ćwik | The Control System <${site.ownerEmail}>`;
  const replyTo = process.env.RESEND_REPLY_TO ?? site.ownerEmail;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text, reply_to: replyTo }),
    });

    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      return { ok: false, error: body.message ?? `Resend HTTP ${res.status}` };
    }
    return { ok: true, messageId: body.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown error" };
  }
}

/**
 * Wspólny szkielet HTML — lekki, bez obrazów (sekcja 18: deliverability).
 *
 * Kolorystyka trzyma paletę aplikacji i landingu: tło #010205, karta #0a0e18,
 * tekst pomocniczy #808791, akcent #5b9eff. Akcent linków celowo jaśniejszy
 * (`primary-glow`) niż CTA — na ciemnym tle daje 7.7:1 zamiast 5.3:1.
 *
 * `color-scheme: dark` + `!important` na kolorach powstrzymuje Gmaila
 * i Outlooka przed samodzielnym inwertowaniem ciemnego motywu, po którym
 * ciemny tekst ląduje na ciemnym tle.
 */
export function emailLayout(bodyHtml: string): string {
  return `<!doctype html>
<html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<style>
  :root { color-scheme: dark; supported-color-schemes: dark; }
  a { color: #5b9eff; }
  @media (max-width: 600px) {
    .tcs-card { padding: 24px !important; border-radius: 12px !important; }
  }
</style>
</head>
<body style="margin:0;padding:24px;background:#010205 !important;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#f9fafc !important;">
  <div class="tcs-card" style="max-width:560px;margin:0 auto;background:#0a0e18 !important;border:1px solid rgba(45,51,64,.55);border-radius:16px;padding:32px;">
    <p style="margin:0 0 24px;letter-spacing:.22em;font-size:12px;color:#808791 !important;font-weight:600;">
      THE CONTROL SYSTEM
    </p>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid rgba(45,51,64,.55);margin:32px 0 16px;">
    <p style="margin:0 0 6px;font-size:12px;color:#f9fafc !important;font-weight:600;">
      Krystian Ćwik | The Control System
    </p>
    <p style="margin:0;font-size:12px;color:#808791 !important;">
      <a href="mailto:${site.ownerEmail}" style="color:#5b9eff !important;text-decoration:none;">${site.ownerEmail}</a>
      &nbsp;·&nbsp;
      <a href="tel:${site.ownerPhone}" style="color:#5b9eff !important;text-decoration:none;">${site.ownerPhoneDisplay}</a>
      &nbsp;·&nbsp;
      <a href="${site.instagramUrl}" style="color:#5b9eff !important;text-decoration:none;">Instagram ${site.instagram}</a>
    </p>
  </div>
</body></html>`;
}

/**
 * Szablon protocol_delivery — natychmiast po formularzu /reset.
 * Copy przepisane 1:1 z briefu V2, sekcja 17. Nie zmieniać bez akceptacji właściciela.
 *
 * Świadomie BEZ dopisków handlowych: wiadomość realizuje żądanie użytkownika
 * dotyczące Protokołu i idzie także do osób bez zgody marketingowej.
 * PS z linkiem do /system dokładamy dopiero po uruchomieniu tamtej strony
 * i wyłącznie dla osób ze zgodą.
 */
export function protocolDeliveryTemplate(firstName: string, downloadUrl: string) {
  const safeName = firstName.replace(/[<>]/g, "");
  return {
    subject: "Twój 7 dniowy Protokół Resetu",
    /** Preheader — pierwsza linia podglądu na liście wiadomości. */
    preheader: "Zacznij od Dnia 1. Nie próbuj wdrażać całego tygodnia naraz.",
    html: emailLayout(`
      <span style="display:none;max-height:0;overflow:hidden;opacity:0;">
        Zacznij od Dnia 1. Nie próbuj wdrażać całego tygodnia naraz.
      </span>
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Cześć ${safeName},</h1>
      <p style="margin:0 0 16px;color:#808791 !important;line-height:1.6;">
        Twój 7 dniowy Protokół Resetu jest gotowy.
      </p>
      <p style="margin:0 0 20px;color:#808791 !important;line-height:1.6;">
        Poniżej masz dostęp do pełnej wersji PDF:
      </p>
      <p style="margin:0 0 28px;">
        <a href="${downloadUrl}" style="display:inline-block;background:#4f76ff !important;color:#010205 !important;
           text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">
          POBIERZ PROTOKÓŁ RESETU
        </a>
      </p>
      <p style="margin:0 0 16px;color:#f9fafc !important;line-height:1.6;font-weight:700;">
        Zacznij od Dnia 1.
      </p>
      <p style="margin:0 0 16px;color:#808791 !important;line-height:1.6;">
        Nie czytaj całego dokumentu jak ebooka i nie próbuj wdrażać wszystkiego od razu.
        Ten materiał został zaprojektowany jako 7 dniowa instrukcja działania.
      </p>
      <p style="margin:0 0 8px;color:#808791 !important;line-height:1.6;">
        Każdego dnia otwierasz właściwą część, sprawdzasz:
      </p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#808791 !important;line-height:1.7;">
        <li>co robisz,</li>
        <li>kiedy to robisz,</li>
        <li>dlaczego robisz to właśnie wtedy,</li>
        <li>oraz jaka jest wersja minimum, jeżeli dzień nie przebiega zgodnie z planem.</li>
      </ul>
      <p style="margin:0 0 16px;color:#f9fafc !important;line-height:1.6;font-weight:700;">
        Najważniejsza zasada:
      </p>
      <p style="margin:0 0 16px;color:#808791 !important;line-height:1.6;">
        nie potrzebujesz 100 procent realizacji. Jeżeli coś wypadnie, nie zaczynasz od nowa.
        Wracasz do systemu przy następnej decyzji.
      </p>
      <p style="margin:0 0 24px;color:#808791 !important;line-height:1.6;">
        Po 7 dniach porównasz swoje dane z Dnia 1 i Dnia 7 oraz zobaczysz, które elementy dały
        Ci największą zmianę.
      </p>
      <p style="margin:0 0 4px;color:#808791 !important;line-height:1.6;">
        Powodzenia,<br>
        <span style="color:#f9fafc !important;">Krystian Ćwik</span><br>
        Twórca The Control System
      </p>
      <p style="margin:0;color:#808791 !important;line-height:1.6;font-size:14px;">
        <a href="mailto:${site.ownerEmail}" style="color:#5b9eff !important;text-decoration:none;">${site.ownerEmail}</a><br>
        Telefon: <a href="tel:${site.ownerPhone}" style="color:#5b9eff !important;text-decoration:none;">${site.ownerPhoneDisplay}</a><br>
        Instagram: <a href="${site.instagramUrl}" style="color:#5b9eff !important;text-decoration:none;">${site.instagram}</a>
      </p>
    `),
    text: `Cześć ${safeName},

Twój 7 dniowy Protokół Resetu jest gotowy.

Poniżej masz dostęp do pełnej wersji PDF:
${downloadUrl}

Zacznij od Dnia 1.

Nie czytaj całego dokumentu jak ebooka i nie próbuj wdrażać wszystkiego od razu.
Ten materiał został zaprojektowany jako 7 dniowa instrukcja działania.

Każdego dnia otwierasz właściwą część, sprawdzasz:
- co robisz,
- kiedy to robisz,
- dlaczego robisz to właśnie wtedy,
- oraz jaka jest wersja minimum, jeżeli dzień nie przebiega zgodnie z planem.

Najważniejsza zasada:
nie potrzebujesz 100 procent realizacji. Jeżeli coś wypadnie, nie zaczynasz od nowa.
Wracasz do systemu przy następnej decyzji.

Po 7 dniach porównasz swoje dane z Dnia 1 i Dnia 7 oraz zobaczysz, które elementy dały Ci
największą zmianę.

Powodzenia,
Krystian Ćwik
Twórca The Control System
${site.ownerEmail}
Telefon: ${site.ownerPhoneDisplay}
Instagram: ${site.instagram}`,
  };
}

const escLead = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

/**
 * Powiadomienie właściciela o nowym leadzie z /reset — do tej pory leady lądowały
 * wyłącznie w bazie i trzeba było zaglądać do panelu, żeby je zobaczyć. W
 * przeciwieństwie do powiadomienia z /apply (ownerNotificationTemplate) tu nie
 * ma score'u ani przesłanek do ukrywania danych: to jedyny cel tej wiadomości,
 * więc e-mail i telefon idą wprost w treści.
 */
export function resetLeadOwnerTemplate(args: {
  firstName: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
  source: Record<string, string | undefined>;
}) {
  const when = new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
  const src =
    ["utm_source", "utm_medium", "utm_campaign", "referrer", "landing_path"]
      .map((k) => (args.source[k] ? `${k}: ${args.source[k]}` : null))
      .filter(Boolean)
      .join(" · ") || "brak danych";

  const panelUrl = `${site.url}/admin`;

  const rows: Array<[string, string]> = [
    ["IMIĘ", args.firstName],
    ["E-MAIL", args.email],
    ["TELEFON", args.phone],
    ["ZGODA MARKETINGOWA", args.marketingConsent ? "tak" : "nie"],
    ["DATA", when],
    ["ŹRÓDŁO", src],
  ];

  const table = rows
    .map(
      ([k, v]) => `<tr>
        <td style="padding:10px 12px;color:#4f76ff !important;font-size:12px;font-weight:700;
                   letter-spacing:.08em;white-space:nowrap;vertical-align:top;">${k}</td>
        <td style="padding:10px 12px;color:#f9fafc !important;font-size:13px;">${escLead(v)}</td>
      </tr>`,
    )
    .join("");

  return {
    subject: `[TCS][Reset] Nowy lead: ${args.firstName}`,
    html: emailLayout(`
      <h1 style="margin:0 0 20px;font-size:22px;">${escLead(args.firstName)}</h1>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#0a0e18 !important;
                    border-radius:12px;overflow:hidden;">${table}</table>
      <p style="margin:0 0 24px;">
        <a href="mailto:${args.email}" style="display:inline-block;background:#4f76ff !important;color:#010205 !important;
           text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">NAPISZ DO NIEGO</a>
      </p>
      <p style="margin:0;color:#808791 !important;font-size:12px;">
        Pełna historia zgłoszenia jest też w <a href="${panelUrl}" style="color:#5b9eff !important;">panelu</a>.
      </p>
    `),
    text: `Nowy lead z Protokołu Resetu: ${args.firstName}

E-mail: ${args.email}
Telefon: ${args.phone}
Zgoda marketingowa: ${args.marketingConsent ? "tak" : "nie"}
Data: ${when}
Źródło: ${src}

Panel: ${panelUrl}`,
  };
}

/**
 * Powiadomienie właściciela o POBRANIU Protokołu.
 *
 * `resetLeadOwnerTemplate` mówi tylko tyle, że ktoś zostawił dane. Ta
 * wiadomość niesie sygnał o klasę mocniejszy: lead faktycznie otworzył
 * dokument, więc jest to najlepszy moment na kontakt. Dlatego dane kontaktowe
 * idą wprost w treści — tak samo jak w powiadomieniu o nowym leadzie.
 *
 * `downloadCount` rozróżnia pierwsze pobranie od powrotu do dokumentu; przy
 * powrocie temat wiadomości jest inny, żeby dało się je filtrować w skrzynce.
 */
export function protocolDownloadOwnerTemplate(args: {
  firstName: string;
  email: string;
  phone?: string | null;
  downloadCount: number;
  firstDownload: boolean;
}) {
  const when = new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
  const panelUrl = `${site.url}/admin`;
  const name = args.firstName?.trim() || "Bez imienia";

  const rows: Array<[string, string]> = [
    ["IMIĘ", name],
    ["E-MAIL", args.email],
    ["TELEFON", args.phone || "brak"],
    ["POBRANIE", args.firstDownload ? "pierwsze" : `kolejne (łącznie ${args.downloadCount})`],
    ["DATA", when],
  ];

  const table = rows
    .map(
      ([k, v]) => `<tr>
        <td style="padding:10px 12px;color:#4f76ff !important;font-size:12px;font-weight:700;
                   letter-spacing:.08em;white-space:nowrap;vertical-align:top;">${k}</td>
        <td style="padding:10px 12px;color:#f9fafc !important;font-size:13px;">${escLead(v)}</td>
      </tr>`,
    )
    .join("");

  const lead = args.firstDownload
    ? "Protokół został właśnie pobrany po raz pierwszy."
    : "Ta osoba wróciła do Protokołu i pobrała go ponownie.";

  return {
    subject: args.firstDownload
      ? `[TCS][Reset] Pobranie Protokołu: ${name}`
      : `[TCS][Reset] Ponowne pobranie Protokołu: ${name}`,
    html: emailLayout(`
      <h1 style="margin:0 0 12px;font-size:22px;">${escLead(name)}</h1>
      <p style="margin:0 0 20px;color:#808791 !important;line-height:1.6;">${lead}</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#0a0e18 !important;
                    border-radius:12px;overflow:hidden;">${table}</table>
      <p style="margin:0 0 24px;">
        <a href="mailto:${args.email}" style="display:inline-block;background:#4f76ff !important;color:#010205 !important;
           text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">NAPISZ DO NIEGO</a>
      </p>
      <p style="margin:0;color:#808791 !important;font-size:12px;">
        Pełna historia zgłoszenia jest też w <a href="${panelUrl}" style="color:#5b9eff !important;">panelu</a>.
      </p>
    `),
    text: `${lead}

Imię: ${name}
E-mail: ${args.email}
Telefon: ${args.phone || "brak"}
Pobranie: ${args.firstDownload ? "pierwsze" : `kolejne (łącznie ${args.downloadCount})`}
Data: ${when}

Panel: ${panelUrl}`,
  };
}
