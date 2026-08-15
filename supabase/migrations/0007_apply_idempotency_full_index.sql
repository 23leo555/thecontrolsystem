-- ON CONFLICT (idempotency_key) nie działa z indeksem CZĘŚCIOWYM: Postgres zgłasza
-- 42P10 "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification". Oba istniejące indeksy miały predykat WHERE idempotency_key
-- IS NOT NULL, przez co upsert w /api/apply padał i zgłoszenia przepadały.
--
-- Zamieniamy je na jeden pełny indeks unikalny. Zachowanie jest identyczne:
-- w Postgresie wartości NULL nie kolidują ze sobą, więc drafty bez klucza
-- idempotencji nadal mogą współistnieć.
--
-- Zastosowane na produkcji 2026-08-15.

DROP INDEX IF EXISTS public.applications_idempotency_key_uniq;
DROP INDEX IF EXISTS public.applications_idempotency_key;

CREATE UNIQUE INDEX applications_idempotency_key
  ON public.applications USING btree (idempotency_key);
