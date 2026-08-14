-- =====================================================================
-- The Control System — publiczny lejek. Schemat początkowy (sekcja 14).
-- UWAGA: to OSOBNY projekt Supabase. Nie mieszać z bazą płatnych klientów.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMy ----------
do $$ begin
  create type lifecycle_status as enum (
    'NEW_LEAD','PROTOCOL_DOWNLOADED','APPLICATION_STARTED','APPLICATION_COMPLETED',
    'QUALIFIED','MANUAL_REVIEW','MANUAL_APPROVED','NOT_QUALIFIED',
    'CALL_BOOKED','CALL_CANCELED','CALL_COMPLETED','NO_SHOW','FOLLOW_UP','CLIENT','LOST'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type qualification_status as enum ('A','B','C');
exception when duplicate_object then null; end $$;

do $$ begin
  create type manual_decision as enum ('approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('booked','canceled','rescheduled','completed','no_show');
exception when duplicate_object then null; end $$;

-- ---------- leads ----------
create table if not exists public.leads (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  first_name             text not null,
  email                  text not null,
  phone_e164             text,
  source_first           text,
  utm_source             text,
  utm_medium             text,
  utm_campaign           text,
  utm_content            text,
  utm_term               text,
  referrer               text,
  landing_path           text,
  protocol_downloaded_at timestamptz,
  lifecycle_status       lifecycle_status not null default 'NEW_LEAD',
  marketing_consent      boolean not null default false,
  consent_at             timestamptz,
  email_bounced          boolean not null default false,
  notes                  text
);

-- Email w lowercase, unikalny → powrót tego samego adresu aktualizuje leada (sekcja 23).
create unique index if not exists leads_email_key on public.leads (lower(email));
create index if not exists leads_lifecycle_idx on public.leads (lifecycle_status);
create index if not exists leads_created_idx on public.leads (created_at desc);

-- ---------- applications ----------
create table if not exists public.applications (
  id                       uuid primary key default gen_random_uuid(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  lead_id                  uuid not null references public.leads(id) on delete cascade,
  form_version             text not null default 'v1',
  answers_json             jsonb not null default '{}'::jsonb,
  score                    integer check (score between 0 and 100),
  qualification_status     qualification_status,
  hard_rule_reason         text,   -- powód systemowy, NIEwidoczny dla klienta
  cap_reason               text,
  is_draft                 boolean not null default true,
  submitted_at             timestamptz,
  manual_decision          manual_decision,
  manual_decided_at        timestamptz,
  booking_token_hash       text,   -- nigdy nie przechowujemy jawnego tokenu
  booking_token_expires_at timestamptz,
  booking_token_used_at    timestamptz,
  idempotency_key          text
);

create unique index if not exists applications_idempotency_key
  on public.applications (idempotency_key) where idempotency_key is not null;
create index if not exists applications_lead_idx on public.applications (lead_id);
create index if not exists applications_status_idx on public.applications (qualification_status);
create index if not exists applications_token_idx on public.applications (booking_token_hash);

-- ---------- bookings ----------
create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  lead_id           uuid not null references public.leads(id) on delete cascade,
  application_id    uuid references public.applications(id) on delete set null,
  calendly_event_uri text not null,
  start_at          timestamptz,
  end_at            timestamptz,
  status            booking_status not null default 'booked',
  meeting_url       text,
  previous_start_at timestamptz  -- przy reschedule
);

-- Idempotencja webhooków Calendly (sekcja 23).
create unique index if not exists bookings_event_uri_key on public.bookings (calendly_event_uri);

-- ---------- email_events ----------
create table if not exists public.email_events (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  lead_id             uuid references public.leads(id) on delete cascade,
  provider_message_id text,
  template_key        text not null,
  event_type          text not null check (event_type in
    ('sent','delivered','bounced','complained','opened','clicked','unsubscribed')),
  raw_event           jsonb
);

create index if not exists email_events_lead_idx on public.email_events (lead_id, created_at desc);
create unique index if not exists email_events_dedupe
  on public.email_events (provider_message_id, event_type)
  where provider_message_id is not null;

-- ---------- webhook_log (audyt + idempotencja) ----------
create table if not exists public.webhook_log (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  provider     text not null,
  external_id  text,
  event_type   text,
  payload      jsonb,
  handled_ok   boolean not null default true,
  error_text   text
);

create unique index if not exists webhook_log_dedupe
  on public.webhook_log (provider, external_id) where external_id is not null;

-- ---------- updated_at trigger ----------
-- search_path pusty — zabezpieczenie przed przejęciem przez schematy użytkownika.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

drop trigger if exists applications_touch on public.applications;
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- RLS (sekcja 21): domyślnie ZERO dostępu dla klucza anon.
-- Zapisy wyłącznie przez service role (route handlery / Edge Functions).
-- Odczyt: tylko whitelistowany admin.
-- =====================================================================
alter table public.leads        enable row level security;
alter table public.applications enable row level security;
alter table public.bookings     enable row level security;
alter table public.email_events enable row level security;
alter table public.webhook_log  enable row level security;

-- Lista adresów z dostępem do panelu admin.
create table if not exists public.admin_users (
  email      text primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

insert into public.admin_users (email)
values ('krystian.cwik@thecontrolsystem.biz')
on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean language sql stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Polityki odczytu dla admina (service role omija RLS i tak).
do $$
declare t text;
begin
  foreach t in array array['leads','applications','bookings','email_events','webhook_log'] loop
    execute format(
      'drop policy if exists %I on public.%I', 'admin_read_' || t, t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_admin())',
      'admin_read_' || t, t);
  end loop;
end $$;

-- Admin może aktualizować leady i aplikacje (notatki, lifecycle, decyzja manualna).
drop policy if exists admin_update_leads on public.leads;
create policy admin_update_leads on public.leads
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_update_applications on public.applications;
create policy admin_update_applications on public.applications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_read_admin_users on public.admin_users;
create policy admin_read_admin_users on public.admin_users
  for select to authenticated using (public.is_admin());
