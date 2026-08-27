import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signDownloadToken, verifyDownloadToken, protocolDownloadUrl } from "./downloadToken";
import { signDeliveryToken } from "./resendToken";

const LEAD = "11111111-2222-3333-4444-555555555555";

describe("podpisany link pobrania Protokołu", () => {
  beforeEach(() => {
    process.env.RESET_DOWNLOAD_SECRET = "sekret-testowy";
  });
  afterEach(() => {
    delete process.env.RESET_DOWNLOAD_SECRET;
    delete process.env.RESET_RESEND_SECRET;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("odczytuje id leada z własnego tokenu", () => {
    const token = signDownloadToken(LEAD);
    expect(verifyDownloadToken(token)).toBe(LEAD);
  });

  it("odrzuca token z podmienionym podpisem", () => {
    const token = signDownloadToken(LEAD)!;
    const tampered = token.replace(/.$/, (c) => (c === "a" ? "b" : "a"));
    expect(verifyDownloadToken(tampered)).toBeNull();
  });

  it("nie przyjmuje tokenu dostawy (resend) jako tokenu pobrania", () => {
    process.env.RESET_RESEND_SECRET = "sekret-testowy";
    process.env.RESET_DOWNLOAD_SECRET = "sekret-testowy";
    expect(verifyDownloadToken(signDeliveryToken(LEAD))).toBeNull();
  });

  it("bez sekretu link prowadzi wprost do PDF-a — dostawa jest ważniejsza niż telemetria", () => {
    delete process.env.RESET_DOWNLOAD_SECRET;
    process.env.NEXT_PUBLIC_SITE_URL = "https://thecontrolsystem.biz";
    expect(protocolDownloadUrl(LEAD)).toBe("https://thecontrolsystem.biz/protokol-resetu.pdf");
  });

  it("z sekretem link prowadzi przez endpoint pobrania", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://thecontrolsystem.biz";
    const url = protocolDownloadUrl(LEAD);
    expect(url.startsWith("https://thecontrolsystem.biz/api/reset/pobierz?t=")).toBe(true);
    const token = decodeURIComponent(new URL(url).searchParams.get("t")!);
    expect(verifyDownloadToken(token)).toBe(LEAD);
  });
});
