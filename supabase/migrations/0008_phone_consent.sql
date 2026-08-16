-- Rozdzielenie zgód na kanały (brief CRM, sekcje F1 i F3).
--
-- Do tej pory istniał jeden `marketing_consent`, obsługujący de facto wyłącznie
-- e-mail. Od 2026-08-15 formularz /reset wymaga numeru telefonu, więc numer bez
-- osobnej zgody na kontakt telefoniczny nie ma prawa trafić do kolejki dzwonienia
-- (Prawo komunikacji elektronicznej art. 398 — uprzednia zgoda).
--
-- `marketing_consent` zachowuje dotychczasowe znaczenie: kanał E-MAIL.
-- Nowe kolumny opisują wyłącznie kanał TELEFON i mają własny timestamp oraz
-- wersję treści, żeby dało się wykazać, na co konkretnie osoba się zgodziła.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_consent_version text,
  -- Nadrzędne wobec zgody: sprzeciw i twarde „nie dzwonić" (F1, I5).
  ADD COLUMN IF NOT EXISTS phone_status text;

DO $$ BEGIN
  ALTER TABLE public.leads
    ADD CONSTRAINT leads_phone_status_check
    CHECK (phone_status IS NULL OR phone_status IN ('unknown','valid','invalid','do_not_call'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.leads.marketing_consent IS
  'Zgoda na marketing E-MAILOWY. Kanał telefoniczny ma osobne pole phone_consent.';
COMMENT ON COLUMN public.leads.phone_consent IS
  'Zgoda na kontakt telefoniczny. Bez niej numer NIE trafia do kolejki dzwonienia.';
COMMENT ON COLUMN public.leads.phone_status IS
  'do_not_call jest nadrzędne wobec phone_consent — sprzeciw wygrywa ze zgodą.';

-- Kolejka telefoniczna: numer + zgoda + brak sprzeciwu. Widok jest jedynym
-- miejscem, z którego wolno budować listę do obdzwonienia — dzięki temu reguła
-- żyje w bazie, a nie w pamięci osoby, która pisze zapytanie.
CREATE OR REPLACE VIEW public.callable_leads AS
SELECT
  l.id, l.created_at, l.first_name, l.email, l.phone_e164,
  l.lifecycle_status, l.source_first, l.utm_source, l.utm_campaign,
  l.phone_consent_at
FROM public.leads l
WHERE l.phone_e164 IS NOT NULL
  AND l.phone_consent IS TRUE
  AND (l.phone_status IS NULL OR l.phone_status <> 'do_not_call');

-- Widok czyta dane osobowe, więc nie wystawiamy go rolom publicznym.
REVOKE ALL ON public.callable_leads FROM public, anon, authenticated;
