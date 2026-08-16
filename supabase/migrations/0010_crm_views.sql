-- Widoki operacyjne CRM — sekcje K1 i N2 briefu CRM.
--
-- Reguły biznesowe („kto jest callable", „co znaczy brak next action") żyją
-- w bazie, nie w kodzie panelu. Dzięki temu ten sam warunek obowiązuje panel,
-- raporty i każde ręczne zapytanie — nie da się przypadkiem obdzwonić ludzi bez
-- zgody, pisząc własnego SELECT-a po tabeli `leads`.
--
-- Zastosowane na produkcji 2026-08-16 jako migracja `crm_operational_views`.

-- Wspólna karta kontaktu dla wszystkich widoków (K1).
CREATE OR REPLACE VIEW public.crm_contacts AS
SELECT
  l.id, l.created_at, l.first_name, l.last_name, l.email, l.phone_e164,
  l.email_status, l.phone_status, l.marketing_consent, l.phone_consent, l.do_not_contact,
  (l.phone_e164 IS NOT NULL AND l.phone_consent IS TRUE AND l.do_not_contact IS FALSE
     AND (l.phone_status IS NULL OR l.phone_status <> 'do_not_call')) AS callable,
  l.lifecycle_status::text AS lifecycle_stage,
  l.lead_status, l.owner, l.funnel_origin,
  l.first_touch_at, l.latest_touch_at, l.last_sales_activity_at,
  l.next_action_at, l.next_action_type,
  l.utm_source, l.utm_medium, l.utm_campaign, l.first_landing_page,
  l.protocol_sent_at, l.data_retention_until,
  (SELECT count(*) FROM public.applications a WHERE a.lead_id = l.id AND a.is_draft = false) AS applications,
  (SELECT max(b.start_at) FROM public.bookings b WHERE b.lead_id = l.id AND b.status = 'booked') AS next_meeting_at,
  (SELECT d.stage FROM public.deals d WHERE d.lead_id = l.id ORDER BY d.updated_at DESC LIMIT 1) AS deal_stage
FROM public.leads l;

CREATE OR REPLACE VIEW public.crm_view_to_call AS
SELECT * FROM public.crm_contacts
WHERE callable IS TRUE
  AND lead_status IN ('new','contact_allowed','contact_attempted','follow_up_required')
ORDER BY COALESCE(next_action_at, created_at);

CREATE OR REPLACE VIEW public.crm_view_applications_to_review AS
SELECT c.*, a.id AS application_id, a.score, a.submitted_at, a.caps, a.hard_gate
FROM public.applications a
JOIN public.crm_contacts c ON c.id = a.lead_id
WHERE a.is_draft = false AND a.status = 'MANUAL_REVIEW' AND a.manual_decision IS NULL
ORDER BY a.submitted_at;

CREATE OR REPLACE VIEW public.crm_view_qualified_no_meeting AS
SELECT c.*, a.id AS application_id, a.score, a.submitted_at
FROM public.applications a
JOIN public.crm_contacts c ON c.id = a.lead_id
WHERE a.is_draft = false AND a.status = 'QUALIFIED'
  AND NOT EXISTS (SELECT 1 FROM public.bookings b WHERE b.lead_id = a.lead_id AND b.status = 'booked')
ORDER BY a.submitted_at;

CREATE OR REPLACE VIEW public.crm_view_upcoming_meetings AS
SELECT c.*, b.id AS booking_id, b.start_at, b.meeting_url, b.previous_start_at
FROM public.bookings b
JOIN public.crm_contacts c ON c.id = b.lead_id
WHERE b.status = 'booked' AND b.start_at >= now()
ORDER BY b.start_at;

-- Rozmowa się odbyła, wyniku nie ma (I4, kryterium 36).
CREATE OR REPLACE VIEW public.crm_view_meetings_without_outcome AS
SELECT c.*, b.id AS booking_id, b.start_at
FROM public.bookings b
JOIN public.crm_contacts c ON c.id = b.lead_id
WHERE b.status = 'booked' AND b.start_at < now()
  AND NOT EXISTS (SELECT 1 FROM public.meeting_outcomes m WHERE m.booking_id = b.id)
ORDER BY b.start_at DESC;

-- Widok docelowo pusty (kryterium 34).
CREATE OR REPLACE VIEW public.crm_view_missing_next_action AS
SELECT * FROM public.crm_contacts
WHERE do_not_contact IS FALSE
  AND lead_status IN ('new','awaiting_review','contact_allowed','contact_attempted',
                      'connected','follow_up_required')
  AND (next_action_at IS NULL OR owner IS NULL)
ORDER BY created_at;

CREATE OR REPLACE VIEW public.crm_view_open_deals AS
SELECT c.*, d.id AS deal_id, d.stage, d.amount, d.currency, d.expected_close_date,
       d.updated_at AS deal_updated_at
FROM public.deals d
JOIN public.crm_contacts c ON c.id = d.lead_id
WHERE d.stage NOT IN ('closed_won','closed_lost')
ORDER BY d.updated_at DESC;

-- Nie generują zadań sprzedażowych (kryterium 53).
CREATE OR REPLACE VIEW public.crm_view_bad_data AS
SELECT * FROM public.crm_contacts
WHERE email_status IN ('bounced','invalid') OR phone_status = 'invalid'
   OR lead_status IN ('bad_data','spam')
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW public.crm_view_do_not_contact AS
SELECT * FROM public.crm_contacts
WHERE do_not_contact IS TRUE OR phone_status = 'do_not_call' OR lead_status = 'do_not_contact'
ORDER BY latest_touch_at DESC NULLS LAST;

CREATE OR REPLACE VIEW public.crm_view_nurture AS
SELECT * FROM public.crm_contacts
WHERE lead_status = 'nurture' AND do_not_contact IS FALSE
ORDER BY latest_touch_at DESC NULLS LAST;

-- Reconciliation (N2) — jedna lista rozbieżności do sprzątnięcia.
CREATE OR REPLACE VIEW public.crm_reconciliation AS
SELECT 'aplikacja bez leada' AS problem, a.id AS record_id, a.submitted_at AS occurred_at
  FROM public.applications a WHERE a.is_draft = false AND a.lead_id IS NULL
UNION ALL
SELECT 'rezerwacja bez leada', b.id, b.created_at
  FROM public.bookings b WHERE b.lead_id IS NULL
UNION ALL
SELECT 'kontakt bez lejka', l.id, l.created_at
  FROM public.leads l WHERE l.funnel_origin IS NULL
UNION ALL
SELECT 'aktywny lead bez next action', l.id, l.created_at
  FROM public.leads l
  WHERE l.do_not_contact IS FALSE
    AND l.lead_status IN ('new','awaiting_review','contact_allowed','contact_attempted',
                          'connected','follow_up_required')
    AND (l.next_action_at IS NULL OR l.owner IS NULL)
UNION ALL
SELECT 'przekroczona retencja', l.id, l.created_at
  FROM public.leads l WHERE l.data_retention_until IS NOT NULL AND l.data_retention_until < current_date
UNION ALL
SELECT 'rozmowa bez wyniku', b.id, b.start_at
  FROM public.bookings b
  WHERE b.status = 'booked' AND b.start_at < now()
    AND NOT EXISTS (SELECT 1 FROM public.meeting_outcomes m WHERE m.booking_id = b.id);

-- Widoki niosą dane osobowe — czyta je wyłącznie service role przez API panelu.
REVOKE ALL ON public.crm_contacts, public.crm_view_to_call, public.crm_view_applications_to_review,
  public.crm_view_qualified_no_meeting, public.crm_view_upcoming_meetings,
  public.crm_view_meetings_without_outcome, public.crm_view_missing_next_action,
  public.crm_view_open_deals, public.crm_view_bad_data, public.crm_view_do_not_contact,
  public.crm_view_nurture, public.crm_reconciliation
FROM public, anon, authenticated;
