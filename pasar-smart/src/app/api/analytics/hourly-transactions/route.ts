import { NextResponse } from "next/server";
import { buildMockHourlyTransactions } from "@/lib/mockData/unifiedAnalytics";

export async function GET() {
  try {
    const seedStr = process.env.MOCK_ANALYTICS_SEED;
    const parsed = seedStr != null && seedStr !== "" ? parseInt(seedStr, 10) : NaN;
    const seed = Number.isFinite(parsed) ? parsed : undefined;

    const hourlyData = buildMockHourlyTransactions(seed);

    return NextResponse.json({
      success: true,
      data: hourlyData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching hourly transaction data:", error);
    return NextResponse.json(
      { error: "Failed to fetch hourly transaction data" },
      { status: 500 }
    );
  }
}
