"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klient przeglądarkowy — TYLKO klucz publiczny (anon/publishable).
 * Służy wyłącznie do logowania w panelu; dane czytamy przez /api/admin/*,
 * gdzie token jest weryfikowany po stronie serwera.
 */
let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Brak konfiguracji Supabase (URL / klucz publiczny).");

  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
