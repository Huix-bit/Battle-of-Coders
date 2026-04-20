"use client";

import { useState } from "react";
import { createBrowserClient, clearRoleCookie, ROLE_LABELS, UserRole } from "@/lib/authClient";

const ROLE_COLORS: Record<UserRole, string> = {
  admin:  "from-violet-500 to-purple-600",
  vendor: "from-amber-500 to-orange-500",
  user:   "from-emerald-500 to-teal-500",
};

const ROLE_ICONS: Record<UserRole, string> = {
  admin:  "🏛️",
  vendor: "🛒",
  user:   "🍜",
};

interface UserNavProps { role: UserRole }

export function UserNav({ role }: UserNavProps) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Demo / unconfigured — no real session
    }
    clearRoleCookie();
    window.location.href = "/login";
  }

  return (
    <div className="flex items-center gap-2">
      {/* Role badge */}
      <span
        className={`hidden items-center gap-1.5 rounded-full bg-gradient-to-r ${ROLE_COLORS[role]} px-3 py-1 text-[11px] font-bold text-white shadow-sm sm:flex`}
      >
        <span>{ROLE_ICONS[role]}</span>
        {ROLE_LABELS[role]}
      </span>

      {/* Sign out button */}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] transition-all hover:bg-[#E8342A]/10 hover:text-[#E8342A] disabled:opacity-50"
        title="Sign out"
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="hidden sm:inline">Signing out…</span>
          </span>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </>
        )}
      </button>
    </div>
  );
}
