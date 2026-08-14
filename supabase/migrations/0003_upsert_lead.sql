-- Upsert leada z zachowaniem atrybucji FIRST TOUCH (sekcja 18).
-- Powracający użytkownik nie kasuje pierwotnego źródła: coalesce(istniejące, nowe).
create or replace function public.upsert_lead(
  p_first_name        text,
  p_email             text,
  p_marketing_consent boolean,
  p_source_first      text default null,
  p_utm_source        text default null,
  p_utm_medium        text default null,
  p_utm_campaign      text default null,
  p_utm_content       text default null,
  p_utm_term          text default null,
  p_referrer          text default null,
  p_landing_path      text default null
)
returns table (id uuid, email_bounced boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  insert into public.leads as l (
    first_name, email, marketing_consent, consent_at,
    source_first, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    referrer, landing_path, lifecycle_status
  )
  values (
    p_first_name, lower(p_email), coalesce(p_marketing_consent, false), now(),
    p_source_first, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term,
    p_referrer, p_landing_path, 'NEW_LEAD'
  )
  on conflict (email) do update set
    first_name        = excluded.first_name,
    -- Najnowszy jawny wybór użytkownika (pozwala też wycofać zgodę).
    marketing_consent = excluded.marketing_consent,
    consent_at        = now(),
    -- FIRST TOUCH: raz zapisane źródło nie jest nadpisywane.
    source_first  = coalesce(l.source_first,  excluded.source_first),
    utm_source    = coalesce(l.utm_source,    excluded.utm_source),
    utm_medium    = coalesce(l.utm_medium,    excluded.utm_medium),
    utm_campaign  = coalesce(l.utm_campaign,  excluded.utm_campaign),
    utm_content   = coalesce(l.utm_content,   excluded.utm_content),
    utm_term      = coalesce(l.utm_term,      excluded.utm_term),
    referrer      = coalesce(l.referrer,      excluded.referrer),
    landing_path  = coalesce(l.landing_path,  excluded.landing_path)
  returning l.id, l.email_bounced;
end $$;

-- Funkcja wywoływana wyłącznie przez service role (route handler), nie przez anon.
revoke all on function public.upsert_lead(text,text,boolean,text,text,text,text,text,text,text,text)
  from public, anon, authenticated;
