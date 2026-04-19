"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createBrowserClient,
  setRoleCookie,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  MOCK_ACCOUNTS,
  findMockAccount,
  UserRole,
} from "@/lib/authClient";

const ROLES: UserRole[] = ["admin", "vendor", "user"];

const ROLE_ICONS: Record<UserRole, string> = {
  admin:  "🏛️",
  vendor: "🛒",
  user:   "🍜",
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole]         = useState<UserRole>("user");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  /** Fill the form with a demo account and auto-submit */
  function quickLogin(account: (typeof MOCK_ACCOUNTS)[number]) {
    setRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
    // Small delay so React can flush state before we call signIn
    setTimeout(() => doLogin(account.email, account.password, account.role), 50);
  }

  async function doLogin(loginEmail: string, loginPassword: string, selectedRole: UserRole) {
    setError(null);
    setLoading(true);
    try {
      // ── Demo bypass (no Supabase needed) ────────────────────────────────
      const mock = findMockAccount(loginEmail, loginPassword);
      if (mock) {
        if (mock.role !== selectedRole) {
          setError(
            `This demo account is for the "${ROLE_LABELS[mock.role]}" role. Please select that role first.`
          );
          return;
        }
        setRoleCookie(mock.role);
        router.push(`/${mock.role}`);
        return;
      }

      // ── Real Supabase auth ───────────────────────────────────────────────
      const supabase = createBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Invalid email or password."
            : authError.message
        );
        return;
      }

      const storedRole = data.user?.user_metadata?.role as UserRole | undefined;
      if (storedRole && storedRole !== selectedRole) {
        await supabase.auth.signOut();
        setError(
          `This account is registered as "${ROLE_LABELS[storedRole]}". Please select the correct role.`
        );
        return;
      }

      const effectiveRole: UserRole = storedRole ?? selectedRole;
      setRoleCookie(effectiveRole);
      router.push(`/${effectiveRole}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await doLogin(email, password, role);
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Sign In</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--text)]">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Select your role and enter your credentials</p>
      </div>

      {/* ── Demo accounts panel ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--lifted)] p-4 space-y-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          <span>⚡</span> Demo Accounts — click to sign in instantly
        </p>
        <div className="grid gap-2">
          {MOCK_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              type="button"
              disabled={loading}
              onClick={() => quickLogin(acc)}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-3 text-left transition-all hover:border-[var(--accent)]/60 hover:bg-[var(--raised)] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{ROLE_ICONS[acc.role]}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {ROLE_LABELS[acc.role]}
                    <span className="ml-2 text-xs font-normal text-[var(--muted)]">— {acc.name}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">{acc.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-xs text-[var(--muted)]">{acc.password}</span>
                <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                  Quick login →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--muted)]">or sign in manually</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* ── Role Selector ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-xl border-2 p-3 text-left transition-all ${
              role === r
                ? "border-[var(--accent)] bg-[var(--raised)] shadow-sm"
                : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50 hover:bg-[var(--raised)]"
            }`}
          >
            <p className="text-lg">{ROLE_ICONS[r]}</p>
            <p className={`mt-1 text-sm font-semibold ${role === r ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
              {ROLE_LABELS[r]}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)] leading-snug">{ROLE_DESCRIPTIONS[r]}</p>
          </button>
        ))}
      </div>

      {/* ── Form ────────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-5"
      >
        {error && (
          <div className="rounded-lg border border-[#E8342A]/40 bg-[#E8342A]/10 px-4 py-3 text-sm text-[#E8342A]">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-[var(--text)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-[var(--text)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--abyss)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-opacity"
        >
          {loading ? "Signing in…" : `Sign in as ${ROLE_LABELS[role]}`}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">
          Sign up here
        </Link>
      </p>
    </div>
  );
}
