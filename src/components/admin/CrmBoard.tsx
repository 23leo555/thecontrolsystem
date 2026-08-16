"use client";

import { useCallback, useEffect, useState } from "react";
import { CRM_VIEWS, LEAD_STATUSES, NEXT_ACTION_TYPES, findView } from "@/lib/crm/views";

/**
 * Widoki operacyjne CRM — sekcja K1 briefu.
 *
 * Karta pokazuje komplet wymagany przez brief: imię, e-mail, telefon,
 * MOŻLIWOŚĆ kontaktu telefonicznego, źródło, lejek, status, właściciela,
 * ostatnią aktywność i następne działanie. „Callable" jest osobnym znacznikiem,
 * bo sam numer w bazie nie oznacza prawa do dzwonienia (PKE art. 398).
 */

interface Row {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_e164?: string | null;
  callable?: boolean;
  do_not_contact?: boolean;
  lifecycle_stage?: string | null;
  lead_status?: string | null;
  owner?: string | null;
  funnel_origin?: string | null;
  utm_source?: string | null;
  latest_touch_at?: string | null;
  last_sales_activity_at?: string | null;
  next_action_at?: string | null;
  next_action_type?: string | null;
  score?: number | null;
  start_at?: string | null;
  stage?: string | null;
  problem?: string | null;
  record_id?: string | null;
  occurred_at?: string | null;
}

const dt = (v?: string | null) =>
  v ? new Date(v).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : "—";

export function CrmBoard({ token }: { token: string }) {
  const [viewKey, setViewKey] = useState(CRM_VIEWS[0]!.key);
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const view = findView(viewKey);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/crm?view=${viewKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { ok: boolean; rows?: Row[]; counts?: Record<string, number> };
    if (data.ok) {
      setRows(data.rows ?? []);
      setCounts(data.counts ?? {});
    }
    setLoading(false);
  }, [token, viewKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(id: string, patch: Record<string, unknown>) {
    setMessage(null);
    const res = await fetch(`/api/admin/crm/lead/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setMessage(data.error ?? "Nie udało się zapisać.");
      return;
    }
    setEditing(null);
    await load();
  }

  return (
    <div>
      {/* Nawigacja z licznikami — od razu widać, gdzie coś czeka. */}
      <nav className="flex flex-wrap gap-2" aria-label="Widoki CRM">
        {CRM_VIEWS.map((v) => {
          const n = counts[v.key] ?? 0;
          const alarm = v.shouldBeEmpty && n > 0;
          const active = v.key === viewKey;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setViewKey(v.key)}
              aria-current={active ? "true" : undefined}
              className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-gold bg-gold/10 text-text-primary"
                  : "border-border bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              {v.label}{" "}
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  alarm ? "bg-danger/20 text-danger" : "bg-surface-2 text-text-secondary"
                }`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </nav>

      <p className="mt-4 text-sm text-text-secondary">{view.hint}</p>

      {message && (
        <p role="alert" className="mt-4 rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm">
          {message}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-text-secondary">Ładowanie…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
          {view.shouldBeEmpty
            ? "Pusto — i o to chodzi. Ta lista ma zostać pusta."
            : "Brak pozycji w tym widoku."}
        </p>
      ) : view.key === "reconciliation" ? (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-text-secondary">
            <tr>
              <th className="py-2">Problem</th>
              <th className="py-2">Rekord</th>
              <th className="py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.record_id}-${i}`} className="border-t border-border">
                <td className="py-3 font-medium">{r.problem}</td>
                <td className="py-3 font-mono text-xs text-text-secondary">{r.record_id}</td>
                <td className="py-3 text-text-secondary">{dt(r.occurred_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}
                    {r.score != null && (
                      <span className="ml-2 text-sm font-normal text-text-secondary">score {r.score}</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {r.email ?? "—"}
                    {r.phone_e164 && ` · ${r.phone_e164}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.do_not_contact ? (
                    <Tag tone="danger">NIE KONTAKTOWAĆ</Tag>
                  ) : r.callable ? (
                    <Tag tone="ok">można dzwonić</Tag>
                  ) : (
                    <Tag tone="muted">brak zgody na telefon</Tag>
                  )}
                  {r.lifecycle_stage && <Tag tone="muted">{r.lifecycle_stage}</Tag>}
                  {r.stage && <Tag tone="muted">{r.stage}</Tag>}
                </div>
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Lejek" value={r.funnel_origin ?? "—"} />
                <Field label="Źródło" value={r.utm_source ?? "bezpośrednie"} />
                <Field label="Status" value={r.lead_status ?? "—"} />
                <Field label="Właściciel" value={r.owner ?? "— brak —"} />
                <Field label="Ostatnia aktywność" value={dt(r.last_sales_activity_at ?? r.latest_touch_at)} />
                <Field
                  label="Następne działanie"
                  value={r.next_action_at ? `${r.next_action_type ?? "—"} · ${dt(r.next_action_at)}` : "— brak —"}
                />
                {r.start_at && <Field label="Termin rozmowy" value={dt(r.start_at)} />}
              </dl>

              {editing === r.id ? (
                <EditRow row={r} onCancel={() => setEditing(null)} onSave={(patch) => save(r.id, patch)} />
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(r.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-2"
                  >
                    Zaplanuj działanie
                  </button>
                  {!r.do_not_contact && (
                    <button
                      type="button"
                      onClick={() => save(r.id, { do_not_contact: true })}
                      className="rounded-lg border border-danger/40 px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
                    >
                      Nie kontaktować
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditRow({
  row,
  onCancel,
  onSave,
}: {
  row: Row;
  onCancel: () => void;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const [owner, setOwner] = useState(row.owner ?? "Krystian");
  const [status, setStatus] = useState(row.lead_status ?? "new");
  const [type, setType] = useState(row.next_action_type ?? "call");
  // Domyślnie jutro rano — realny termin bije pustą datę, którą trzeba wpisywać ręcznie.
  const [when, setWhen] = useState(() => {
    const d = row.next_action_at ? new Date(row.next_action_at) : new Date(Date.now() + 864e5);
    if (!row.next_action_at) d.setHours(9, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const field = "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm";

  return (
    <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-2/50 p-4">
      <label className="text-xs text-text-secondary">
        Właściciel
        <input value={owner} onChange={(e) => setOwner(e.target.value)} className={`${field} mt-1 block w-40`} />
      </label>
      <label className="text-xs text-text-secondary">
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} mt-1 block`}>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-text-secondary">
        Działanie
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${field} mt-1 block`}>
          {NEXT_ACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-text-secondary">
        Kiedy
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className={`${field} mt-1 block`}
        />
      </label>
      <button
        type="button"
        onClick={() =>
          onSave({
            owner,
            lead_status: status,
            next_action_type: type,
            next_action_at: new Date(when).toISOString(),
          })
        }
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-[#07090C]"
      >
        Zapisz
      </button>
      <button type="button" onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-sm">
        Anuluj
      </button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-text-secondary">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: "ok" | "danger" | "muted" }) {
  const cls = {
    ok: "border-success/40 bg-success/10 text-success",
    danger: "border-danger/40 bg-danger/10 text-danger",
    muted: "border-border bg-surface-2 text-text-secondary",
  }[tone];
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}
