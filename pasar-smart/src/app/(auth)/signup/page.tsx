"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { createBrowserClient, setRoleCookie, setVendorIdCookie, ROLE_DESCRIPTIONS, UserRole } from "@/lib/authClient";

const ROLES: { value: UserRole; label: string; icon: string; color: string }[] = [
  {
    value: "vendor",
    label: "Vendor",
    icon: "🛒",
    color: "rgba(245,166,35,0.12)",
  },
  {
    value: "user",
    label: "Customer",
    icon: "🍜",
    color: "rgba(29,158,117,0.12)",
  },
];

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

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak",   color: "#E8342A" };
  if (score <= 3) return { score, label: "Fair",   color: "#F5A623" };
  return              { score, label: "Strong", color: "#1D9E75" };
}

const JENIS_JUALAN_OPTIONS = [
  "Makanan & Minuman",
  "Pakaian & Fesyen",
  "Kraftangan & Cenderamata",
  "Elektronik & Aksesori",
  "Buah-buahan & Sayur-sayuran",
  "Kuih-muih & Roti",
  "Barangan Runcit",
  "Lain-lain",
];

export default function SignupPage() {
  const [role, setRole]         = useState<UserRole>("user");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [jenisJualan, setJenisJualan] = useState("Makanan & Minuman");
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

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
      // Register via admin API (no email confirmation required)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          jenis_jualan: role === "vendor" ? jenisJualan : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Registration failed. Please try again.");
        return;
      }

      // Account created — sign in immediately
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setRoleCookie(role);
      if (role === "vendor" && json.vendorId) {
        setVendorIdCookie(json.vendorId);
      }
      window.location.href = `/${role}`;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">

      {/* ── Brand header ─────────────────────────────────────────────────── */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          <span>✦</span> Create Account
        </div>
        <h1 className="mt-3 text-3xl font-bold gradient-text">Join Pasar Smart</h1>
        <p className="text-sm text-[var(--muted)]">Register as a vendor or customer to get started</p>
      </div>

      {/* ── Role selector ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map((r) => {
          const active = role === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                active
                  ? "border-[var(--accent)] shadow-[0_0_20px_2px_rgba(245,166,35,0.15)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]/50"
              }`}
              style={{ background: active ? r.color : "var(--lifted)" }}
            >
              {active && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]">
                  <svg className="h-3 w-3 text-[var(--abyss)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <span className="text-2xl">{r.icon}</span>
              <p className={`mt-2 text-sm font-bold ${active ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                {r.label}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-[var(--muted)]">
                {ROLE_DESCRIPTIONS[r.value]}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="glass-card p-6 space-y-4"
      >
        {/* Error banner */}
        {error && (
          <div className="animate-slide-down flex items-start gap-3 rounded-xl border border-[#E8342A]/40 bg-[#E8342A]/10 px-4 py-3 text-sm text-[#E8342A]">
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {/* Full name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {role === "vendor" ? "Business Owner Name" : "Full Name"}
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "vendor" ? "Nama pemiaga" : "Ahmad bin Ali"}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
          />
        </div>

        {/* Jenis Jualan — vendors only */}
        {role === "vendor" && (
          <div className="space-y-1.5">
            <label htmlFor="jenisJualan" className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Jenis Jualan <span className="normal-case font-normal">(Business Category)</span>
            </label>
            <select
              id="jenisJualan"
              value={jenisJualan}
              onChange={(e) => setJenisJualan(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            >
              {JENIS_JUALAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <p className="text-xs text-[var(--muted)]">You can update this later in your vendor dashboard.</p>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 pr-11 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
          {/* Password strength bar */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: i <= strength.score ? strength.color : "var(--raised)",
                    }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: strength.color }}>
                {strength.label} password
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm" className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showCf ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              className={`w-full rounded-xl border bg-[var(--input)] px-4 py-2.5 pr-11 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 transition-all ${
                passwordsMismatch
                  ? "border-[#E8342A] focus:border-[#E8342A] focus:ring-[#E8342A]/20"
                  : passwordsMatch
                  ? "border-[#1D9E75] focus:border-[#1D9E75] focus:ring-[#1D9E75]/20"
                  : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-[var(--accent)]/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCf((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              aria-label={showCf ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showCf} />
            </button>
            {/* Inline match indicator */}
            {passwordsMatch && (
              <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[#1D9E75]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </div>
          {passwordsMismatch && (
            <p className="text-xs text-[#E8342A]">Passwords do not match</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || passwordsMismatch}
          className="btn-glow mt-2 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--abyss)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Creating account…
            </span>
          ) : (
            `Sign up as ${ROLES.find((r) => r.value === role)?.label}`
          )}
        </button>
      </form>

      {/* ── Footer link ──────────────────────────────────────────────────── */}
      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline underline-offset-2">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
