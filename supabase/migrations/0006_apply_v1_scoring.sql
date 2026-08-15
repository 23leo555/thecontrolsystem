-- Rozszerzenie tabeli applications o model z briefu wdrożeniowego v1.0 (sekcje T4, V, W).
--
-- Zmiany są addytywne. Stary lejek /aplikacja korzysta z dotychczasowych kolumn
-- (qualification_status A/B/C, hard_rule_reason, cap_reason) i działa dalej bez zmian,
-- dzięki czemu przebudowa nie przerywa zbierania zgłoszeń.
--
-- Zastosowane na produkcji 2026-08-15 jako migracja `apply_v1_scoring_columns`.

-- T4: draft powstaje anonimowo, zanim poznamy e-mail (pytanie 14 z 15).
-- Dotąd lead_id był wymagany, co uniemożliwiało utworzenie draftu na starcie.
ALTER TABLE public.applications ALTER COLUMN lead_id DROP NOT NULL;

-- Statusy z sekcji W2. Stary enum A/B/C zostaje nietknięty dla zgodności wstecznej.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status_v1') THEN
    CREATE TYPE public.application_status_v1 AS ENUM ('DRAFT', 'QUALIFIED', 'MANUAL_REVIEW', 'NOT_QUALIFIED');
  END IF;
END$$;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS status public.application_status_v1,
  ADD COLUMN IF NOT EXISTS scoring_version text,
  -- Ślad audytowy wg V4: powód hard gate'a i lista capów Manual Review.
  ADD COLUMN IF NOT EXISTS hard_gate text,
  ADD COLUMN IF NOT EXISTS caps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Snapshot źródła ruchu zamrażany w chwili submitu (T4).
  ADD COLUMN IF NOT EXISTS source_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_step smallint,
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

-- Panel operacyjny filtruje po statusie i dacie — bez indeksu skanuje całość.
CREATE INDEX IF NOT EXISTS applications_status_v1_idx
  ON public.applications (status, submitted_at DESC);

-- Uwaga: unikalność idempotency_key zapewnia już wcześniejsze ograniczenie
-- `applications_idempotency_key`, więc dodatkowy indeks jest zbędny.
