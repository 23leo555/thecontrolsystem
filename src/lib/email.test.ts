import { afterEach, describe, expect, it } from "vitest";
import { ownerRecipients, protocolDeliveryTemplate, protocolDownloadOwnerTemplate } from "./email";
import { site } from "./site";
import { protocolDownloadUrl } from "./downloadToken";

describe("powiadomienie właściciela o pobraniu Protokołu", () => {
  it("pierwsze pobranie ma własny temat i pełne dane kontaktowe", () => {
    const tpl = protocolDownloadOwnerTemplate({
      firstName: "Jan",
      email: "jan@example.com",
      phone: "+48512543929",
      downloadCount: 1,
      firstDownload: true,
    });

    expect(tpl.subject).toBe("[TCS][Reset] Pobranie Protokołu: Jan");
    expect(tpl.text).toContain("jan@example.com");
    expect(tpl.text).toContain("+48512543929");
    expect(tpl.text).toContain("pierwsze");
  });

  it("ponowne pobranie da się odfiltrować po temacie i niesie licznik", () => {
    const tpl = protocolDownloadOwnerTemplate({
      firstName: "Jan",
      email: "jan@example.com",
      phone: null,
      downloadCount: 4,
      firstDownload: false,
    });

    expect(tpl.subject).toBe("[TCS][Reset] Ponowne pobranie Protokołu: Jan");
    expect(tpl.text).toContain("łącznie 4");
    expect(tpl.text).toContain("Telefon: brak");
  });

  it("escapuje dane leada w HTML", () => {
    const tpl = protocolDownloadOwnerTemplate({
      firstName: "<script>",
      email: "jan@example.com",
      phone: null,
      downloadCount: 1,
      firstDownload: true,
    });

    expect(tpl.html).not.toContain("<script>");
    expect(tpl.html).toContain("&lt;script&gt;");
  });
});

describe("wiadomość z Protokołem", () => {
  it("prowadzi przez śledzony endpoint, a nie wprost do PDF-a", () => {
    process.env.RESET_DOWNLOAD_SECRET = "sekret-testowy";
    process.env.NEXT_PUBLIC_SITE_URL = "https://thecontrolsystem.biz";
    try {
      const url = protocolDownloadUrl("11111111-2222-3333-4444-555555555555");
      const tpl = protocolDeliveryTemplate("Jan", url);

      expect(tpl.html).toContain(`href="${url}"`);
      expect(tpl.text).toContain("/api/reset/pobierz?t=");
    } finally {
      delete process.env.RESET_DOWNLOAD_SECRET;
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });
});

describe("odbiorcy powiadomień właściciela", () => {
  const before = process.env.OWNER_EMAIL;
  afterEach(() => {
    if (before === undefined) delete process.env.OWNER_EMAIL;
    else process.env.OWNER_EMAIL = before;
  });

  it("dokłada adres zapasowy nawet wtedy, gdy OWNER_EMAIL wskazuje milczącą skrzynkę", () => {
    process.env.OWNER_EMAIL = "krystian.cwik@thecontrolsystem.biz";
    const to = ownerRecipients();

    expect(to).toContain("krystian.cwik@thecontrolsystem.biz");
    expect(to).toContain("krystian.cwik.twojtrener@gmail.com");
  });

  it("przyjmuje listę adresów po przecinku i tylko dokłada je do stałych", () => {
    process.env.OWNER_EMAIL = "a@example.com, b@example.com";
    expect(ownerRecipients()).toEqual([
      site.ownerEmail,
      "krystian.cwik.twojtrener@gmail.com",
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("bez OWNER_EMAIL i tak wysyła na obie skrzynki właściciela", () => {
    delete process.env.OWNER_EMAIL;
    expect(ownerRecipients()).toEqual([site.ownerEmail, "krystian.cwik.twojtrener@gmail.com"]);
  });

  it("OWNER_EMAIL nie potrafi usunąć adresu firmowego z listy", () => {
    process.env.OWNER_EMAIL = "ktos.inny@example.com";
    expect(ownerRecipients()).toContain(site.ownerEmail);
  });

  it("nie duplikuje adresu, gdy ten sam jest już w OWNER_EMAIL", () => {
    process.env.OWNER_EMAIL = "krystian.cwik.twojtrener@gmail.com";
    expect(ownerRecipients()).toEqual([site.ownerEmail, "krystian.cwik.twojtrener@gmail.com"]);
  });
});
