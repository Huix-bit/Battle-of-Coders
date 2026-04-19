"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { UserRole } from "@/lib/nightMarketTypes";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "BUYER", label: "Pembeli" },
  { value: "VENDOR", label: "Penjaja" },
  { value: "ADMIN", label: "Pentadbir (guna dengan berhati-hati)" },
];

export function RegisterForm() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("BUYER");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    const supabase = getSupabaseBrowserClient();
    const { data, error: signErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: nama.trim(),
          role,
        },
      },
    });
    setPending(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }
    setInfo(
      "Akaun dicipta. Jika pengesahan e-mel diperlukan, semak peti masuk anda sebelum log masuk.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold text-[var(--accent-strong)]">Daftar akaun</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Profil dan peranan disimpan selepas pengesahan (trigger pangkalan data).
        </p>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted)]">Nama penuh</span>
        <input
          required
          value={nama}
          onChange={(ev) => setNama(ev.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
        />
      </label>
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
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted)]">Peranan</span>
        <select
          value={role}
          onChange={(ev) => setRole(ev.target.value as UserRole)}
          className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-[var(--muted)]" role="status">
          {info}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
      >
        {pending ? "Mendaftar…" : "Daftar"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Sudah ada akaun?{" "}
        <Link href="/login" className="font-medium text-[var(--accent-strong)] underline">
          Log masuk
        </Link>
      </p>
    </form>
  );
}
