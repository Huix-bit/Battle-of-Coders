"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import {
  createBrowserClient,
  setRoleCookie,
  setVendorIdCookie,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  UserRole,
} from "@/lib/authClient";

const ROLES: UserRole[] = ["admin", "vendor", "user"];

const ROLE_ICONS: Record<UserRole, string> = {
  admin:  "🏛️",
  vendor: "🛒",
  user:   "🍜",
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function LoginPage() {
  const [role, setRole]         = useState<UserRole>("user");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Invalid email or password. Please try again."
            : authError.message
        );
        return;
      }

      const userId = data.user.id;

      // Read role and vendor_id from the profiles table
      let resolvedRole: UserRole;
      let resolvedVendorId: string | null = null;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, vendor_id")
          .eq("id", userId)
          .single();

        if (profile?.role) {
          resolvedRole = profile.role as UserRole;
          resolvedVendorId = (profile as { vendor_id?: string | null }).vendor_id ?? null;
        } else {
          // Profile row missing — fall back to metadata written during signup
          const fallback = data.user?.user_metadata?.role as UserRole | undefined;
          if (!fallback) {
            await supabase.auth.signOut();
            setError("Account role could not be determined. Please contact support.");
            return;
          }
          resolvedRole = fallback;
        }
      } catch {
        // Schema cache / network hiccup — fall back to metadata
        const fallback = data.user?.user_metadata?.role as UserRole | undefined;
        if (!fallback) {
          await supabase.auth.signOut();
          setError("Could not reach the database. Please try again in a moment.");
          return;
        }
        resolvedRole = fallback;
      }

      // Validate the role selector matches the actual account role
      if (resolvedRole !== role) {
        await supabase.auth.signOut();
        setError(`This account is registered as "${ROLE_LABELS[resolvedRole]}". Please select the "${ROLE_LABELS[resolvedRole]}" role above.`);
        return;
      }

      setRoleCookie(resolvedRole);

      if (resolvedRole === "vendor") {
        // Use vendor_id from profile; fall back to auth UUID
        setVendorIdCookie(resolvedVendorId ?? userId);
      }

      window.location.href = `/${resolvedRole}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">

      {/* ── Header ── */}
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Sign In</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--text)]">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Select your role and sign in with your account</p>
      </div>

      {/* ── Role Selector ── */}
      <div className="grid grid-cols-3 gap-3">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => { setRole(r); setError(null); }}
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
            <p className="mt-0.5 text-xs leading-snug text-[var(--muted)]">{ROLE_DESCRIPTIONS[r]}</p>
          </button>
        ))}
      </div>

      {/* ── Form ── */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-5"
      >
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-[#E8342A]/40 bg-[#E8342A]/10 px-4 py-3 text-sm text-[#E8342A]">
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
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
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 pr-10 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--abyss)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-opacity"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing in…
            </span>
          ) : (
            `Sign in as ${ROLE_LABELS[role]}`
          )}
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
