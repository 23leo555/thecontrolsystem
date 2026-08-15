/**
 * Szablony e-mail lejka /apply — sekcja AC.
 *
 * Copy jest przepisane 1:1 z briefu (AC2–AC6) i NIE wolno go zmieniać bez zgody
 * właściciela. Różnica wobec starych szablonów w `@/lib/emailTemplates`: tam link
 * prowadził do jednorazowego tokenu rezerwacji ważnego 72 h, tu kieruje na
 * podpisaną stronę wyniku (X2, ważna 7 dni), na której dopiero renderuje się
 * Calendly (AA1).
 *
 * Ograniczenia z AC6/AC7, świadomie wymuszone w kodzie:
 *  - do właściciela NIE trafia przedział dochodu ani pełna odpowiedź otwarta (U12),
 *  - do kandydata nie trafia score, próg ani powód decyzji (W3, Z2),
 *  - linki są podpisane i bez PII w query stringu.
 */
import { emailLayout } from "@/lib/email";
import { site } from "@/lib/site";
import { getQuestion, type Answers, type QuestionId } from "./questions";
import type { Status } from "./scoring";

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

const p = (html: string) => `<p style="margin:0 0 16px;color:#808791 !important;line-height:1.7;">${html}</p>`;

const signature = (full: boolean) =>
  `<p style="margin:24px 0 0;color:#f9fafc !important;line-height:1.6;">Krystian${
    full ? ' Ćwik<br><span style="color:#808791 !important;">Twórca The Control System</span>' : ""
  }</p>`;

const cta = (href: string, label: string) =>
  `<p style="margin:0 0 24px;">
     <a href="${href}" style="display:inline-block;background:#4f76ff !important;color:#010205 !important;
        text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">${label}</a>
   </p>`;

/** Etykieta odpowiedzi jednokrotnego wyboru — do powiadomienia wewnętrznego. */
function answerLabel(id: QuestionId, answers: Answers): string {
  const raw = answers[id];
  if (typeof raw !== "string" || !raw) return "—";
  return getQuestion(id).options?.find((o) => o.value === raw)?.label ?? raw;
}

/**
 * AC2 — Qualified. Link prowadzi na podpisaną stronę wyniku, nie wprost do Calendly (AA1).
 *
 * PS z Protokołem dołożone na decyzję właściciela z 2026-08-15, tak samo jak na
 * ekranie wyniku. Świadomie pod podpisem i bez przycisku: jedynym celem tej
 * wiadomości pozostaje rezerwacja terminu.
 */
export function qualifiedTemplate(firstName: string, resultUrl: string) {
  const name = esc(firstName);
  const resetUrl = `${site.url}${site.routes.reset}`;
  return {
    subject: "Twój kolejny krok w The Control System",
    html: emailLayout(`
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Cześć ${name},</h1>
      ${p(
        "na podstawie Twoich odpowiedzi widzę potencjalne dopasowanie do The Control System 1 na 1. " +
          "Wróć na bezpieczną stronę i wybierz termin rozmowy online:",
      )}
      ${cta(resultUrl, "WYBIERAM TERMIN ROZMOWY")}
      ${p(
        "Podczas rozmowy omówimy Twoją sytuację, cel na pierwsze 90 dni i ostateczne dopasowanie. " +
          "Zakwalifikowanie do rozmowy nie oznacza automatycznego przyjęcia do programu ani " +
          "zobowiązania do zakupu.",
      )}
      ${signature(true)}
      <p style="margin:24px 0 0;color:#808791 !important;line-height:1.7;font-size:14px;">
        PS Zanim porozmawiamy, możesz zacząć od bezpłatnego
        <a href="${resetUrl}" style="color:#5b9eff !important;">7-dniowego Protokołu Resetu</a>.
      </p>
    `),
    text: `Cześć ${firstName},

na podstawie Twoich odpowiedzi widzę potencjalne dopasowanie do The Control System 1 na 1.
Wróć na bezpieczną stronę i wybierz termin rozmowy online: ${resultUrl}

Podczas rozmowy omówimy Twoją sytuację, cel na pierwsze 90 dni i ostateczne dopasowanie.
Zakwalifikowanie do rozmowy nie oznacza automatycznego przyjęcia do programu ani zobowiązania do zakupu.

Krystian Ćwik
Twórca The Control System

PS Zanim porozmawiamy, możesz zacząć od bezpłatnego 7-dniowego Protokołu Resetu:
${resetUrl}`,
  };
}

/** AC3 — Manual Review. Bez terminu, bez linku, bez sugestii wyniku. */
export function manualReviewTemplate(firstName: string) {
  const name = esc(firstName);
  return {
    subject: "Otrzymałem Twoją aplikację do The Control System",
    html: emailLayout(`
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Cześć ${name},</h1>
      ${p(
        "Twoja aplikacja została zapisana i trafiła do mojej osobistej weryfikacji. " +
          "Jeśli zobaczę dopasowanie do procesu 1 na 1, otrzymasz wiadomość z kolejnym krokiem. " +
          "Nie musisz ponownie wysyłać formularza.",
      )}
      ${signature(false)}
    `),
    text: `Cześć ${firstName},

Twoja aplikacja została zapisana i trafiła do mojej osobistej weryfikacji.
Jeśli zobaczę dopasowanie do procesu 1 na 1, otrzymasz wiadomość z kolejnym krokiem.
Nie musisz ponownie wysyłać formularza.

Krystian`,
  };
}

/**
 * AC4 — Not Qualified. Bez score, progu i powodu decyzji (Z2).
 *
 * Główna treść jest 1:1 z briefu. PS z Protokołem Resetu to ODSTĘPSTWO od Z1
 * („CTA: brak", zakaz kierowania do tańszego produktu) na decyzję właściciela
 * z 2026-08-15 — bez tego kandydat zamykający kartę zostaje bez żadnego wyjścia.
 * Świadomie jako PS pod podpisem, a nie przycisk: to nie ma być sprzedaż
 * doklejona do odmowy.
 */
export function notQualifiedTemplate(firstName: string) {
  const name = esc(firstName);
  const resetUrl = `${site.url}${site.routes.reset}`;
  return {
    subject: "Dziękuję za aplikację",
    html: emailLayout(`
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Cześć ${name},</h1>
      ${p(
        "dziękuję za konkretne odpowiedzi. Na podstawie obecnej aplikacji nie przechodzisz do etapu " +
          "rozmowy. The Control System 1 na 1 jest procesem dla wąskiej grupy osób; ta decyzja oznacza " +
          "wyłącznie brak wystarczającego dopasowania do tego formatu na ten moment.",
      )}
      ${signature(false)}
      <p style="margin:24px 0 0;color:#808791 !important;line-height:1.7;font-size:14px;">
        PS Jeżeli chcesz zacząć od czegoś konkretnego już teraz, odbierz bezpłatny
        <a href="${resetUrl}" style="color:#5b9eff !important;">7-dniowy Protokół Resetu</a>.
      </p>
    `),
    text: `Cześć ${firstName},

dziękuję za konkretne odpowiedzi. Na podstawie obecnej aplikacji nie przechodzisz do etapu rozmowy.
The Control System 1 na 1 jest procesem dla wąskiej grupy osób; ta decyzja oznacza wyłącznie brak
wystarczającego dopasowania do tego formatu na ten moment.

Krystian

PS Jeżeli chcesz zacząć od czegoś konkretnego już teraz, odbierz bezpłatny 7-dniowy Protokół Resetu:
${resetUrl}`,
  };
}

/** AC5 — ręczna akceptacja po Manual Review (wysyłana z panelu, nie z submitu). */
export function manualApprovedTemplate(firstName: string, resultUrl: string) {
  const name = esc(firstName);
  return {
    subject: "Możemy przejść do rozmowy",
    html: emailLayout(`
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Cześć ${name},</h1>
      ${p("sprawdziłem Twoją aplikację i widzę potencjalne dopasowanie. Wybierz termin rozmowy na bezpiecznej stronie:")}
      ${cta(resultUrl, "WYBIERAM TERMIN ROZMOWY")}
      ${p("Na rozmowie sprawdzimy ostateczne dopasowanie i omówimy Twój cel na pierwsze 90 dni.")}
      ${signature(false)}
    `),
    text: `Cześć ${firstName},

sprawdziłem Twoją aplikację i widzę potencjalne dopasowanie.
Wybierz termin rozmowy na bezpiecznej stronie: ${resultUrl}

Na rozmowie sprawdzimy ostateczne dopasowanie i omówimy Twój cel na pierwsze 90 dni.

Krystian`,
  };
}

/**
 * AC6 — powiadomienie wewnętrzne. Świadomie pomija dochód i treść U12:
 * skrzynka właściciela nie jest miejscem na te dane, są w panelu.
 */
export function ownerNotificationTemplate(args: {
  firstName: string;
  lastName: string;
  status: Status;
  score: number;
  answers: Answers;
  source: Record<string, unknown>;
  applicationId: string;
}) {
  const statusLabel: Record<Status, string> = {
    QUALIFIED: "QUALIFIED",
    MANUAL_REVIEW: "MANUAL REVIEW",
    NOT_QUALIFIED: "NOT QUALIFIED",
  };

  const when = new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
  const src =
    ["utm_source", "utm_medium", "utm_campaign", "referrer", "landing_path"]
      .map((k) => {
        const v = args.source[k];
        return typeof v === "string" && v ? `${k}: ${v}` : null;
      })
      .filter(Boolean)
      .join(" · ") || "brak danych";

  const panelUrl = `${site.url}/admin`;

  const rows: Array<[string, string]> = [
    ["STATUS", statusLabel[args.status]],
    ["SCORE", `${args.score} / 100`],
    ["DATA", when],
    ["ŹRÓDŁO", src],
    ["PILNOŚĆ", answerLabel("urgency", args.answers)],
    ["GOTOWOŚĆ", answerLabel("process", args.answers)],
  ];

  const table = rows
    .map(
      ([k, v]) => `<tr>
        <td style="padding:10px 12px;color:#4f76ff !important;font-size:12px;font-weight:700;
                   letter-spacing:.08em;white-space:nowrap;vertical-align:top;">${k}</td>
        <td style="padding:10px 12px;color:#f9fafc !important;font-size:13px;">${esc(v)}</td>
      </tr>`,
    )
    .join("");

  return {
    subject: `[TCS][${args.status}][${args.score}] ${args.firstName} ${args.lastName}`,
    html: emailLayout(`
      <h1 style="margin:0 0 20px;font-size:22px;">${esc(args.firstName)} ${esc(args.lastName)}</h1>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#0a0e18 !important;
                    border-radius:12px;overflow:hidden;">${table}</table>
      ${cta(panelUrl, "OTWÓRZ PANEL")}
      <p style="margin:0;color:#808791 !important;font-size:12px;">
        Dochód i odpowiedź opisowa są wyłącznie w panelu (AC6).
      </p>
    `),
    text: `${args.firstName} ${args.lastName}

Status: ${statusLabel[args.status]}
Score: ${args.score}/100
Data: ${when}
Źródło: ${src}
Pilność: ${answerLabel("urgency", args.answers)}
Gotowość: ${answerLabel("process", args.answers)}

Panel: ${panelUrl}
Dochód i odpowiedź opisowa są wyłącznie w panelu (AC6).`,
  };
}
