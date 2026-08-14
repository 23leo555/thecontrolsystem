"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

/**
 * Bramka logowania panelu (sekcja 15/21).
 * Sesję trzyma Supabase Auth; każde żądanie do /api/admin/* niesie token,
 * który serwer weryfikuje i sprawdza względem whitelisty `admin_users`.
 */
export function AdminGate({
  render,
}: {
  render: (token: string, email: string) => React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-text-secondary">Ładowanie…</p>
      </div>
    );
  }

  if (!session) return <LoginForm />;

  return <>{render(session.access_token, session.user.email ?? "")}</>;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setError(null);
      const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
      if (error) setError("Nieprawidłowy e-mail lub hasło.");
      setBusy(false);
    },
    [email, password],
  );

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-display-sm">Panel</h1>
        <p className="mt-2 text-sm text-text-secondary">Dostęp wyłącznie dla właściciela.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold">
              E-mail
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[52px] w-full rounded-xl border border-border bg-surface px-4 focus-visible:outline-none focus-visible:shadow-gold-focus"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold">
              Hasło
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[52px] w-full rounded-xl border border-border bg-surface px-4 focus-visible:outline-none focus-visible:shadow-gold-focus"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}

          <Button type="submit" loading={busy} disabled={!email || !password} className="w-full">
            ZALOGUJ
          </Button>
        </form>
      </div>
    </div>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => supabaseBrowser().auth.signOut()}
      className="text-sm text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
    >
      Wyloguj
    </button>
  );
}
