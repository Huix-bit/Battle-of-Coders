import { createClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "vendor" | "user";

export function createBrowserClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const urlValid = url.startsWith("http://") || url.startsWith("https://");
  if (!urlValid || key.length < 20) {
    // Return a no-op client in demo mode; sign-out in user-nav.tsx catches this
    throw new Error("Supabase not configured — demo mode active");
  }
  return createClient(url, key);
}

export function setRoleCookie(role: UserRole) {
  document.cookie = `user-role=${role}; path=/; SameSite=Lax; max-age=86400`;
}

export function clearRoleCookie() {
  document.cookie = "user-role=; path=/; max-age=0";
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  vendor: "Vendor",
  user: "User",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Full access: vendors, schedules & reports",
  vendor: "View your stall schedule & assignments",
  user: "Browse nearby night markets & activity",
};

// ── Demo / mock accounts (bypass Supabase for testing) ──────────────────────
export interface MockAccount {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  { role: "admin",  email: "admin@pasar.smart",  password: "Admin@123",  name: "Ahmad Pentadbir" },
  { role: "vendor", email: "vendor@pasar.smart", password: "Vendor@123", name: "Faridah Peniaga"  },
  { role: "user",   email: "user@pasar.smart",   password: "User@123",   name: "Razif Pelanggan" },
];

export function findMockAccount(email: string, password: string): MockAccount | null {
  return (
    MOCK_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    ) ?? null
  );
}
