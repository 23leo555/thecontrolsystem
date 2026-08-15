"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/admin/LeadsTable";

/** Statusy lejka /apply (brief W2). Stary lejek używa A/B/C. */
type StatusV1 = "DRAFT" | "QUALIFIED" | "MANUAL_REVIEW" | "NOT_QUALIFIED";

interface Detail {
  id: string;
  submitted_at: string | null;
  score: number | null;
  qualification_status: "A" | "B" | "C" | null;
  hard_rule_reason: string | null;
  cap_reason: string | null;
  /** Poniżej model z briefu v1.0 — wypełniony tylko dla zgłoszeń z /apply. */
  is_v1: boolean;
  status: StatusV1 | null;
  hard_gate: string | null;
  caps: string[] | null;
  manual_decision: string | null;
  manual_decided_at: string | null;
  booking_token_expires_at: string | null;
  booking_token_used_at: string | null;
  leads: {
    id: string; first_name: string; email: string; phone_e164: string | null;
    lifecycle_status: string; notes: string | null;
    utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
    referrer: string | null; landing_path: string | null; marketing_consent: boolean;
  };
}

/** Panel szczegółów aplikacji: odpowiedzi Q1–Q12, score, powody, decyzje, notatki (sekcja 15). */
export function ApplicationDetail({
  token,
  applicationId,
  onClose,
  onChanged,
}: {
  token: string;
  applicationId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [answers, setAnswers] = useState<{ id: string; prompt: string; value: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as {
      ok: boolean;
      application?: Detail;
      answers?: { id: string; prompt: string; value: string }[];
    };
    if (data.ok && data.application) {
      setDetail(data.application);
      setAnswers(data.answers ?? []);
      setNotes(data.application.leads.notes ?? "");
    }
  }, [applicationId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function decide(action: "approve" | "reject" | "resend") {
    setBusy(action);
    setMessage(null);
    const res = await fetch(`/api/admin/applications/${applicationId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    });
    const data = (await res.json()) as { ok: boolean; emailSent?: boolean; callUrl?: string; error?: string };
    setBusy(null);

    if (!data.ok) {
      setMessage(data.error ?? "Nie udało się zapisać decyzji.");
      return;
    }
    if (action === "reject") setMessage("Zapisano: nie zapraszamy.");
    else {
      setMessage(
        data.emailSent
          ? "Zaproszenie wysłane e-mailem."
          : `E-mail nie wyszedł (domena niezweryfikowana). Link do przekazania ręcznie: ${data.callUrl}`,
      );
    }
    await load();
    onChanged();
  }

  async function saveNotes() {
    if (!detail) return;
    setBusy("notes");
    await fetch(`/api/admin/leads/${detail.leads.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes }),
    });
    setBusy(null);
    setMessage("Notatka zapisana.");
    onChanged();
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Szczegóły aplikacji"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-auto my-8 w-full max-w-3xl rounded-2xl border border-border bg-surface-2 p-6 sm:p-8">
        {!detail ? (
          <p className="text-text-secondary">Ładowanie…</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{detail.leads.first_name}</h2>
                  {detail.is_v1 ? (
                    <StatusV1Badge status={detail.status} />
                  ) : (
                    <StatusBadge status={detail.qualification_status} />
                  )}
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {detail.leads.email}
                  {detail.leads.phone_e164 && ` · ${detail.leads.phone_e164}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Zamknij"
                className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
              >
                Zamknij
              </button>
            </div>

            {/* Dane systemowe — niewidoczne dla klienta */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat label="Score" value={detail.score !== null ? `${detail.score}/100` : "—"} />
              <Stat
                label={detail.is_v1 ? "Capy" : "Cap"}
                value={detail.is_v1 ? (detail.caps?.length ? detail.caps.join(", ") : "—") : (detail.cap_reason ?? "—")}
              />
              <Stat
                label="Hard gate"
                value={detail.is_v1 ? (detail.hard_gate ?? "—") : (detail.hard_rule_reason ?? "—")}
              />
            </div>

            {/* Decyzje — Manual Review w obu modelach */}
            {(detail.is_v1 ? detail.status === "MANUAL_REVIEW" : detail.qualification_status === "B") && (
              <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4">
                <p className="mb-3 text-sm font-semibold">Decyzja ręczna</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="md"
                    loading={busy === "approve"}
                    onClick={() => decide("approve")}
                  >
                    ZATWIERDŹ ROZMOWĘ
                  </Button>
                  <Button
                    size="md"
                    variant="secondary"
                    loading={busy === "reject"}
                    onClick={() => decide("reject")}
                  >
                    NIE ZAPRASZAM
                  </Button>
                </div>
                {detail.manual_decision && (
                  <p className="mt-3 text-sm text-text-secondary">
                    Decyzja: <strong>{detail.manual_decision}</strong>
                    {detail.manual_decided_at &&
                      ` · ${new Date(detail.manual_decided_at).toLocaleString("pl-PL")}`}
                  </p>
                )}
              </div>
            )}

            {/* Ponowne zaproszenie — gdy link wygasł lub e-mail nie dotarł */}
            {(detail.is_v1
              ? detail.status === "QUALIFIED"
              : detail.qualification_status === "A" || detail.manual_decision === "approved") && (
              <div className="mt-6 rounded-xl border border-border bg-surface p-4">
                <p className="mb-2 text-sm font-semibold">Zaproszenie do rezerwacji</p>
                <p className="mb-3 text-xs text-text-secondary">
                  {detail.is_v1
                    ? "Link do strony wyniku jest ważny 7 dni od wysłania. Ponowna wysyłka generuje nowy."
                    : detail.booking_token_used_at
                      ? "Token wykorzystany."
                      : detail.booking_token_expires_at
                        ? `Ważny do ${new Date(detail.booking_token_expires_at).toLocaleString("pl-PL")}`
                        : "Brak aktywnego tokenu."}
                </p>
                <Button
                  size="md"
                  variant="secondary"
                  loading={busy === "resend"}
                  onClick={() => decide("resend")}
                >
                  WYŚLIJ PONOWNIE ZAPROSZENIE
                </Button>
              </div>
            )}

            {message && (
              <p className="mt-4 break-words rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                {message}
              </p>
            )}

            {/* Odpowiedzi Q1–Q12 */}
            <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-gold">Odpowiedzi</h3>
            <dl className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {answers.map((a) => (
                <div key={a.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_1fr] sm:gap-4">
                  <dt className="text-sm text-text-secondary">{a.prompt}</dt>
                  <dd className="text-sm font-medium">{a.value}</dd>
                </div>
              ))}
            </dl>

            {/* Źródło */}
            <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-gold">Źródło</h3>
            <p className="mt-2 text-sm text-text-secondary">
              {[
                detail.leads.utm_source && `utm_source: ${detail.leads.utm_source}`,
                detail.leads.utm_medium && `utm_medium: ${detail.leads.utm_medium}`,
                detail.leads.utm_campaign && `utm_campaign: ${detail.leads.utm_campaign}`,
                detail.leads.referrer && `referrer: ${detail.leads.referrer}`,
                detail.leads.landing_path && `landing: ${detail.leads.landing_path}`,
              ].filter(Boolean).join(" · ") || "brak danych"}
              {" · "}
              zgoda marketingowa: {detail.leads.marketing_consent ? "tak" : "nie"}
            </p>

            {/* Notatki */}
            <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-gold">Notatki</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              aria-label="Notatki do leada"
              className="mt-3 w-full rounded-xl border border-border bg-surface p-4 text-sm focus-visible:outline-none focus-visible:shadow-gold-focus"
              placeholder="Ustalenia, kontekst, follow-up…"
            />
            <Button size="md" variant="secondary" loading={busy === "notes"} onClick={saveNotes} className="mt-3">
              ZAPISZ NOTATKĘ
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Status lejka /apply. Kolory niosą tę samą informację co tekst, więc etykieta
 * jest zawsze wypisana słownie — panel bywa czytany na telefonie w słońcu.
 */
function StatusV1Badge({ status }: { status: StatusV1 | null }) {
  const map: Record<StatusV1, { label: string; cls: string }> = {
    QUALIFIED: { label: "QUALIFIED", cls: "border-success/40 bg-success/10 text-success" },
    MANUAL_REVIEW: { label: "MANUAL REVIEW", cls: "border-warning/40 bg-warning/10 text-warning" },
    NOT_QUALIFIED: { label: "NOT QUALIFIED", cls: "border-border bg-surface text-text-secondary" },
    DRAFT: { label: "DRAFT", cls: "border-border bg-surface text-text-secondary" },
  };
  const s = status ? map[status] : null;
  if (!s) return null;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wider text-text-secondary">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
