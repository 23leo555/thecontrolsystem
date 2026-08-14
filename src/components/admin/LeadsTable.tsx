"use client";

import { useCallback, useEffect, useState } from "react";
import { ApplicationDetail } from "@/components/admin/ApplicationDetail";

export interface LeadRow {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  phone_e164: string | null;
  lifecycle_status: string;
  utm_source: string | null;
  source_first: string | null;
  notes: string | null;
  application: {
    id: string;
    score: number | null;
    qualification_status: "A" | "B" | "C" | null;
    cap_reason: string | null;
    hard_rule_reason: string | null;
    manual_decision: string | null;
  } | null;
}

const LIFECYCLE_OPTIONS = [
  "NEW_LEAD", "PROTOCOL_DOWNLOADED", "APPLICATION_COMPLETED", "QUALIFIED",
  "MANUAL_REVIEW", "MANUAL_APPROVED", "NOT_QUALIFIED", "CALL_BOOKED",
  "CALL_CANCELED", "CALL_COMPLETED", "NO_SHOW", "FOLLOW_UP", "CLIENT", "LOST",
];

export function LeadsTable({ token }: { token: string }) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [lifecycle, setLifecycle] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (lifecycle) params.set("lifecycle", lifecycle);

    try {
      const res = await fetch(`/api/admin/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { ok: boolean; leads?: LeadRow[]; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Błąd pobierania.");
      setLeads(data.leads ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd pobierania.");
    } finally {
      setLoading(false);
    }
  }, [token, q, status, lifecycle]);

  useEffect(() => {
    void load();
  }, [load]);

  async function exportCsv() {
    const res = await fetch("/api/admin/export", { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leady-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Filtry */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="search" className="mb-1.5 block text-xs text-text-secondary">
            Szukaj (imię, e-mail, telefon)
          </label>
          <input
            id="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:shadow-gold-focus"
            placeholder="np. Marek"
          />
        </div>
        <div>
          <label htmlFor="f-status" className="mb-1.5 block text-xs text-text-secondary">Status</label>
          <select
            id="f-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="min-h-[44px] rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:shadow-gold-focus"
          >
            <option value="">Wszystkie</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-lifecycle" className="mb-1.5 block text-xs text-text-secondary">Lifecycle</label>
          <select
            id="f-lifecycle"
            value={lifecycle}
            onChange={(e) => setLifecycle(e.target.value)}
            className="min-h-[44px] rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:shadow-gold-focus"
          >
            <option value="">Wszystkie</option>
            {LIFECYCLE_OPTIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="min-h-[44px] rounded-lg border border-border bg-surface px-4 text-sm hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-gold-focus"
        >
          Eksport CSV
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <p className="mt-6 text-sm text-text-secondary">
        {loading ? "Ładowanie…" : `${leads.length} leadów`}
      </p>

      {/* Tabela przewija się poziomo wewnątrz kontenera — strona nigdy nie scrolluje w bok. */}
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2 text-left text-xs uppercase tracking-wider text-text-secondary">
              <Th>Data</Th><Th>Imię</Th><Th>Kontakt</Th><Th>Status</Th>
              <Th>Score</Th><Th>Powód</Th><Th>Lifecycle</Th><Th>Źródło</Th><Th />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-border align-top">
                <Td>{new Date(lead.created_at).toLocaleDateString("pl-PL")}</Td>
                <Td className="font-semibold">{lead.first_name}</Td>
                <Td>
                  <span className="block">{lead.email}</span>
                  {lead.phone_e164 && (
                    <span className="block text-text-secondary">{lead.phone_e164}</span>
                  )}
                </Td>
                <Td><StatusBadge status={lead.application?.qualification_status ?? null} /></Td>
                <Td>{lead.application?.score ?? "—"}</Td>
                <Td className="text-text-secondary">
                  {lead.application?.hard_rule_reason ?? lead.application?.cap_reason ?? "—"}
                </Td>
                <Td className="text-text-secondary">{lead.lifecycle_status}</Td>
                <Td className="text-text-secondary">{lead.utm_source ?? lead.source_first ?? "—"}</Td>
                <Td>
                  {lead.application && (
                    <button
                      type="button"
                      onClick={() => setOpenId(lead.application!.id)}
                      className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-gold-focus"
                    >
                      Otwórz
                    </button>
                  )}
                </Td>
              </tr>
            ))}
            {!loading && leads.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-text-secondary">
                  Brak leadów spełniających kryteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openId && (
        <ApplicationDetail
          token={token}
          applicationId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => void load()}
        />
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

export function StatusBadge({ status }: { status: "A" | "B" | "C" | null }) {
  if (!status) return <span className="text-text-secondary">—</span>;
  const map = {
    A: "border-success/50 bg-success/15 text-success",
    B: "border-warning/50 bg-warning/15 text-warning",
    C: "border-border bg-surface text-text-secondary",
  } as const;
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${map[status]}`}>
      {status}
    </span>
  );
}
