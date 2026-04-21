import { NextResponse } from "next/server";
import { buildMockUnifiedAnalytics } from "@/lib/mockData/unifiedAnalytics";

/**
 * Unified analytics for /admin/analytics.
 *
 * Data comes from `buildMockUnifiedAnalytics()` (editable mock “database” in
 * `src/lib/mockData/unifiedAnalytics.ts`). Optional env `MOCK_ANALYTICS_SEED` (integer)
 * makes numbers stable for demos and tests.
 *
 * When you wire real Supabase aggregates (e.g. `orders` / `vendor_analytics`),
 * branch here: if (!shouldUseMockData() && supabaseAdmin) { ... query ... }
 */
export async function GET() {
  try {
    const seedStr = process.env.MOCK_ANALYTICS_SEED;
    const parsed = seedStr != null && seedStr !== "" ? parseInt(seedStr, 10) : NaN;
    const seed = Number.isFinite(parsed) ? parsed : undefined;

    const data = buildMockUnifiedAnalytics(seed);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching unified analytics data:", error);
    return NextResponse.json(
      { error: "Failed to fetch unified analytics data" },
      { status: 500 }
    );
  }
}
