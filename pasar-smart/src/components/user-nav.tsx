"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient, clearRoleCookie, ROLE_LABELS, UserRole } from "@/lib/authClient";

interface UserNavProps {
  role: UserRole;
}

export function UserNav({ role }: UserNavProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Demo / unconfigured mode — no real session to clear
    }
    clearRoleCookie();
    router.push("/login");
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)] sm:inline-block">
        {ROLE_LABELS[role]}
      </span>
      <button
        onClick={handleLogout}
        className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:border-[#E8342A]/50 hover:bg-[#E8342A]/10 hover:text-[#E8342A] transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
