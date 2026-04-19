"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient, setRoleCookie, ROLE_LABELS, ROLE_DESCRIPTIONS, UserRole } from "@/lib/authClient";

const ROLES: UserRole[] = ["admin", "vendor", "user"];

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match. Please check again.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, name },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // If email confirmation is disabled, sign the user in directly
      if (data.session) {
        setRoleCookie(role);
        router.push(`/${role}`);
        return;
      }

      // Email confirmation required
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1D9E75]/15">
            <svg className="h-7 w-7 text-[#1D9E75]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--accent-strong)]">Confirmation email sent</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Register</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--accent-strong)]">Create a new account</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Select your role and fill in your details</p>
      </div>

      {/* Role Selector */}
      <div className="grid grid-cols-3 gap-3">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-xl border-2 p-3 text-left transition-all ${
              role === r
                ? "border-[var(--accent)] bg-[var(--surface)] shadow-sm"
                : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] hover:bg-[var(--surface)]"
            }`}
          >
            <p className={`text-sm font-semibold ${role === r ? "text-[var(--accent-strong)]" : "text-[var(--text)]"}`}>
              {ROLE_LABELS[r]}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)] leading-snug">{ROLE_DESCRIPTIONS[r]}</p>
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-5">
        {error && (
          <div className="rounded-lg border border-[#E8342A]/40 bg-[#E8342A]/10 px-4 py-3 text-sm text-[#E8342A]">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium text-[var(--text)]">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ahmad bin Ali"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirm" className="block text-sm font-medium text-[var(--text)]">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-opacity"
        >
          {loading ? "Creating account…" : `Sign up as ${ROLE_LABELS[role]}`}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
