import { describe, it, expect } from "vitest";
import { isValidEmail, normalizeEmail, isValidFirstName, toE164, parseTrafficSource } from "@/lib/validation";

describe("walidacja e-mail", () => {
  it("normalizuje do lowercase i przycina", () => {
    expect(normalizeEmail("  Jan.Kowalski@Example.COM ")).toBe("jan.kowalski@example.com");
  });

  it("akceptuje poprawne adresy", () => {
    expect(isValidEmail("krystian.cwik@thecontrolsystem.biz")).toBe(true);
    expect(isValidEmail("a@b.pl")).toBe(true);
  });

  it("odrzuca niepoprawne adresy", () => {
    expect(isValidEmail("brak-malpy.pl")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("spacja @b.pl")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("walidacja imienia", () => {
  it("wymaga minimum 2 znaków", () => {
    expect(isValidFirstName("J")).toBe(false);
    expect(isValidFirstName("Jan")).toBe(true);
    expect(isValidFirstName("  ")).toBe(false);
  });
});

describe("normalizacja telefonu do E.164", () => {
  it("dodaje domyślny kraj dla numerów lokalnych", () => {
    expect(toE164("601 234 567")).toBe("+48601234567");
    expect(toE164("0601234567")).toBe("+48601234567");
  });

  it("zachowuje istniejący prefiks międzynarodowy", () => {
    expect(toE164("+44 7700 900123")).toBe("+447700900123");
  });

  it("odrzuca śmieci", () => {
    expect(toE164("123")).toBeNull();
    expect(toE164("")).toBeNull();
  });
});

describe("parsowanie źródła ruchu", () => {
  it("wyciąga UTM i ścieżkę", () => {
    const s = parseTrafficSource(
      "https://thecontrolsystem.biz/system?utm_source=ig&utm_medium=bio&utm_campaign=reset",
      "https://instagram.com/",
    );
    expect(s.utm_source).toBe("ig");
    expect(s.utm_medium).toBe("bio");
    expect(s.utm_campaign).toBe("reset");
    expect(s.landing_path).toBe("/system");
    expect(s.referrer).toBe("https://instagram.com/");
  });
});
