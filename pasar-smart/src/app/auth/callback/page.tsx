"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient, setRoleCookie, UserRole } from "@/lib/authClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");

      if (!code) {
        setErrorMsg("No confirmation code found in this link. Please try signing up again.");
        return;
      }

      try {
        const supabase = createBrowserClient();

        // Exchange the PKCE code for a real session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.session) {
          setErrorMsg(
            error?.message ?? "Failed to confirm your email. The link may have expired."
          );
          return;
        }

        const role = (data.session.user.user_metadata?.role ?? "user") as UserRole;
        setRoleCookie(role);
        router.replace(`/${role}`);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    }

    handleCallback();
  }, [searchParams, router]);

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="glass-card w-full max-w-md p-8 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8342A]/15">
            <svg className="h-7 w-7 text-[#E8342A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Confirmation failed</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{errorMsg}</p>
          </div>
          <a
            href="/signup"
            className="inline-block rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--abyss)] hover:opacity-90 transition-opacity"
          >
            Back to sign up
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="glass-card w-full max-w-md p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/15">
          <svg className="h-7 w-7 animate-spin text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--text)]">Confirming your email…</h2>
        <p className="text-sm text-[var(--muted)]">Please wait while we verify your account.</p>
      </div>
    </div>
  );
}
