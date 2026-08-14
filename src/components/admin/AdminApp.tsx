"use client";

import { AdminGate, SignOutButton } from "@/components/admin/AdminGate";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { Logo } from "@/components/ui/Logo";

/** Cały panel po stronie klienta — bramka logowania + dashboard. */
export function AdminApp() {
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
          <h1 className="mt-8 text-display-sm">Leady</h1>
          <div className="mt-8">
            <LeadsTable token={token} />
          </div>
        </div>
      )}
    />
  );
}
