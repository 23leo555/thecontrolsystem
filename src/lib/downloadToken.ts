import { createHmac, timingSafeEqual } from "node:crypto";
import { site } from "@/lib/site";

/**
 * Podpisany link do pobrania Protokołu (`/api/reset/pobierz?t=...`).
 *
 * Osobny mechanizm od `resendToken` mimo identycznej kryptografii — bo różni
 * się cyklem życia: cookie resendu żyje 45 minut, a link w e-mailu ktoś kliknie
 * i po miesiącu. Wspólny moduł kusiłby, żeby rozjechać jedno albo drugie.
 *
 * Prefiks `dl` wchodzi do podpisywanego payloadu, więc tokenu dostawy nie da
 * się podstawić jako tokenu pobrania (i odwrotnie), nawet gdy oba korzystają
 * z tego samego sekretu.
 */
const PREFIX = "dl";
const MAX_AGE_SEC = 180 * 24 * 60 * 60;

/** Ścieżka statycznego PDF-a — to na nią przekierowuje endpoint pobrania. */
export const PROTOCOL_PDF_PATH = "/protokol-resetu.pdf";

function secret(): string | null {
  // Własny sekret, jeśli jest; w drugiej kolejności ten sam co resend.
  const explicit = process.env.RESET_DOWNLOAD_SECRET ?? process.env.RESET_RESEND_SECRET;
  if (explicit) return explicit;

  // Ostatnia deska ratunku: klucz wyprowadzony z SUPABASE_SERVICE_ROLE_KEY.
  //
  // Bez tego cała funkcja zależałaby od zmiennej, której nikt nie ustawił —
  // a wtedy link w mailu prowadziłby wprost do PDF-a i powiadomienie NIGDY by
  // nie przyszło, w dodatku po cichu. Service role i tak musi być ustawiony,
  // żeby endpoint miał z czym gadać, więc feature działa od razu po wdrożeniu.
  //
  // To NIE jest ten sam klucz: etykieta domenowa sprawia, że z podpisu nie da
  // się odzyskać ani użyć service role gdzie indziej. Rotacja klucza unieważnia
  // stare linki — przestaną liczyć pobrania (PDF nadal się otworzy), więc przy
  // rotacji warto ustawić RESET_DOWNLOAD_SECRET na stałe.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createHmac("sha256", serviceKey).update("tcs:protocol-download-link:v1").digest("hex");
}

export function signDownloadToken(leadId: string): string | null {
  const key = secret();
  if (!key) return null;
  const payload = `${PREFIX}.${leadId}.${Date.now()}`;
  const sig = createHmac("sha256", key).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyDownloadToken(token: string | undefined | null): string | null {
  const key = secret();
  if (!key || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [prefix, leadId, ts, sig] = parts;
  if (prefix !== PREFIX) return null;

  const payload = `${prefix}.${leadId}.${ts}`;
  const expected = createHmac("sha256", key).update(payload).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_SEC * 1000) return null;

  return leadId;
}

/**
 * Adres pobrania wstawiany do wiadomości z Protokołem.
 *
 * Bez sekretu (albo bez leada) zwracamy link wprost do PDF-a: dostarczenie
 * Protokołu jest ważniejsze niż telemetria pobrania. Odbiorca zawsze dostaje
 * działający link, najwyżej bez powiadomienia dla właściciela.
 */
export function protocolDownloadUrl(leadId?: string | null): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? site.url;
  const token = leadId ? signDownloadToken(leadId) : null;
  return token
    ? `${base}/api/reset/pobierz?t=${encodeURIComponent(token)}`
    : `${base}${PROTOCOL_PDF_PATH}`;
}
