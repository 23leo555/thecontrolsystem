import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Warstwa `track()` decyduje, co i kiedy trafia do Google i Meta — czyli
 * dokładnie ten fragment, w którym pomyłka kosztuje albo pieniądze w kampanii,
 * albo zgodność z RODO. Dlatego testujemy ją od strony efektu: co konkretnie
 * zobaczyły `gtag` i `fbq`.
 */
const gtag = vi.fn();
const fbq = vi.fn();

function setConsent(analytics: boolean, marketing: boolean) {
  (globalThis as { window?: unknown }).window = {
    __tcsConsent: { analytics, marketing },
    dataLayer: [],
    gtag,
    fbq,
  };
}

async function analytics() {
  return import("./analytics");
}

describe("track()", () => {
  beforeEach(() => {
    vi.resetModules();
    gtag.mockClear();
    fbq.mockClear();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("konwersja leci do Meta jako zdarzenie standardowe I własne", async () => {
    setConsent(true, true);
    const { track } = await analytics();

    track("reset_form_submit", { form_id: "reset_protocol_form" });

    expect(fbq).toHaveBeenCalledWith("track", "Lead", { form_id: "reset_protocol_form" });
    expect(fbq).toHaveBeenCalledWith("trackCustom", "reset_form_submit", {
      form_id: "reset_protocol_form",
    });
  });

  it("zdarzenie bez odpowiednika w słowniku Meta leci tylko jako własne", async () => {
    setConsent(true, true);
    const { track } = await analytics();

    track("vsl_play");

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith("trackCustom", "vsl_play", {});
  });

  it("aplikacja i rezerwacja mają własne zdarzenia standardowe", async () => {
    setConsent(true, true);
    const { track } = await analytics();

    track("application_submit");
    track("booking_complete");

    expect(fbq).toHaveBeenCalledWith("track", "CompleteRegistration", {});
    expect(fbq).toHaveBeenCalledWith("track", "Schedule", {});
  });

  it("bez zgody marketingowej do Meta nie leci NIC, choć statystyka działa", async () => {
    setConsent(true, false);
    const { track } = await analytics();

    track("reset_form_submit");

    expect(gtag).toHaveBeenCalled();
    expect(fbq).not.toHaveBeenCalled();
  });

  it("bez zgody na statystykę nie leci nic — zdarzenie czeka w kolejce", async () => {
    setConsent(false, false);
    const { track, flushQueue } = await analytics();

    track("reset_form_submit");
    expect(gtag).not.toHaveBeenCalled();
    expect(fbq).not.toHaveBeenCalled();

    // Po udzieleniu zgody zaległe zdarzenie idzie dalej — także do Meta.
    setConsent(true, true);
    flushQueue();

    expect(fbq).toHaveBeenCalledWith("track", "Lead", {});
  });

  it("dane wrażliwe nie opuszczają serwisu nawet przy pełnej zgodzie", async () => {
    setConsent(true, true);
    const { track } = await analytics();

    track("application_submit", { income: "gte_50k", score: 83, step: 12 });

    expect(fbq).toHaveBeenCalledWith("track", "CompleteRegistration", { step: 12 });
    expect(fbq).toHaveBeenCalledWith("trackCustom", "application_submit", { step: 12 });
  });
});
