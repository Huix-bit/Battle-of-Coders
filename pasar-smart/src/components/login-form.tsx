"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const supabase = getSupabaseBrowserClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setPending(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    router.push(nextPath.startsWith("/") ? nextPath : "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold text-[var(--accent-strong)]">Log masuk</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Gunakan e-mel dan kata laluan akaun Supabase anda.</p>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted)]">E-mel</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted)]">Kata laluan</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
      >
        {pending ? "Memproses…" : "Log masuk"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Belum ada akaun?{" "}
        <Link href="/daftar" className="font-medium text-[var(--accent-strong)] underline">
          Daftar
        </Link>
      </p>
    </form>
  );
}
