import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Weryfikacja dostępu do panelu (sekcja 15/21).
 * Dwa niezależne warunki: ważny token Supabase Auth ORAZ e-mail na whiteliście `admin_users`.
 * Sam fakt posiadania konta w projekcie NIE wystarcza.
 */
export interface AdminIdentity {
  userId: string;
  email: string;
}

export async function requireAdmin(req: NextRequest): Promise<AdminIdentity | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;

  const db = supabaseAdmin();

  const { data: userData, error } = await db.auth.getUser(token);
  const user = userData?.user;
  if (error || !user?.email) return null;

  const email = user.email.toLowerCase();
  const { data: allowed } = await db
    .from("admin_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!allowed) return null;
  return { userId: user.id, email };
}

/** Skrót do jednolitej odpowiedzi 401. */
export const unauthorized = () =>
  Response.json({ ok: false, error: "Brak dostępu." }, { status: 401 });
