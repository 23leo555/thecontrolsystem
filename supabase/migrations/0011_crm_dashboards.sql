-- Dashboardy K2 briefu CRM. Definicje metryk żyją w bazie, żeby panel i ręcznie
-- pisane zapytania liczyły to samo (P3: każda metryka ma jawny licznik i mianownik).
--
-- OGRANICZENIE, które trzeba znać czytając te liczby: nie ma tabeli zdarzeń
-- z sekcji H, więc wszystko sprzed wysłania formularza — wizyty, VSL, CTA —
-- jest NIEMIERZALNE w tej bazie. Lejek zaczyna się od submitu i panel mówi to wprost.
--
-- Zastosowane na produkcji 2026-08-16 jako migracja `crm_dashboard_views`.

CREATE OR REPLACE VIEW public.crm_stats_funnel AS
WITH protokol AS (
  SELECT id FROM public.leads WHERE funnel_origin = 'protocol_download'
), aplikacje AS (
  SELECT a.*, l.funnel_origin FROM public.applications a
  JOIN public.leads l ON l.id = a.lead_id
  WHERE a.is_draft = false
)
SELECT 'protokol' AS lejek, 1 AS krok, 'zgloszenia' AS etap, (SELECT count(*) FROM protokol) AS ile
UNION ALL SELECT 'protokol', 2, 'protokol dostarczony',
  (SELECT count(*) FROM public.leads WHERE funnel_origin = 'protocol_download' AND protocol_sent_at IS NOT NULL)
UNION ALL SELECT 'protokol', 3, 'przeszli do aplikacji',
  (SELECT count(DISTINCT a.lead_id) FROM aplikacje a WHERE a.funnel_origin = 'protocol_download')
UNION ALL SELECT 'aplikacja', 1, 'aplikacje wyslane', (SELECT count(*) FROM aplikacje)
UNION ALL SELECT 'aplikacja', 2, 'zakwalifikowani',
  (SELECT count(*) FROM aplikacje WHERE status = 'QUALIFIED')
UNION ALL SELECT 'aplikacja', 3, 'do analizy recznej',
  (SELECT count(*) FROM aplikacje WHERE status = 'MANUAL_REVIEW')
UNION ALL SELECT 'aplikacja', 4, 'terminy zarezerwowane',
  (SELECT count(*) FROM public.bookings WHERE status = 'booked')
UNION ALL SELECT 'aplikacja', 5, 'rozmowy odbyte',
  (SELECT count(*) FROM public.meeting_outcomes WHERE attended IS TRUE)
UNION ALL SELECT 'aplikacja', 6, 'oferty',
  (SELECT count(*) FROM public.deals WHERE offer_sent_at IS NOT NULL)
UNION ALL SELECT 'aplikacja', 7, 'klienci',
  (SELECT count(*) FROM public.deals WHERE stage = 'closed_won');

CREATE OR REPLACE VIEW public.crm_stats_attribution AS
SELECT
  COALESCE(l.utm_source, 'bezposrednie') AS zrodlo,
  COALESCE(l.utm_campaign, '—') AS kampania,
  count(*) AS kontakty,
  count(*) FILTER (WHERE l.funnel_origin = 'protocol_download') AS z_protokolu,
  (SELECT count(*) FROM public.applications a
     WHERE a.lead_id = ANY(array_agg(l.id)) AND a.is_draft = false) AS aplikacje,
  (SELECT count(*) FROM public.bookings b WHERE b.lead_id = ANY(array_agg(l.id))) AS rezerwacje,
  (SELECT count(*) FROM public.deals d
     WHERE d.lead_id = ANY(array_agg(l.id)) AND d.stage = 'closed_won') AS klienci,
  COALESCE((SELECT sum(d.amount) FROM public.deals d
     WHERE d.lead_id = ANY(array_agg(l.id)) AND d.stage = 'closed_won'), 0) AS przychod
FROM public.leads l
GROUP BY 1, 2
ORDER BY kontakty DESC;

CREATE OR REPLACE VIEW public.crm_stats_sales_ops AS
SELECT
  (SELECT count(*) FROM public.leads WHERE owner IS NULL AND do_not_contact IS FALSE
     AND lead_status IN ('new','awaiting_review','contact_allowed','contact_attempted',
                         'connected','follow_up_required')) AS aktywne_bez_wlasciciela,
  (SELECT count(*) FROM public.leads WHERE next_action_at IS NOT NULL AND next_action_at < now()) AS zadania_po_terminie,
  (SELECT count(*) FROM public.crm_view_missing_next_action) AS bez_next_action,
  (SELECT count(*) FROM public.bookings WHERE status = 'booked' AND start_at >= now()) AS nadchodzace_spotkania,
  (SELECT count(*) FROM public.meeting_outcomes WHERE attended IS TRUE) AS odbyte,
  (SELECT count(*) FROM public.meeting_outcomes WHERE attended IS FALSE) AS nieobecnosci,
  (SELECT count(*) FROM public.deals WHERE stage NOT IN ('closed_won','closed_lost')) AS otwarte_szanse,
  (SELECT count(*) FROM public.deals WHERE stage = 'closed_won') AS wygrane,
  (SELECT count(*) FROM public.deals WHERE stage = 'closed_lost') AS przegrane,
  (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (last_sales_activity_at - created_at))/3600)
     FROM public.leads WHERE last_sales_activity_at IS NOT NULL) AS mediana_reakcji_h,
  (SELECT max(EXTRACT(DAY FROM (now() - updated_at)))
     FROM public.deals WHERE stage NOT IN ('closed_won','closed_lost')) AS najstarsza_szansa_dni;

CREATE OR REPLACE VIEW public.crm_stats_compliance AS
SELECT
  (SELECT count(*) FROM public.leads) AS kontakty,
  (SELECT count(*) FROM public.leads WHERE email_status IN ('bounced','invalid')) AS zle_maile,
  (SELECT count(*) FROM public.leads WHERE phone_status = 'invalid') AS zle_numery,
  (SELECT count(*) FROM public.leads WHERE phone_e164 IS NULL) AS bez_numeru,
  (SELECT count(*) FROM public.leads WHERE do_not_contact IS TRUE OR phone_status = 'do_not_call') AS sprzeciwy,
  (SELECT count(*) FROM public.leads WHERE marketing_consent IS TRUE) AS zgoda_email,
  (SELECT count(*) FROM public.leads WHERE phone_consent IS TRUE) AS zgoda_telefon,
  (SELECT count(*) FROM public.callable_leads) AS mozna_dzwonic,
  (SELECT count(*) FROM public.leads WHERE data_retention_until IS NULL) AS bez_terminu_retencji,
  (SELECT count(*) FROM public.leads WHERE data_retention_until < current_date) AS po_retencji,
  (SELECT count(*) FROM public.email_events WHERE event_type = 'bounced') AS odbicia_maili,
  (SELECT count(*) FROM public.crm_reconciliation) AS rozbieznosci;

CREATE OR REPLACE VIEW public.crm_stats_consents AS
SELECT consent_type AS kanal, status, COALESCE(text_version, '—') AS wersja, count(*) AS ile
FROM public.consents
GROUP BY 1, 2, 3
ORDER BY 1, 2;

REVOKE ALL ON public.crm_stats_funnel, public.crm_stats_attribution, public.crm_stats_sales_ops,
  public.crm_stats_compliance, public.crm_stats_consents
FROM public, anon, authenticated;
