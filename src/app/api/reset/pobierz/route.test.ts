import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { signDownloadToken } from "@/lib/downloadToken";

/**
 * Test integracyjny endpointu pobrania: sprawdza to, o co realnie chodzi
 * właścicielowi — czy po kliknięciu linku wychodzi mail, i czy pobranie działa
 * także wtedy, gdy mail wyjść nie może.
 *
 * Supabase i Resend są podmienione: pierwszy oddaje wynik `register_protocol_download`,
 * drugi jest zwykłym `fetch`, więc widać dokładny payload lecący do API.
 */
const rpc = vi.fn();
const insert = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: () => ({ rpc, from: () => ({ insert }) }),
}));

const LEAD = "11111111-2222-3333-4444-555555555555";
const ROW = {
  first_download: true,
  download_count: 1,
  should_notify: true,
  first_name: "Jan",
  email: "jan@example.com",
  phone_e164: "+48512543929",
};

let fetchMock: ReturnType<typeof vi.fn>;

function request(token?: string | null) {
  const url = new URL("https://thecontrolsystem.biz/api/reset/pobierz");
  if (token) url.searchParams.set("t", token);
  return new NextRequest(url);
}

async function handler() {
  return (await import("./route")).GET;
}

describe("GET /api/reset/pobierz", () => {
  beforeEach(() => {
    vi.resetModules();
    rpc.mockReset();
    insert.mockClear();
    process.env.RESET_DOWNLOAD_SECRET = "sekret-testowy";
    process.env.RESEND_API_KEY = "re_test";
    process.env.OWNER_EMAIL = "krystian.cwik@thecontrolsystem.biz";
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "msg_1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESET_DOWNLOAD_SECRET;
    delete process.env.RESEND_API_KEY;
    delete process.env.OWNER_EMAIL;
  });

  it("po pobraniu wysyła powiadomienie do właściciela i przekierowuje na PDF", async () => {
    rpc.mockResolvedValue({ data: [ROW], error: null });

    const res = await (await handler())(request(signDownloadToken(LEAD)));

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://thecontrolsystem.biz/protokol-resetu.pdf");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const payload = JSON.parse((init as RequestInit).body as string);
    // Powiadomienie leci na wszystkie skrzynki właściciela naraz — firmowa
    // potrafi milczeć, więc jedna z nich nie może być pojedynczym punktem awarii.
    expect(payload.to).toContain("krystian.cwik@thecontrolsystem.biz");
    expect(payload.to).toContain("krystian.cwik.twojtrener@gmail.com");
    expect(payload.subject).toBe("[TCS][Reset] Pobranie Protokołu: Jan");
    expect(payload.text).toContain("jan@example.com");
    expect(payload.text).toContain("+48512543929");

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_id: LEAD,
        template_key: "protocol_download_owner",
        event_type: "sent",
        provider_message_id: "msg_1",
      }),
    );
  });

  it("kolejne pobranie w cooldownie nie wysyła drugiego maila", async () => {
    rpc.mockResolvedValue({
      data: [{ ...ROW, first_download: false, download_count: 2, should_notify: false }],
      error: null,
    });

    const res = await (await handler())(request(signDownloadToken(LEAD)));

    expect(res.status).toBe(302);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("bez tokenu pobranie działa, ale nie ma czego zgłaszać", async () => {
    const res = await (await handler())(request());

    expect(res.status).toBe(302);
    expect(rpc).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("błąd bazy nie zabiera użytkownikowi Protokołu", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await (await handler())(request(signDownloadToken(LEAD)));

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://thecontrolsystem.biz/protokol-resetu.pdf");
    expect(fetchMock).not.toHaveBeenCalled();
    err.mockRestore();
  });

  it("błąd Resenda też nie zabiera użytkownikowi Protokołu, ale zostaje w email_events", async () => {
    rpc.mockResolvedValue({ data: [ROW], error: null });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "rate limited" }), { status: 429 }),
    );
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await (await handler())(request(signDownloadToken(LEAD)));

    expect(res.status).toBe(302);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ template_key: "protocol_download_owner", event_type: "bounced" }),
    );
    err.mockRestore();
  });
});
