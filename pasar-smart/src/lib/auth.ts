import "server-only";

import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/nightMarketTypes";
import type { SessionProfile } from "@/lib/sessionTypes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { SessionProfile };

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile, error: pe } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (pe || !profile) return null;

  return {
    id: profile.id,
    email: user.email ?? null,
    full_name: profile.full_name,
    role: profile.role as UserRole,
  };
}

export async function requireAuth(
  redirectTo = "/login",
): Promise<SessionProfile> {
  const p = await getSessionProfile();
  if (!p) redirect(redirectTo);
  return p;
}

export async function requireRole(
  allowed: UserRole[],
  redirectTo = "/login",
): Promise<SessionProfile> {
  const p = await requireAuth(redirectTo);
  if (!allowed.includes(p.role)) redirect("/");
  return p;
}
