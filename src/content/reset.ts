/**
 * Copy landingu /reset — przepisane 1:1 z „Finalnego briefu wdrożeniowego"
 * (Landing page /reset | 7 dniowy Protokół Resetu).
 *
 * Zasada z sekcji 25: copy głównego CTA nie zmieniamy bez akceptacji właściciela.
 * Wszystkie teksty trzymamy tutaj, żeby optymalizacja headline'u i CTA po starcie
 * nie wymagała ruszania komponentów.
 */

export const resetCopy = {
  hero: {
    eyebrow: "THE CONTROL SYSTEM",
    h1: "7 DNIOWY PROTOKÓŁ RESETU",
    subheadline:
      "Odzyskaj pierwszy punkt kontroli nad energią, ciałem i codziennym funkcjonowaniem w ciągu najbliższych 7 dni.",
    support:
      "Praktyczny protokół dla zapracowanych mężczyzn, którzy nie potrzebują kolejnej teorii, tylko prostego systemu do wykonania.",
  },

  notEbook: {
    h2: "TO NIE JEST KOLEJNY EBOOK O ZDROWYCH NAWYKACH",
    body: "To praktyczny 7 dniowy protokół zbudowany dla zapracowanych ludzi, którzy wiedzą już bardzo dużo, ale mają problem z utrzymaniem regularności wtedy, kiedy pojawia się praca, stres i nieprzewidywalny tydzień. Każdy dzień prowadzi Cię przez konkretne działania w określonej kolejności.",
    cards: [
      {
        no: "01",
        title: "CO ROBISZ",
        body: "Konkretny zestaw działań zamiast ogólnej teorii.",
      },
      {
        no: "02",
        title: "KIEDY I DLACZEGO",
        body: "Każde działanie ma określony moment i krótkie wyjaśnienie.",
      },
      {
        no: "03",
        title: "CO ROBISZ, GDY DZIEŃ SIĘ ROZSYPIE",
        body: "Tryb Minimum utrzymuje ciągłość zamiast kolejnego restartu.",
      },
    ],
  },

  sevenDays: {
    h2: "CO ZROBISZ PRZEZ 7 DNI",
    days: [
      { day: 1, result: "Ustaw system i punkt startowy." },
      { day: 2, result: "Odzyskaj poranek." },
      { day: 3, result: "Ustabilizuj energię." },
      { day: 4, result: "Zbuduj prosty system jedzenia." },
      { day: 5, result: "Zbuduj bazę siły." },
      { day: 6, result: "Zamknij dzień i przygotuj jutro." },
      { day: 7, result: "Zmierz efekt i zbuduj Control System 1.0." },
    ],
  },

  forWhom: {
    h2: "TEN PROTOKÓŁ ZOSTAŁ STWORZONY DLA CIEBIE, JEŻELI...",
    items: [
      "Prowadzisz firmę albo działasz zawodowo na wysokim poziomie.",
      "Masz dużo odpowiedzialności i mało miejsca na zajmowanie się sobą.",
      "Chcesz poprawić sylwetkę i energię.",
      "Wiesz, co powinieneś robić, ale brakuje Ci regularności.",
      "Nie chcesz kolejnej teorii, tylko prostego systemu do wykonania.",
    ],
  },

  finalCta: {
    h2: "ZACZNIJ OD PIERWSZYCH 7 DNI",
    body: "Nie musisz zmieniać całego życia naraz. Zacznij od uporządkowania najważniejszych fundamentów.",
  },

  form: {
    cta: "ODBIERAM PROTOKÓŁ RESETU",
    ctaLoading: "WYSYŁAM PROTOKÓŁ",
    firstNameLabel: "Imię",
    firstNamePlaceholder: "Jak masz na imię?",
    firstNameError: "Podaj imię — minimum 2 znaki.",
    emailLabel: "Adres email",
    emailPlaceholder: "twoj@email.pl",
    emailError: "Podaj poprawny adres email — tam wyślemy Protokół.",
    /** Pole obowiązkowe od 2026-08-15 (decyzja właściciela) — patrz komentarz w ResetForm. */
    phoneLabel: "Numer telefonu",
    phonePlaceholder: "600 000 000",
    phoneError: "Podaj poprawny numer telefonu.",
    marketingConsent:
      "Chcę otrzymywać od Krystiana Ćwika / The Control System drogą elektroniczną dodatkowe materiały edukacyjne, wskazówki, informacje o The Control System oraz informacje handlowe na podany adres email. Wiem, że zgodę mogę wycofać w każdej chwili.",
    /**
     * Osobna zgoda na kanał TELEFONICZNY (PKE art. 398 — wymagana uprzednia zgoda).
     * Opcjonalna: brak zaznaczenia nie blokuje wysłania Protokołu, a jedynie
     * zamyka drogę do kontaktu telefonicznego.
     */
    phoneConsent:
      "Zgadzam się na kontakt telefoniczny od Krystiana Ćwika / The Control System na podany numer, w tym połączenia i wiadomości SMS, w sprawie Protokołu Resetu oraz współpracy 1 na 1. Wiem, że zgodę mogę wycofać w każdej chwili.",
    /** Wyjaśnienie przy polu telefonu — po co jest, skoro Protokół idzie mailem. */
    phoneHelp:
      "Numer wykorzystujemy do kontaktu w sprawie Twojego zgłoszenia. Dzwonimy wyłącznie do osób, które zaznaczyły zgodę poniżej.",
    /**
     * Klauzula informacyjna pod formularzem (brief sekcja 8).
     * NIE jest zgodą — nie ma checkboxa „akceptuję politykę prywatności".
     */
    legalNotice:
      "Administratorem Twoich danych jest Krystian Ćwik, prowadzący działalność gospodarczą pod firmą Krystian Ćwik, ul. Telefoniczna 21 lok. 152, 91-728 Łódź, NIP 7312089605, REGON 540285409. Dane podane w formularzu wykorzystamy w celu przesłania zamówionego 7 dniowego Protokołu Resetu oraz obsługi związanego z nim kontaktu. Szczegóły dotyczące przetwarzania danych i Twoich praw znajdziesz w",
    legalNoticeLinkLabel: "Polityce Prywatności",
  },

  thanks: {
    h1: "GOTOWE. PROTOKÓŁ JEST W DRODZE NA TWÓJ E-MAIL.",
    /**
     * Od 2026-08-15 (decyzja właściciela) Protokół wychodzi WYŁĄCZNIE e-mailem —
     * ta strona nie daje już pobrania PDF-a. Dzięki temu adres musi być
     * poprawny, a kontakt zaczyna się od pierwszej wiadomości w skrzynce.
     */
    body: "Wysłałem 7-dniowy Protokół Resetu na podany adres e-mail. Sprawdź skrzynkę za kilka minut i zacznij od Dnia 1 — nie próbuj wdrażać całego tygodnia jednocześnie.",
    inboxHint: "Jeśli wiadomość nie dotarła w ciągu kilku minut, sprawdź folder spam lub „Oferty”.",
    resend: {
      prompt: "Wiadomość nie dotarła?",
      cta: "WYŚLIJ PROTOKÓŁ PONOWNIE",
      ctaLoading: "WYSYŁAM…",
      success: "Wiadomość została wysłana ponownie. Sprawdź skrzynkę za kilka minut.",
      error: "Nie udało się ponownie wysłać wiadomości. Odczekaj chwilę i spróbuj ponownie.",
    },
    /** Bridge do /system — ukryty do czasu publikacji strony usługi (brief sekcja 16). */
    bridge: {
      h2: "Wiesz już, że potrzebujesz czegoś więcej niż uniwersalnego Protokołu?",
      body: "Zobacz, jak wygląda indywidualny The Control System 1:1 i sprawdź, czy ten sposób pracy pasuje do Twojej sytuacji.",
      cta: "POZNAJ THE CONTROL SYSTEM 1:1",
    },
  },

  footer: {
    copyright:
      "© 2026 Krystian Ćwik / The Control System. Wszelkie prawa zastrzeżone. Treści strony oraz 7 dniowego Protokołu Resetu są chronione prawem autorskim. Bez uprzedniej zgody uprawnionego nie wolno ich kopiować, rozpowszechniać, sprzedawać, udostępniać publicznie ani wykorzystywać komercyjnie, poza dozwolonym użytkiem przewidzianym prawem.",
    instagram: "@krystian_cwik",
    instagramUrl: "https://instagram.com/krystian_cwik",
  },
} as const;
