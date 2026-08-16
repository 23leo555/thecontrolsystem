"use client";

import { useEffect, useState } from "react";

/**
 * Dashboardy K2 briefu CRM: lejek, atrybucja, operacje sprzedażowe, zgodność.
 *
 * OGRANICZENIE, które pokazujemy wprost zamiast je ukrywać (P3): nie mamy
 * jeszcze tabeli zdarzeń z sekcji H, więc wszystko sprzed wysłania formularza
 * — wizyty, odtworzenia VSL, kliknięcia CTA — jest niemierzalne w tej bazie.
 * Lejek zaczyna się od submitu i tak jest opisany, żeby nikt nie policzył
 * konwersji z mianownika, którego nie ma.
 */

interface FunnelRow {
  lejek: string;
  krok: number;
  etap: string;
  ile: number;
}
interface AttributionRow {
  zrodlo: string;
  kampania: string;
  kontakty: number;
  z_protokolu: number;
  aplikacje: number;
  rezerwacje: number;
  klienci: number;
  przychod: string | number;
}
interface ConsentRow {
  kanal: string;
  status: string;
  wersja: string;
  ile: number;
}
type Stats = {
  funnel: FunnelRow[];
  attribution: AttributionRow[];
  salesOps: Record<string, number | null> | null;
  compliance: Record<string, number | null> | null;
  consents: ConsentRow[];
};

const LEJKI: Record<string, string> = { protokol: "Lejek A · Protokół", aplikacja: "Lejek B · Aplikacja" };

export function CrmDashboards({ token }: { token: string }) {
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/crm/stats", { headers: { Authorization: `Bearer ${token}` } });
      const json = (await res.json()) as { ok: boolean; error?: string } & Stats;
      if (!json.ok) {
        setError(json.error ?? "Nie udało się wczytać danych.");
        return;
      }
      setData(json);
    })();
  }, [token]);

  if (error) {
    return (
      <p role="alert" className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm">
        {error}
      </p>
    );
  }
  if (!data) return <p className="text-text-secondary">Ładowanie…</p>;

  const grupy = Array.from(new Set(data.funnel.map((r) => r.lejek)));

  return (
    <div className="space-y-12">
      <section>
        <H>Lejek</H>
        <Note>
          Liczby zaczynają się od wysłanego formularza. Wizyt, odtworzeń VSL i kliknięć CTA nie ma tu
          celowo — mierzy je dopiero warstwa zdarzeń z sekcji H, której jeszcze nie zbudowaliśmy.
        </Note>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {grupy.map((lejek) => {
            const kroki = data.funnel.filter((r) => r.lejek === lejek).sort((a, b) => a.krok - b.krok);
            const baza = kroki[0]?.ile ?? 0;
            return (
              <div key={lejek} className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gold">{LEJKI[lejek] ?? lejek}</h3>
                <ul className="mt-4 space-y-3">
                  {kroki.map((k) => {
                    const pct = baza > 0 ? Math.round((k.ile / baza) * 100) : 0;
                    return (
                      <li key={k.etap}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span>{k.etap}</span>
                          <span className="font-semibold">
                            {k.ile}
                            {k.krok > 1 && <span className="ml-2 text-text-secondary">{pct}%</span>}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full bg-gold" style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-text-secondary">Procent liczony od „{kroki[0]?.etap}”.</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <H>Pozyskanie i atrybucja</H>
        <Note>Podział po źródle zapisanym przy pierwszym kontakcie (first touch).</Note>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="py-2">Źródło</th>
                <th className="py-2">Kampania</th>
                <th className="py-2 text-right">Kontakty</th>
                <th className="py-2 text-right">Aplikacje</th>
                <th className="py-2 text-right">Rezerwacje</th>
                <th className="py-2 text-right">Klienci</th>
                <th className="py-2 text-right">Przychód</th>
              </tr>
            </thead>
            <tbody>
              {data.attribution.map((r, i) => (
                <tr key={`${r.zrodlo}-${r.kampania}-${i}`} className="border-t border-border">
                  <td className="py-3">{r.zrodlo}</td>
                  <td className="py-3 text-text-secondary">{r.kampania}</td>
                  <td className="py-3 text-right">{r.kontakty}</td>
                  <td className="py-3 text-right">{r.aplikacje}</td>
                  <td className="py-3 text-right">{r.rezerwacje}</td>
                  <td className="py-3 text-right font-semibold">{r.klienci}</td>
                  <td className="py-3 text-right">{Number(r.przychod).toLocaleString("pl-PL")} zł</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <H>Operacje sprzedażowe</H>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Aktywne bez właściciela" value={data.salesOps?.aktywne_bez_wlasciciela} alarm />
          <Kpi label="Bez next action" value={data.salesOps?.bez_next_action} alarm />
          <Kpi label="Zadania po terminie" value={data.salesOps?.zadania_po_terminie} alarm />
          <Kpi label="Nadchodzące spotkania" value={data.salesOps?.nadchodzace_spotkania} />
          <Kpi label="Rozmowy odbyte" value={data.salesOps?.odbyte} />
          <Kpi label="Nieobecności" value={data.salesOps?.nieobecnosci} />
          <Kpi label="Otwarte szanse" value={data.salesOps?.otwarte_szanse} />
          <Kpi label="Wygrane" value={data.salesOps?.wygrane} />
          <Kpi
            label="Mediana reakcji"
            value={data.salesOps?.mediana_reakcji_h}
            suffix=" h"
            hint="Od zapisu kontaktu do pierwszej aktywności handlowej."
          />
          <Kpi
            label="Najstarsza szansa"
            value={data.salesOps?.najstarsza_szansa_dni}
            suffix=" dni"
            hint="Bez ruchu w pipelinie."
          />
        </div>
      </section>

      <section>
        <H>Jakość danych i zgodność</H>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Kontakty" value={data.compliance?.kontakty} />
          <Kpi label="Można dzwonić" value={data.compliance?.mozna_dzwonic} hint="Numer + zgoda + brak sprzeciwu." />
          <Kpi label="Zgoda e-mail" value={data.compliance?.zgoda_email} />
          <Kpi label="Zgoda telefon" value={data.compliance?.zgoda_telefon} />
          <Kpi label="Sprzeciwy" value={data.compliance?.sprzeciwy} />
          <Kpi label="Odbicia maili" value={data.compliance?.odbicia_maili} alarm />
          <Kpi label="Po terminie retencji" value={data.compliance?.po_retencji} alarm />
          <Kpi label="Bez terminu retencji" value={data.compliance?.bez_terminu_retencji} alarm />
          <Kpi label="Złe adresy" value={data.compliance?.zle_maile} alarm />
          <Kpi label="Złe numery" value={data.compliance?.zle_numery} alarm />
          <Kpi label="Rozbieżności" value={data.compliance?.rozbieznosci} alarm />
        </div>

        <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-gold">Rejestr zgód</h3>
        <Note>Dowód rozliczalności: ile zgód udzielono i odmówiono, w której wersji treści.</Note>
        {data.consents.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">Brak wpisów — rejestr zapełnia się od kolejnych zgłoszeń.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="py-2">Kanał</th>
                <th className="py-2">Status</th>
                <th className="py-2">Wersja treści</th>
                <th className="py-2 text-right">Ile</th>
              </tr>
            </thead>
            <tbody>
              {data.consents.map((c, i) => (
                <tr key={`${c.kanal}-${c.status}-${c.wersja}-${i}`} className="border-t border-border">
                  <td className="py-2">{c.kanal}</td>
                  <td className="py-2">{c.status}</td>
                  <td className="py-2 font-mono text-xs text-text-secondary">{c.wersja}</td>
                  <td className="py-2 text-right">{c.ile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-bold">{children}</h2>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 max-w-[80ch] text-sm text-text-secondary">{children}</p>
);

function Kpi({
  label,
  value,
  suffix = "",
  hint,
  alarm,
}: {
  label: string;
  value: number | null | undefined;
  suffix?: string;
  hint?: string;
  alarm?: boolean;
}) {
  const n = value == null ? null : Math.round(Number(value) * 10) / 10;
  // Czerwień tylko wtedy, gdy licznik faktycznie coś zgłasza — inaczej cały
  // dashboard krzyczy i przestaje cokolwiek znaczyć.
  const zle = alarm && (n ?? 0) > 0;
  return (
    <div className={`rounded-xl border p-4 ${zle ? "border-danger/40 bg-danger/10" : "border-border bg-surface"}`}>
      <p className="text-xs uppercase tracking-wider text-text-secondary">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${zle ? "text-danger" : ""}`}>
        {n == null ? "—" : `${n}${suffix}`}
      </p>
      {hint && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
    </div>
  );
}
