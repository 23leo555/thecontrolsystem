-- Śledzenie pobrań Protokołu Resetu + podstawa powiadomienia właściciela.
--
-- Do tej pory wiedzieliśmy wyłącznie, że Protokół został WYSŁANY
-- (`protocol_sent_at`). To, czy ktoś w ogóle kliknął link i pobrał PDF, nie
-- zostawiało żadnego śladu. Te kolumny domykają lejek A: wysłany -> pobrany.
alter table public.leads
  add column if not exists protocol_downloaded_at        timestamptz,
  add column if not exists protocol_download_last_at     timestamptz,
  add column if not exists protocol_download_count       integer not null default 0,
  add column if not exists protocol_download_notified_at timestamptz;

comment on column public.leads.protocol_downloaded_at is
  'Pierwsze pobranie PDF-a przez podpisany link /api/reset/pobierz.';
comment on column public.leads.protocol_download_notified_at is
  'Ostatnie powiadomienie właściciela o pobraniu — źródło cooldownu antyspamowego.';

create index if not exists leads_protocol_downloaded_idx
  on public.leads (protocol_downloaded_at desc nulls last);

-- Rejestracja pobrania w jednej atomowej instrukcji: inkrement licznika i
-- decyzja „czy wysyłać powiadomienie" muszą powstać w tej samej transakcji,
-- inaczej dwa równoległe kliknięcia (prefetch przeglądarki, klient pocztowy
-- odpytujący link) wyślą dwa maile o tym samym pobraniu.
--
-- should_notify = pierwsze pobranie ALBO minął cooldown od ostatniego
-- powiadomienia. Kolejne kliknięcia tego samego leada tego samego dnia są
-- liczone, ale nie zasypują skrzynki właściciela.
create or replace function public.register_protocol_download(
  p_lead_id                uuid,
  p_notify_cooldown_hours  integer default 24
)
returns table (
  first_download boolean,
  download_count integer,
  should_notify  boolean,
  first_name     text,
  email          text,
  phone_e164     text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notify boolean;
  v_first  boolean;
begin
  select
    l.protocol_downloaded_at is null,
    l.protocol_downloaded_at is null
      or l.protocol_download_notified_at is null
      or l.protocol_download_notified_at
         < now() - make_interval(hours => greatest(coalesce(p_notify_cooldown_hours, 24), 0))
  into v_first, v_notify
  from public.leads l
  where l.id = p_lead_id
  for update;

  if not found then
    return;
  end if;

  return query
  update public.leads l set
    protocol_downloaded_at        = coalesce(l.protocol_downloaded_at, now()),
    protocol_download_last_at     = now(),
    protocol_download_count       = coalesce(l.protocol_download_count, 0) + 1,
    protocol_download_notified_at =
      case when v_notify then now() else l.protocol_download_notified_at end
  where l.id = p_lead_id
  returning v_first, l.protocol_download_count, v_notify, l.first_name, l.email, l.phone_e164;
end $$;

-- Funkcja czyta i zapisuje dane osobowe — wywołuje ją wyłącznie serwer
-- (service role), nigdy przeglądarka.
revoke all on function public.register_protocol_download(uuid, integer)
  from public, anon, authenticated;
