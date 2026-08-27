# Wdrożenie na Vercel — instrukcja

Region docelowy: **fra1** (Frankfurt) — najbliżej użytkowników z Polski.

---

## 1. Repozytorium na GitHubie

```bash
git remote add origin https://github.com/<twoj-login>/the-control-system.git
git branch -M main
git push -u origin main
```

Repozytorium powinno być **prywatne** i należeć do właściciela (sekcja 25 briefu).

---

## 2. Import do Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Wybierz repozytorium
3. Framework: **Next.js** (wykryje się sam)
4. **Nie klikaj jeszcze Deploy** — najpierw zmienne środowiskowe

---

## 3. Zmienne środowiskowe

Wklej w **Settings → Environment Variables**. Zaznacz wszystkie trzy środowiska
(Production, Preview, Development), chyba że zaznaczono inaczej.

### Publiczne (widoczne w przeglądarce)

| Zmienna | Wartość |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://thecontrolsystem.biz` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lyadwkkpofphnuzxarog.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_dyU4vMD84LSG6Os_y-xcHQ_eTLcslCu` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | *(z Cloudflare — patrz punkt 6)* |
| `NEXT_PUBLIC_GA4_ID` | *(z Google Analytics)* |
| `NEXT_PUBLIC_META_PIXEL_ID` | *(z Meta Business)* |

> ⚠️ Zmienne `NEXT_PUBLIC_*` są **wstawiane podczas builda**, nie odczytywane w runtime.
> Po ich dodaniu lub zmianie **konieczny jest redeploy**, inaczej nie zadziałają.

### Serwerowe (nigdy nie trafiają do przeglądarki)

| Zmienna | Skąd wziąć |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` |
| `RESEND_API_KEY` | Resend → API Keys |
| `RESEND_FROM` | `Krystian Ćwik \| The Control System <krystian.cwik@thecontrolsystem.biz>` |
| `RESEND_REPLY_TO` | `krystian.cwik@thecontrolsystem.biz` |
| `OWNER_EMAIL` | `krystian.cwik@thecontrolsystem.biz` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile |
| `CALENDLY_SCHEDULING_URL` | `https://calendly.com/krystiancwik-thecontrolsystem/30min` |
| `CALENDLY_ACCESS_TOKEN` | Calendly → Personal Access Token |
| `CALENDLY_ORGANIZATION_URI` | `https://api.calendly.com/organizations/24ec6e4a-9a75-4090-9fbe-b8e2f31eaaca` |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | powstaje przy tworzeniu webhooka (punkt 5) |
| `RESET_RESEND_SECRET` | dowolny losowy ciąg (np. `openssl rand -hex 32`) — podpisuje kontekst ponownej wysyłki |
| `RESET_DOWNLOAD_SECRET` | opcjonalnie; podpisuje linki pobrania Protokołu. Bez niego używany jest `RESET_RESEND_SECRET`, a bez obu link prowadzi wprost do PDF-a i **powiadomienie o pobraniu nie przyjdzie** |
| `MALE_ONLY_GATE` | `false` — **nie zmieniać bez akceptacji prawnej** (sekcja 11/21) |

---

## 4. Domena

**Settings → Domains** → dodaj `thecontrolsystem.biz` oraz `www.thecontrolsystem.biz`.

Vercel poda rekordy do dodania w Squarespace:

- `A` na `@` → `76.76.21.21`
- `CNAME` na `www` → `cname.vercel-dns.com`

> ⚠️ **Nie ruszaj rekordów MX ani TXT.** Poczta Google i wysyłka Resend zależą od nich.
> Dodajesz wyłącznie rekordy A/CNAME dla strony.

Canonical: apex (`thecontrolsystem.biz`), `www` przekierowuje na apex.

---

## 5. Webhook Calendly (po pierwszym deployu)

Webhook wymaga działającego publicznego adresu, więc tworzymy go **po** deployu.
Endpoint: `https://thecontrolsystem.biz/api/webhooks/calendly`

Subskrypcję można utworzyć przez API (`POST /webhook_subscriptions`) z eventami
`invitee.created` i `invitee.canceled`. W odpowiedzi Calendly zwraca **signing key** —
wklej go jako `CALENDLY_WEBHOOK_SIGNING_KEY` i zrób redeploy.

> Bez tego klucza endpoint **odrzuca wszystkie webhooki** (401). To celowe:
> lepiej nie przyjmować żądań, niż przyjmować niezweryfikowane.

---

## 6. Cloudflare Turnstile

[dash.cloudflare.com](https://dash.cloudflare.com) → Turnstile → Add Site →
domena `thecontrolsystem.biz`. Otrzymasz Site Key (publiczny) i Secret Key (serwerowy).

> Dopóki nie ustawisz kluczy, weryfikacja antyspamowa jest **pomijana** —
> kod jawnie to sygnalizuje zamiast udawać ochronę.

---

## 7. Konto administratora

Supabase → **Authentication → Users → Add user**

- e-mail: `krystian.cwik@thecontrolsystem.biz`
- własne hasło
- zaznacz **Auto Confirm User**

Adres jest już na whiteliście w tabeli `admin_users`, więc panel `/admin` zadziała od razu.

---

## 8. Weryfikacja po wdrożeniu

- [ ] `/` przekierowuje (308) na `/system`
- [ ] Landing renderuje się, oba CTA działają
- [ ] `/reset` zapisuje leada i wysyła Protokół
- [ ] `/aplikacja` pokazuje jedno pytanie na ekran
- [ ] Status A → `/rozmowa` pokazuje kalendarz
- [ ] `/rozmowa` bez tokenu **nie pokazuje** kalendarza
- [ ] `/admin` wymaga logowania
- [ ] Banner cookies pojawia się, przed zgodą brak żądań do Google/Meta
- [ ] Rezerwacja w Calendly trafia do tabeli `bookings`
- [ ] Poczta Google działa bez zmian
