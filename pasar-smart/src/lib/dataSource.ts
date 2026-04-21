/**
 * Central switch for “real Supabase” vs mock fixtures across the app.
 *
 * Usage in API routes / server actions:
 *   import { shouldUseMockData } from "@/lib/dataSource";
 *   if (shouldUseMockData()) return mockResponse;
 *
 * .env.local:
 *   USE_MOCK_DATA=true     → prefer mocks even if Supabase is configured (demos / offline)
 *   (omit)                 → use real DB when credentials exist; mocks only where you branch explicitly
 */
export function shouldUseMockData(): boolean {
  return process.env.USE_MOCK_DATA === "true" || process.env.USE_MOCK_DATA === "1";
}
