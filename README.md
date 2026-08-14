# The Control System — publiczny lejek

Publiczny lejek pozyskiwania i kwalifikacji klientów dla **The Control System by Krystian Ćwik**.
Wdrożenie wg dokumentu *Developer Specification V1.0*.

> ⚠️ **Separacja baz (MUST, sekcja 2):** to jest osobny projekt i osobna baza Supabase.
> Nie łączyć z aplikacją płatnych klientów (`thesystemcontrol`).

## Stack

- **Next.js (App Router) + TypeScript** — frontend + server-side logic
- **Tailwind CSS** — design system (sekcja 19)
- **Supabase** — baza, Auth (panel admin), Edge/route handlers (scoring, webhooki)
- **Resend** — automatyczne e-maile (from/reply-to = Krystian)
- **Calendly** — rezerwacje (widoczne dopiero po Statusie A / ręcznym zatwierdzeniu B)
- **GA4 + Meta Pixel** — analityka za zgodą
- **Cloudflare Turnstile** — ochrona formularzy

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env.local   # uzupełnij sekrety
npm run dev                  # http://localhost:3000  → 308 → /system
```

Skrypty: `npm run build`, `npm run typecheck`, `npm run test` (Vitest — testy scoringu T01–T20).

## Struktura

```
src/
  app/
    layout.tsx                 # fonty, SEO, metadata
    system/page.tsx            # LANDING (13 sekcji, sekcja 6) ✅
    reset/…                    # lead magnet (w budowie)
    aplikacja/page.tsx         # kwalifikacja (w budowie)
    rozmowa/page.tsx           # Calendly za tokenem (w budowie)
    {polityka-prywatnosci,cookies,regulamin}/  # zaślepki prawne
    sitemap.ts, robots.ts
  components/
    landing/                   # Hero, sekcje, FAQ, VSL, Footer, Header
    ui/                        # Button, Section, Logo, Placeholder
  content/landing.ts           # CAŁE copy landingu (edytowalne bez ruszania kodu)
  lib/
    site.ts                    # linki, brand, CTA copy
    questions.ts               # Q1–Q12 (sekcja 10) ✅
    scoring.ts                 # scoring + hard rules + status A/B/C (sekcje 11–12) ✅
    scoring.test.ts            # testy akceptacyjne T01–T11, T20 ✅
    analytics.ts               # eventy (sekcja 18), gated consentem
```

## Status wdrożenia

| Etap | Status |
|---|---|
| Design system + scaffold | ✅ gotowe |
| Landing `/system` (13 sekcji) | ✅ gotowe (placeholdery na assety) |
| Silnik scoringu + pytania Q1–Q12 | ✅ gotowe + testy T01–T11, T20 |
| `/reset` + `/reset/dziekuje` | ✅ gotowe, testowane e2e |
| `/aplikacja` (jedno pytanie/ekran) | ✅ gotowe, testowane e2e |
| Supabase (schema, RLS, funkcje) | ✅ gotowe, 0 ostrzeżeń security |
| `/rozmowa` — bramka tokenowa | ✅ gotowe (T13) |
| Calendly — webhooki + podpis | ✅ gotowe (T15, T16), czeka na konto |
| Panel admin | ✅ gotowe |
| Analityka + consent + strony prawne | ✅ gotowe |
| Deploy Vercel + DNS + domena e-mail | ⏳ do zrobienia |

### Blokery zewnętrzne

1. **Resend** — domena `thecontrolsystem.biz` niezweryfikowana (w koncie jest tylko
   `thecontrolsystem.us`, status `not_started`). Do czasu weryfikacji żaden e-mail nie wyjdzie;
   lead/aplikacja i tak zapisują się poprawnie.
2. **Konto admina** — założyć ręcznie w Supabase (Authentication → Users → Add user)
   dla `krystian.cwik@thecontrolsystem.biz`. Adres jest już na whiteliście `admin_users`.
3. **Calendly** — potrzebny scheduling URL (`CALENDLY_SCHEDULING_URL`), Personal Access Token
   i signing key. Webhooki wymagają planu Standard lub wyżej — potwierdzić przed zakupem.
4. **Turnstile** — bez kluczy weryfikacja antyspamowa jest pomijana (kod jawnie to sygnalizuje).

## Zasady, których nie zmieniamy bez zgody właściciela (sekcja 0/26)

Routing publiczny · jedno pytanie na ekran · pytania i odpowiedzi Q1–Q12 · hard rules, capy, progi
score · Status A/B/C · brak publicznego linku do Calendly · e-mail `krystian.cwik@thecontrolsystem.biz`
· separacja baz · branding *THE CONTROL SYSTEM by Krystian Ćwik*.
