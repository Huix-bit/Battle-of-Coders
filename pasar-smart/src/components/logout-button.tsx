"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--card)]"
      onClick={async () => {
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
        window.location.href = "/";
      }}
    >
      Log keluar
    </button>
  );
}
