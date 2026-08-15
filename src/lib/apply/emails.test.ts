import { describe, expect, it } from "vitest";
import {
  qualifiedTemplate,
  manualReviewTemplate,
  notQualifiedTemplate,
  manualApprovedTemplate,
  ownerNotificationTemplate,
} from "./emails";
import type { Answers } from "./questions";

const answers: Answers = {
  age: "30_39",
  role: "owner",
  urgency: "14d",
  process: "logistics_uncertain",
  income: "gte_50k",
  motivation: "Bardzo osobista odpowiedz opisowa, ktora nie ma prawa trafic do skrzynki wlasciciela.",
  name: { first: "Jan", last: "Kowalski" },
  email: "jan@example.com",
};

describe("szablony e-mail lejka /apply", () => {
  it("wiadomość Qualified prowadzi na podpisaną stronę wyniku (AC2)", () => {
    const url = "https://thecontrolsystem.biz/apply/result/token123";
    const tpl = qualifiedTemplate("Jan", url);

    expect(tpl.subject).toBe("Twój kolejny krok w The Control System");
    expect(tpl.html).toContain(url);
    expect(tpl.text).toContain(url);
    // PS z Protokołem — decyzja właściciela, ale rezerwacja zostaje głównym celem,
    // więc link do /reset musi stać ZA linkiem do strony wyniku.
    expect(tpl.text).toContain("/reset");
    expect(tpl.text.indexOf(url)).toBeLessThan(tpl.text.indexOf("/reset"));
  });

  it("wiadomość Manual Review nie zawiera żadnego linku (AC3)", () => {
    const tpl = manualReviewTemplate("Jan");

    expect(tpl.subject).toBe("Otrzymałem Twoją aplikację do The Control System");
    // Poza stopką układu nie może być zaproszenia do żadnego kolejnego kroku.
    expect(tpl.text).not.toContain("http");
  });

  it("wiadomość Not Qualified prowadzi do Protokołu Resetu, ale nie zdradza powodu (Z2)", () => {
    const tpl = notQualifiedTemplate("Jan");

    expect(tpl.subject).toBe("Dziękuję za aplikację");
    // Odstępstwo od Z1 na decyzję właściciela: kandydat ma dostać wyjście.
    expect(tpl.html).toContain("/reset");
    expect(tpl.text).toContain("/reset");
    // Nadal bez score, progu i nazwy reguły odrzucenia.
    expect(tpl.text).not.toMatch(/score|punkt|dochod|dochód|próg/i);
  });

  it("stopka każdej wiadomości do kandydata niesie e-mail, telefon i Instagram", () => {
    const wszystkie = [
      qualifiedTemplate("Jan", "https://example.test/wynik"),
      manualReviewTemplate("Jan"),
      notQualifiedTemplate("Jan"),
      manualApprovedTemplate("Jan", "https://example.test/wynik"),
    ];

    for (const tpl of wszystkie) {
      expect(tpl.html).toContain("tel:+48512543929");
      expect(tpl.html).toContain("512 543 929");
      expect(tpl.html).toContain("Instagram");
      // Wersja tekstowa nie dostaje stopki z układu HTML, więc ma własną —
      // bez tego czytający plain text nie miał telefonu ani Instagrama.
      expect(tpl.text).toContain("512 543 929");
      expect(tpl.text).toContain("krystian.cwik@thecontrolsystem.biz");
      expect(tpl.text).toContain("@krystian_cwik");
    }
  });

  it("powiadomienie wewnętrzne pomija dochód i odpowiedź opisową (AC6)", () => {
    const tpl = ownerNotificationTemplate({
      firstName: "Jan",
      lastName: "Kowalski",
      status: "MANUAL_REVIEW",
      score: 64,
      answers,
      source: { utm_source: "meta" },
      applicationId: "abc",
    });

    expect(tpl.subject).toBe("[TCS][MANUAL_REVIEW][64] Jan Kowalski");
    // Te dwie rzeczy zostają w panelu i nie mają prawa wyjść mailem.
    expect(tpl.html).not.toContain("50 000");
    expect(tpl.html).not.toContain("osobista odpowiedz opisowa");
    expect(tpl.text).not.toContain("osobista odpowiedz opisowa");
    // Pilność i gotowość są tłumaczone na etykiety, nie surowe wartości.
    expect(tpl.text).toContain("W ciągu 14 dni");
    expect(tpl.text).toContain("muszę najpierw potwierdzić logistykę");
  });
});
