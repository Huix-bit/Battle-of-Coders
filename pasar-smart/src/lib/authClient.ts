import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";

export type UserRole = "admin" | "vendor" | "user";

/** Returns the shared Supabase browser client (singleton — no duplicate instances). */
export function createBrowserClient() {
  if (!SUPABASE_CONFIGURED) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
  }
  return supabase;
}

export function setRoleCookie(role: UserRole) {
  document.cookie = `user-role=${role}; path=/; SameSite=Lax; max-age=86400`;
}

export function setVendorIdCookie(vendorId: string) {
  document.cookie = `vendor-id=${vendorId}; path=/; SameSite=Lax; max-age=86400`;
}

export function clearRoleCookie() {
  document.cookie = "user-role=; path=/; max-age=0";
}

export function clearVendorIdCookie() {
  document.cookie = "vendor-id=; path=/; max-age=0";
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:  "Admin",
  vendor: "Vendor",
  user:   "User",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin:  "Full access: vendors, schedules & reports",
  vendor: "Manage your stall, flash sales & analytics",
  user:   "Browse nearby night markets & discover deals",
};
