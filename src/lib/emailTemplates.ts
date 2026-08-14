/**
 * Szablony e-mail dla statusów A, B, C (sekcje 12, 16, 17).
 * Copy komunikatów zgodne z briefem — nie zmieniać bez zgody właściciela.
 */
import { emailLayout } from "@/lib/email";
import { site } from "@/lib/site";
import type { Answers } from "@/lib/questions";
import { questions } from "@/lib/questions";

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

const cta = (href: string, label: string) =>
  `<p style="margin:0 0 28px;">
     <a href="${href}" style="display:inline-block;background:#4f76ff;color:#010205;text-decoration:none;
        font-weight:700;padding:14px 22px;border-radius:12px;">${label}</a>
   </p>`;

/** Status A — użytkownik może wybrać termin. */
export function qualifiedNotBookedTemplate(firstName: string, callUrl: string) {
  const name = esc(firstName);
  return {
    subject: "Możesz przejść do kolejnego etapu",
    html: emailLayout(`
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">${name}, możesz wybrać termin rozmowy</h1>
      <p style="margin:0 0 24px;color:#808791;line-height:1.6;">
        Na podstawie Twoich odpowiedzi wygląda na to, że The Control System może odpowiadać Twojej
        obecnej sytuacji. Wybierz dogodny termin rozmowy.
      </p>
      ${cta(callUrl, "WYBIERAM TERMIN")}
      <p style="margin:0;color:#808791;line-height:1.6;font-size:14px;">
        Link jest ważny przez 72 godziny.
      </p>
      <p style="margin:16px 0 0;color:#808791;">Krystian</p>
    `),
    text: `${firstName}, możesz wybrać termin rozmowy.

Na podstawie Twoich odpowiedzi wygląda na to, że The Control System może odpowiadać Twojej obecnej sytuacji.

Wybierz termin: ${callUrl}
(Link ważny przez 72 godziny.)

Krystian
${site.ownerEmail}`,
  };
}

/** Status B — informacja o indywidualnej analizie. */
export function manualReviewUserTemplate(firstName: string) {
  const name = esc(firstName);
  return {
    subject: "Twoja aplikacja jest w analizie",
    html: emailLayout(`
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">${name}, Twoja aplikacja jest w analizie</h1>
      <p style="margin:0 0 16px;color:#808791;line-height:1.6;">
        Twoja sytuacja wymaga indywidualnego przeanalizowania. Zapoznam się z Twoimi odpowiedziami osobiście.
      </p>
      <p style="margin:0;color:#808791;line-height:1.6;">
        Jeżeli zobaczę możliwość realnej współpracy, skontaktuję się z Tobą za pomocą podanego numeru
        telefonu albo adresu e-mail.
      </p>
      <p style="margin:16px 0 0;color:#808791;">Krystian</p>
    `),
    text: `${firstName}, Twoja aplikacja jest w analizie.

Twoja sytuacja wymaga indywidualnego przeanalizowania. Zapoznam się z Twoimi odpowiedziami osobiście.
Jeżeli zobaczę możliwość realnej współpracy, skontaktuję się z Tobą.

Krystian
${site.ownerEmail}`,
  };
}

/** Status C — spokojny komunikat końcowy, BEZ podawania powodu ani punktów. */
export function notQualifiedTemplate(firstName: string) {
  const name = esc(firstName);
  const resetUrl = `${site.url}${site.routes.reset}`;
  return {
    subject: "Twój kolejny krok",
    html: emailLayout(`
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">${name}, Twój kolejny krok</h1>
      <p style="margin:0 0 24px;color:#808791;line-height:1.6;">
        Na podstawie obecnych odpowiedzi prywatna współpraca nie wydaje się na ten moment właściwym
        kolejnym krokiem. Zacznij od 7-dniowego Protokołu Resetu i wdrożenia podstawowego systemu
        przez najbliższy tydzień.
      </p>
      ${cta(resetUrl, "ODBIERAM PROTOKÓŁ RESETU")}
      <p style="margin:0;color:#808791;">Krystian</p>
    `),
    text: `${firstName}, Twój kolejny krok.

Na podstawie obecnych odpowiedzi prywatna współpraca nie wydaje się na ten moment właściwym kolejnym krokiem.
Zacznij od 7-dniowego Protokołu Resetu: ${resetUrl}

Krystian
${site.ownerEmail}`,
  };
}

/**
 * Status B → powiadomienie do Krystiana.
 * Zawiera WSZYSTKIE odpowiedzi, score, hard rule, cap reason, kontakt, UTM i link do panelu.
 */
export function manualReviewOwnerTemplate(args: {
  firstName: string;
  email: string;
  phone: string | null;
  score: number;
  capReason: string | null;
  hardRuleReason: string | null;
  answers: Answers;
  utm: Record<string, string | null>;
  applicationId: string;
}) {
  const rows = questions
    .map((q) => {
      const raw = args.answers[q.id];
      let display: string;
      if (raw === undefined || raw === null || raw === "") display = "—";
      else if (Array.isArray(raw)) {
        display = raw
          .map((id) => q.options?.find((o) => o.id === id)?.label ?? id)
          .join(", ");
      } else if (typeof raw === "number") display = String(raw);
      else display = q.options?.find((o) => o.id === raw)?.label ?? String(raw);

      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid rgba(45,51,64,.55);color:#808791;
                   font-size:13px;vertical-align:top;width:45%;">${esc(q.prompt)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid rgba(45,51,64,.55);color:#fff;
                   font-size:13px;vertical-align:top;">${esc(display)}</td>
      </tr>`;
    })
    .join("");

  const utmRows = Object.entries(args.utm)
    .filter(([, v]) => v)
    .map(([k, v]) => `${esc(k)}: ${esc(String(v))}`)
    .join("<br>") || "brak";

  const adminUrl = `${site.url}/admin/aplikacje/${args.applicationId}`;

  return {
    subject: "Nowe zgłoszenie do indywidualnej analizy",
    html: emailLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;">Status B — do analizy</h1>
      <p style="margin:0 0 20px;color:#808791;font-size:14px;">
        <strong style="color:#fff;">${esc(args.firstName)}</strong><br>
        ${esc(args.email)}${args.phone ? `<br>${esc(args.phone)}` : ""}
      </p>

      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;
                    background:#0a0e18;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:12px;color:#4f76ff;font-size:13px;font-weight:700;">SCORE</td>
          <td style="padding:12px;color:#fff;font-size:13px;">${args.score} / 100</td>
        </tr>
        <tr>
          <td style="padding:12px;color:#4f76ff;font-size:13px;font-weight:700;">CAP</td>
          <td style="padding:12px;color:#fff;font-size:13px;">${esc(args.capReason ?? "—")}</td>
        </tr>
        <tr>
          <td style="padding:12px;color:#4f76ff;font-size:13px;font-weight:700;">HARD RULE</td>
          <td style="padding:12px;color:#fff;font-size:13px;">${esc(args.hardRuleReason ?? "—")}</td>
        </tr>
      </table>

      <p style="margin:0 0 8px;letter-spacing:.14em;font-size:11px;color:#4f76ff;font-weight:700;">ODPOWIEDZI</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">${rows}</table>

      <p style="margin:0 0 8px;letter-spacing:.14em;font-size:11px;color:#4f76ff;font-weight:700;">ŹRÓDŁO</p>
      <p style="margin:0 0 24px;color:#808791;font-size:13px;">${utmRows}</p>

      ${cta(adminUrl, "OTWÓRZ W PANELU")}
    `),
    text: `Status B — do analizy

${args.firstName}
${args.email}${args.phone ? `\n${args.phone}` : ""}

Score: ${args.score}/100
Cap: ${args.capReason ?? "—"}
Hard rule: ${args.hardRuleReason ?? "—"}

Panel: ${adminUrl}`,
  };
}
