# Landing /reset — wdrożenie briefu V2

Strona `thecontrolsystem.biz/reset` zbudowana wg „Finalnego briefu wdrożeniowego
(Landing page /reset | 7 dniowy Protokół Resetu)". Backend (zapis leada, wysyłka,
zgody, analityka) był już w repo z V1 — V2 dołożyło stronę, copy i rozliczalność zgód.

## Co gdzie leży

| Plik | Rola |
| --- | --- |
| `src/content/reset.ts` | **Całe copy strony i maila.** Zmiany treści robimy tutaj, nie w komponentach. |
| `src/app/reset/page.tsx` | Landing: hero, „to nie ebook", mapa 7 dni, dla kogo, finalne CTA. |
| `src/app/reset/dziekuje/page.tsx` | Strona podziękowania + pobranie PDF. |
| `src/components/reset/ResetForm.tsx` | Formularz (imię, email, opcjonalna zgoda marketingowa). |
| `src/components/reset/ProtocolMockup.tsx` | Mockup — realna okładka PDF + 2 strony za nią. |
| `src/lib/email.ts` → `protocolDeliveryTemplate` | Mail z Protokołem, copy 1:1 z sekcji 17 briefu. |
| `supabase/migrations/0004_consent_version.sql` + `0005_protocol_delivery_status.sql` | `consent_version`, `protocol_sent_at`, `email_status`. |
| `public/brand/*`, `public/protokol-resetu.pdf` | Assety wygenerowane z paczki + finalnego PDF-a. |

## Decyzje, które warto znać

**Paleta.** Brief (sekcja 2) rekomendował akcent złoty `#C6A25B`. Na polecenie
właściciela landing trzyma się palety aplikacji Lovable („Midnight Indigo",
`src/styles.css` w projekcie `thesystemcontrol`) — akcentem jest elektryczny indygo
`#4f76ff`. Wartości `oklch` z aplikacji przeliczono na sRGB i wpisano wprost do
`tailwind.config.ts`. Powrót do złota = zmiana `colors.primary` na `#c6a25b`
(token `gold` jest już zdefiniowany).

**CTA ma ciemny tekst na jasnym akcencie.** Biały tekst na `#4f76ff` daje 3.9:1
i nie przechodzi WCAG AA dla tej wielkości; ciemny daje 5.3:1.

**Brak checkboxa „akceptuję politykę prywatności"** — brief sekcja 8: polityka jest
informacją, nie umową wymagającą zgody. Pod formularzem stoi klauzula informacyjna.
Wymagana jest wyłącznie zgoda marketingowa i tylko wtedy, gdy użytkownik ją zaznaczy.
`/api/reset` nie sprawdza już pola `consent`.

**Banner cookies** ma oba przyciski o tej samej wadze wizualnej (brak dark patternu)
i nie konkuruje z głównym CTA.

**Tło marki** ładuje się przez `<picture media>` — przeglądarka pobiera tylko wersję
mobile **albo** desktop, nigdy obie.

## Zanim to pójdzie na produkcję

1. **Migracje `0004` i `0005`** — zastosowane na projekcie Supabase lejka (`lyadwkkpofphnuzxarog`) 2026-08-09.
   Podbija sygnaturę `upsert_lead` o `p_consent_version`; stara wersja funkcji jest
   usuwana, więc migrację i deploy kodu wypuszczać razem.
2. **`NEXT_PUBLIC_SYSTEM_PAGE_LIVE`** — zostawić niewłączone do czasu publikacji
   `/system`. Bez tego bridge na stronie podziękowania jest ukryty (zgodnie z sekcją 16).
3. ~~**Weryfikacja prawna** Polityki Prywatności, cookies i treści zgód (sekcja 19 briefu).~~
   **Zgodność stron prawnych potwierdzona przez właściciela 2026-08-10.**
   Przy każdej zmianie brzmienia zgody nadal podbijać `site.consentVersion`
   (obecnie `reset-2026-08`) — inaczej w bazie nie da się wykazać, na jakiej
   treści oparto starsze zgody.
4. **SPF / DKIM / DMARC** dla `thecontrolsystem.biz` + realny test dostarczenia do
   Gmail, Outlook i iCloud. Nie ruszać rekordów MX Google Workspace.
5. **Turnstile** — `verifyTurnstile` działa; formularz nie wysyła jeszcze tokenu.
   Po dodaniu kluczy wpiąć widget w `ResetForm` i przekazywać `turnstileToken`.
6. **Testy akceptacyjne T01–T12** z sekcji 26 briefu — na środowisku z realnym
   Resendem i Supabase.

## Zweryfikowane lokalnie

- 320 px: brak poziomego scrolla, formularz na 0.73 ekranu, CTA 56 px, pola 16 px.
- 1280 px: dwie kolumny, CTA 60 px, całe hero z CTA nad linią zagięcia.
- Potrójne kliknięcie CTA → jedno żądanie, `aria-busy`, tekst „WYSYŁAM PROTOKÓŁ".
- Błędy walidacji opisane tekstem i spięte przez `aria-describedby`.
- `/protokol-resetu.pdf` → 200, `application/pdf`.
- `npm run build`, `npm run typecheck`, `npm test` (28) — zielone.
