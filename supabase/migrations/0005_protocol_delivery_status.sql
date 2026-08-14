-- Brief V2 sekcja 15 („Minimalny model danych") — status dostarczenia Protokołu
-- trzymany bezpośrednio na leadzie, żeby dało się filtrować bez joinowania
-- email_events. `consent_version` doszło migracją 0004.
alter table public.leads
  add column if not exists protocol_sent_at timestamptz;

alter table public.leads
  add column if not exists email_status text;

do $$ begin
  alter table public.leads
    add constraint leads_email_status_check
    check (email_status is null or email_status in ('sent','delivered','bounced','complained'));
exception when duplicate_object then null; end $$;
