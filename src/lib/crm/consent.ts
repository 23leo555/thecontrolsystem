import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Rejestr dowodowy zgód — sekcja F3 briefu CRM.
 *
 * Kolumny `marketing_consent` i `phone_consent` na leadzie zostają jako szybki
 * stan bieżący dla widoków. Ta warstwa dopisuje DOWÓD: co dokładnie pokazano,
 * kiedy, na której stronie i w której wersji treści.
 *
 * Rekordy są wyłącznie dopisywane. Wycofanie zgody to nowy wiersz ze statusem
 * `withdrawn`, nigdy nadpisanie poprzedniego — inaczej nie da się wykazać, że
 * w chwili wysyłki podstawa istniała.
 */

export type ConsentType = "analytics" | "marketing_email" | "marketing_phone" | "ads" | "session_replay";
export type ConsentStatus = "granted" | "denied" | "withdrawn";

export interface ConsentEntry {
  type: ConsentType;
  status: ConsentStatus;
  /** Wersja treści — pozwala odtworzyć, na co konkretnie osoba się zgodziła. */
  version: string;
  /** Dokładne brzmienie pokazane użytkownikowi; zapisujemy tylko jego skrót. */
  text: string;
}

/**
 * Skrót treści zgody. Trzymamy hash zamiast kopii tekstu przy każdym rekordzie:
 * do wykazania zgodności wystarczy dowieść, że pokazana treść odpowiada tej
 * wersji, a nie duplikować akapit przy każdym leadzie.
 */
export const consentTextHash = (text: string) =>
  crypto.createHash("sha256").update(text.trim()).digest("hex").slice(0, 32);

export async function recordConsents(args: {
  leadId: string;
  entries: ConsentEntry[];
  sourcePage: string;
  formId: string;
  privacyNoticeVersion?: string;
}): Promise<void> {
  if (args.entries.length === 0) return;

  try {
    const { error } = await supabaseAdmin()
      .from("consents")
      .insert(
        args.entries.map((e) => ({
          lead_id: args.leadId,
          consent_type: e.type,
          status: e.status,
          text_version: e.version,
          text_hash: consentTextHash(e.text),
          source_page: args.sourcePage,
          form_id: args.formId,
          privacy_notice_version: args.privacyNoticeVersion ?? null,
        })),
      );

    if (error) console.error("[crm/consent] zapis rejestru zgód nieudany", error.message);
  } catch (err) {
    // Rejestr jest dowodem, ale jego brak nie może zablokować realizacji
    // żądania użytkownika — stan bieżący zgody i tak leży na leadzie.
    console.error("[crm/consent] wyjątek przy zapisie rejestru zgód", err);
  }
}

/**
 * Termin retencji wyliczany z celu i podstawy (L6) — nie „na zawsze".
 *
 * Wartości startowe z briefu, do zatwierdzenia przez prawnika:
 *  - kontakt po Protokole bez zgody marketingowej i bez dalszej aktywności: 90 dni,
 *  - lead ze zgodą marketingową: 24 miesiące od ostatniej istotnej aktywności,
 *  - kandydat po aplikacji: 24 miesiące (proces sprzedażowy i follow-up).
 */
export function retentionUntil(args: {
  hasMarketingConsent: boolean;
  isApplicant?: boolean;
  from?: Date;
}): string {
  const base = args.from ?? new Date();
  const days = args.isApplicant || args.hasMarketingConsent ? 730 : 90;
  const until = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return until.toISOString().slice(0, 10);
}
