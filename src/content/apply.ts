/**
 * Treść lejka aplikacji — finalne copy z sekcji T, U16, X, Y i Z briefu v1.0.
 * Copy zamrożone (A2). Nie zmieniać bez zgody właściciela.
 */

/** Sekcja T2 — ekran startowy. */
export const applyIntro = {
  eyebrow: "APLIKACJA DO THE CONTROL SYSTEM 1 NA 1",
  headline: "Sprawdźmy, czy ten system może zostać dopasowany do Twojej sytuacji.",
  supporting:
    "Aplikacja zajmuje około 4 minut. Odpowiedz konkretnie. Na podstawie odpowiedzi od razu otrzymasz dostęp do kalendarza rozmów albo informację, że zgłoszenie trafiło do osobistej weryfikacji.",
  cta: "ROZPOCZNIJ APLIKACJĘ",
  microcopy:
    "Nie każdy kandydat otrzymuje możliwość rozmowy. Twoje odpowiedzi są traktowane poufnie i nie są przekazywane do narzędzi reklamowych.",
} as const;

/** Sekcja U16 — ekran potwierdzenia przed wysłaniem. */
export const applyReview = {
  headline: "Sprawdź i wyślij aplikację.",
  // Dochód celowo NIE jest pokazywany na ekranie podsumowania (U16) — ekran
  // bywa oglądany w miejscu publicznym albo współdzielonym.
  consentLabel:
    "Potwierdzam, że zapoznałem się z Polityką prywatności i informacją o sposobie oceny aplikacji.",
  editLabel: "Zmień odpowiedzi",
  cta: "WYŚLIJ APLIKACJĘ",
  ctaBusy: "WYSYŁAM APLIKACJĘ…",
} as const;

/** Sekcja X1 — Qualified. */
export const resultQualified = {
  eyebrow: "APLIKACJA PRZYJĘTA · POTENCJALNE DOPASOWANIE",
  headline: "Twoje odpowiedzi wskazują, że The Control System może być właściwym kolejnym krokiem.",
  supporting:
    "Wybierz termin rozmowy online 1 na 1 z Krystianem Ćwikiem. Podczas rozmowy omówicie Twoją sytuację, cel na pierwsze 90 dni i ostateczne dopasowanie do procesu.",
  calendarHeadline: "Wybierz dogodny termin rozmowy.",
  microcopy:
    "Zakwalifikowanie do rozmowy nie oznacza automatycznego przyjęcia do programu ani zobowiązania do zakupu.",
} as const;

/** Sekcja X3 — po rezerwacji terminu. Świadomie bez kolejnej sprzedaży. */
export const resultBooked = {
  headline: "Termin został zarezerwowany.",
  supporting:
    "Szczegóły spotkania otrzymasz e-mailem. Przygotuj informację o swoim głównym celu na pierwsze 90 dni i największej przeszkodzie, która dotąd rozbijała regularność.",
} as const;

/**
 * Droga do Protokołu Resetu na ekranie wyniku — przy każdym statusie.
 *
 * ODSTĘPSTWO OD BRIEFU, decyzja właściciela z 2026-08-15: sekcje Z1 i Z2 mówią
 * „CTA: brak" i zakazują kierowania do tańszego produktu. Właściciel przesądził,
 * że po ukończeniu ankiety ma być droga do Protokołu Resetu — bez tego ekran
 * odmowy jest ślepą uliczką, a /reset nie ma na całej stronie żadnego wejścia.
 *
 * Przy statusie Qualified sekcja stoi POD kalendarzem i ma własny nagłówek:
 * rezerwacja terminu zostaje pierwszym krokiem, a Protokół jest tym, co można
 * zrobić w międzyczasie — nie alternatywą dla rozmowy (G1, AA1).
 */
export const resultProtocolOffer = {
  headline: "Zacznij od 7-dniowego Protokołu Resetu.",
  /** Wariant dla osób, które mają już przed sobą rozmowę. */
  headlineQualified: "Zanim porozmawiamy, możesz zacząć działać.",
  supporting:
    "To bezpłatna instrukcja na najbliższy tydzień: co robisz, kiedy to robisz i jaka jest wersja minimum, gdy dzień nie idzie zgodnie z planem.",
  cta: "ODBIERAM 7-DNIOWY PROTOKÓŁ RESETU",
} as const;

/** Sekcja Y1 — Manual Review. Bez CTA i bez kalendarza. */
export const resultManualReview = {
  eyebrow: "APLIKACJA OTRZYMANA",
  headline: "Twoja aplikacja trafiła do osobistej weryfikacji.",
  supporting:
    "Krystian sprawdzi Twoje odpowiedzi osobiście. Jeśli zobaczy dopasowanie do The Control System 1 na 1, otrzymasz wiadomość z kolejnym krokiem.",
  microcopy: "Na tym etapie nie pokazujemy kalendarza. Nie musisz ponownie wysyłać aplikacji.",
} as const;

/**
 * Sekcja Z1 — Not Qualified.
 * Bez CTA. Nie kierować do newslettera, tańszego produktu, sociali ani Calendly.
 * Nie pokazywać score, progu, dochodu ani konkretnego powodu (Z2).
 */
export const resultNotQualified = {
  eyebrow: "DZIĘKUJĘ ZA KONKRETNĄ APLIKACJĘ",
  headline: "Na ten moment nie przechodzisz do etapu rozmowy.",
  supporting:
    "The Control System 1 na 1 jest procesem dla wąskiej grupy osób i nie każda sytuacja pasuje do tego formatu. Ta decyzja nie jest oceną Twojego potencjału — oznacza wyłącznie brak wystarczającego dopasowania na podstawie obecnych odpowiedzi.",
  microcopy: "Twoja aplikacja została zapisana zgodnie z Polityką prywatności.",
} as const;
