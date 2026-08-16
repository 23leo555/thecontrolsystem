"use client";

import { useState } from "react";
import { AdminGate, SignOutButton } from "@/components/admin/AdminGate";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { CrmBoard } from "@/components/admin/CrmBoard";
import { Logo } from "@/components/ui/Logo";

type Tab = "crm" | "leads";

/**
 * Panel: bramka logowania + dwie zakładki.
 *
 * CRM to widoki operacyjne z sekcji K1 briefu — odpowiadają na pytanie
 * „co mam dziś zrobić". Baza leadów zostaje jako przeglądarka całości
 * z filtrami i eksportem; jedno nie zastępuje drugiego.
 */
export function AdminApp() {
  const [tab, setTab] = useState<Tab>("crm");

  return (
    <AdminGate
      render={(token, email) => (
        <div className="tcs-container max-w-6xl py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <Logo />
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span>{email}</span>
              <SignOutButton />
            </div>
          </div>

          <div className="mt-8 flex gap-2" role="tablist" aria-label="Sekcje panelu">
            {(
              [
                ["crm", "CRM"],
                ["leads", "Baza leadów"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === key
                    ? "bg-gold text-[#07090C]"
                    : "border border-border text-text-secondary hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {tab === "crm" ? <CrmBoard token={token} /> : <LeadsTable token={token} />}
          </div>
        </div>
      )}
    />
  );
}
