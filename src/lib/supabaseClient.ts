import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

// Require a full HTTP/HTTPS URL and a non-trivial key
const urlValid = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
const keyValid = rawKey.length > 20;

/** True when real Supabase credentials are present and well-formed. */
export const SUPABASE_CONFIGURED = urlValid && keyValid;

if (!SUPABASE_CONFIGURED) {
  const hint = !rawUrl
    ? "NEXT_PUBLIC_SUPABASE_URL is empty"
    : !urlValid
    ? `NEXT_PUBLIC_SUPABASE_URL must start with https:// (got: "${rawUrl}")`
    : "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or too short";

  console.warn(`[pasar-smart] Demo mode — ${hint}. Add credentials to .env.local for live data.`);
}

// Only call createClient with real credentials; cast null so pages never need
// to handle undefined while still being guarded by SUPABASE_CONFIGURED checks.
export const supabase: SupabaseClient = SUPABASE_CONFIGURED
  ? createClient(rawUrl, rawKey)
  : (null as unknown as SupabaseClient);
