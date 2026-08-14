import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klient serwerowy z service role — WYŁĄCZNIE po stronie serwera (sekcja 21).
 * Publiczny frontend nigdy nie dostaje tego klucza.
 */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
