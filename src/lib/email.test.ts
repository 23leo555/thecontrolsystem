import { describe, expect, it } from "vitest";
import { protocolDownloadOwnerTemplate } from "./email";

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
