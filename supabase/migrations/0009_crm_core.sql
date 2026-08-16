-- CRM core — sekcje F, G i N briefu CRM (2026-08-15).
--
-- DECYZJA WŁAŚCICIELA (2026-08-16): brief rekomenduje HubSpot jako system of
-- record i odradza budowanie własnego panelu. Właściciel zdecydował inaczej —
-- systemem of record zostaje ta baza, a panel /admin dostaje widoki operacyjne
-- z sekcji K1. Reszta briefu (model danych, rozdzielenie zgód, lifecycle,
-- pipeline, dedup) obowiązuje bez zmian.
--
-- Tabela `leads` pełni rolę obiektu Contact. Nie zmieniamy jej nazwy: żyje w
-- kodzie od pierwszej wersji i przemianowanie kosztowałoby więcej niż daje.

-- ---------- Contact: pola operacyjne (F1) ----------

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS last_name text,
  -- Właściciel leada. Tekst, nie FK do admin_users: handlowcem bywa osoba bez
  -- konta w panelu, a brak konta nie może blokować przypisania.
  ADD COLUMN IF NOT EXISTS owner text,
  ADD COLUMN IF NOT EXISTS lead_status text,
  ADD COLUMN IF NOT EXISTS funnel_origin text,
  -- Atrybucja (F2). first_* jest niemutowalne — pilnuje tego trigger poniżej.
  ADD COLUMN IF NOT EXISTS first_touch_at timestamptz,
  ADD COLUMN IF NOT EXISTS latest_touch_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_landing_page text,
  ADD COLUMN IF NOT EXISTS latest_landing_page text,
  ADD COLUMN IF NOT EXISTS conversion_utm_source text,
  ADD COLUMN IF NOT EXISTS conversion_utm_campaign text,
  ADD COLUMN IF NOT EXISTS conversion_at timestamptz,
  -- Praca handlowa (G2, O).
  ADD COLUMN IF NOT EXISTS last_sales_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_type text,
  ADD COLUMN IF NOT EXISTS lead_score_fit smallint,
  ADD COLUMN IF NOT EXISTS lead_score_intent smallint,
  ADD COLUMN IF NOT EXISTS disqualification_reason text,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  -- Nadrzędne wobec wszystkich automatyzacji (F1, I5).
  ADD COLUMN IF NOT EXISTS do_not_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_retention_until date;

DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT leads_lead_status_check CHECK (
    lead_status IS NULL OR lead_status IN (
      'new','awaiting_review','contact_allowed','contact_attempted','connected',
      'follow_up_required','nurture','unqualified','bad_data','spam',
      'do_not_contact','closed'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT leads_next_action_type_check CHECK (
    next_action_type IS NULL OR next_action_type IN ('call','email','review','meeting','follow_up'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT leads_funnel_origin_check CHECK (
    funnel_origin IS NULL OR funnel_origin IN (
      'protocol_download','qualification_call','manual','referral','other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill: dotychczasowe leady dostają lejek z pierwotnego źródła i first touch
-- z daty utworzenia. Bez tego widoki operacyjne startowałyby z pustymi polami.
UPDATE public.leads SET
  funnel_origin = COALESCE(funnel_origin, CASE
    WHEN source_first = 'application' THEN 'qualification_call'
    WHEN source_first IS NULL THEN 'other'
    ELSE 'protocol_download' END),
  first_touch_at  = COALESCE(first_touch_at, created_at),
  latest_touch_at = COALESCE(latest_touch_at, updated_at, created_at),
  first_landing_page  = COALESCE(first_landing_page, landing_path),
  latest_landing_page = COALESCE(latest_landing_page, landing_path),
  lead_status = COALESCE(lead_status, 'new');

-- first_touch_at jest niemutowalne (N1 pkt 3) — pilnuje tego baza, nie kod
-- aplikacji, bo zapisów do leads jest kilka i każdy mógłby to nadpisać.
CREATE OR REPLACE FUNCTION public.leads_protect_first_touch() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.first_touch_at IS NOT NULL THEN NEW.first_touch_at := OLD.first_touch_at; END IF;
  IF OLD.first_landing_page IS NOT NULL THEN NEW.first_landing_page := OLD.first_landing_page; END IF;
  -- Puste nowe wartości nie nadpisują istniejących poprawnych (N1 pkt 4).
  IF NEW.phone_e164 IS NULL THEN NEW.phone_e164 := OLD.phone_e164; END IF;
  IF NEW.first_name IS NULL OR NEW.first_name = '' THEN NEW.first_name := OLD.first_name; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS leads_protect_first_touch_trg ON public.leads;
CREATE TRIGGER leads_protect_first_touch_trg
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_protect_first_touch();

-- ---------- Consent ledger (F3) ----------
--
-- Kolumny `marketing_consent` i `phone_consent` zostają jako szybki stan bieżący
-- dla widoków. Ta tabela jest dowodem: pełna historia z treścią, wersją i
-- momentem wycofania. Rekordy są TYLKO dopisywane — wycofanie to nowy wiersz.
CREATE TABLE IF NOT EXISTS public.consents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  lead_id       uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  consent_type  text NOT NULL CHECK (consent_type IN
                  ('analytics','marketing_email','marketing_phone','ads','session_replay')),
  status        text NOT NULL CHECK (status IN ('granted','denied','withdrawn')),
  text_version  text,
  -- Skrót dokładnej treści pokazanej użytkownikowi — pozwala udowodnić, na co
  -- konkretnie się zgodził, bez trzymania kopii tekstu przy każdym rekordzie.
  text_hash     text,
  source_page   text,
  form_id       text,
  privacy_notice_version text,
  withdrawn_at  timestamptz
);

CREATE INDEX IF NOT EXISTS consents_lead_idx ON public.consents (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS consents_type_idx ON public.consents (consent_type, status);

-- ---------- Deal (F5) ----------
--
-- Powstaje dopiero przy realnej szansie sprzedażowej (G3, kryterium 33) —
-- nigdy dla pobrania Protokołu ani anonimowego wejścia.
CREATE TABLE IF NOT EXISTS public.deals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  lead_id        uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  stage          text NOT NULL DEFAULT 'qualified' CHECK (stage IN (
                   'qualified','booking_enabled','meeting_booked','meeting_completed',
                   'offer_presented','decision_follow_up','closed_won','closed_lost')),
  owner          text,
  funnel_origin  text,
  amount         numeric(10,2),
  currency       text NOT NULL DEFAULT 'PLN',
  expected_close_date date,
  offer_sent_at  timestamptz,
  closed_at      timestamptz,
  -- Zamknięcie przegraną wymaga powodu (kryterium 35) — wymusza to constraint.
  lost_reason    text,
  notes          text,
  CONSTRAINT deals_lost_reason_required CHECK (stage <> 'closed_lost' OR lost_reason IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS deals_lead_idx ON public.deals (lead_id);
CREATE INDEX IF NOT EXISTS deals_stage_idx ON public.deals (stage, updated_at DESC);
-- Jeden otwarty deal na leada: retry webhooka ani drugi submit nie tworzą duplikatu (N1 pkt 8).
CREATE UNIQUE INDEX IF NOT EXISTS deals_one_open_per_lead
  ON public.deals (lead_id) WHERE stage NOT IN ('closed_won','closed_lost');

-- ---------- Wynik rozmowy (I4) ----------
CREATE TABLE IF NOT EXISTS public.meeting_outcomes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  booking_id  uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  lead_id     uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  attended    boolean NOT NULL,
  outcome     text NOT NULL CHECK (outcome IN ('offer','follow_up','nurture','unqualified')),
  note        text,
  next_action_at timestamptz,
  expected_amount numeric(10,2),
  recorded_by text
);

CREATE UNIQUE INDEX IF NOT EXISTS meeting_outcomes_booking_key ON public.meeting_outcomes (booking_id);

-- Tabele CRM czyta wyłącznie service role (panel przez własne API).
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_outcomes ENABLE ROW LEVEL SECURITY;
