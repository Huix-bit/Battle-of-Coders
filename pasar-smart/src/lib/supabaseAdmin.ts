import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url        = (process.env.NEXT_PUBLIC_SUPABASE_URL         ?? "").trim();
const serviceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  ""
).trim();

/**
 * Admin client using the service-role key — bypasses Row Level Security.
 * Only used server-side (never sent to the browser).
 * Falls back to null when the key is not configured.
 */
export const supabaseAdmin: SupabaseClient | null =
  url && serviceKey
    ? createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export const ADMIN_CONFIGURED = supabaseAdmin !== null;
