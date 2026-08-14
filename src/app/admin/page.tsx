import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

/** Panel administracyjny (sekcja 15) — chroniony Supabase Auth + whitelistą admin_users. */
export default function AdminPage() {
  return (
    <main id="main" className="min-h-screen">
      <AdminApp />
    </main>
  );
}
