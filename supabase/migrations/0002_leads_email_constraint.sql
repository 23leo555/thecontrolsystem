-- ON CONFLICT (email) wymaga ograniczenia na samej kolumnie, nie na wyrażeniu lower(email).
-- Aplikacja normalizuje e-mail do lowercase przed zapisem (lib/validation.ts),
-- a CHECK domyka to na poziomie bazy.
drop index if exists public.leads_email_key;

alter table public.leads
  add constraint leads_email_lowercase check (email = lower(email));

alter table public.leads
  add constraint leads_email_unique unique (email);
