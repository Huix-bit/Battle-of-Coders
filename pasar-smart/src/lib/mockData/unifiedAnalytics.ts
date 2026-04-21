/**
 * Mock "database" for /admin/analytics — all copy, tabs, insights, and series live here.
 * UI only renders what GET /api/analytics/unified returns.
 *
 * Optional: MOCK_ANALYTICS_SEED (integer) for stable numbers across refreshes.
 */

export interface HourlyDataPoint {
  hour: string;
  transactions: number;
  isPeakHour?: boolean;
}

export interface CategoryData {
  cat: string;
  transactions: number;
  revenue: number;
  pct: number;
  trend: string;
}

export type InsightType = "opportunity" | "insight" | "warning";

export interface AnalyticsInsight {
  icon: string;
  title: string;
  desc: string;
  type: InsightType;
}

export interface UnifiedAnalyticsResponse {
  success: boolean;
  currentHour: number;
  hourlyData: HourlyDataPoint[];
  categoryDataByHour: Record<string, CategoryData[]>;
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  timestamp: string;
  /** Page chrome from mock DB */
  page: {
    headline: string;
    subheadline: string;
  };
  metricTabs: string[];
  insights: AnalyticsInsight[];
}

/** ── Static mock rows (edit like seed data) ─────────────────────────────── */

export const MOCK_PAGE = {
  headline: "📊 Analytics & Insights",
  subheadline: "Aggregated data from all active night markets in Melaka",
} as const;

export const MOCK_METRIC_TABS = ["Category", "Insights"] as const;

export const MOCK_INSIGHTS: AnalyticsInsight[] = [
  {
    icon: "🔥",
    title: "Seafood revenue up 22%",
    desc: "Seafood stalls average RM 23.87 per transaction — highest of all categories. Consider allocating more prime zones.",
    type: "opportunity",
  },
  {
    icon: "⚡",
    title: "Flash sales drive 34% more traffic",
    desc: "Stalls with active flash deals see 34% higher footfall during 19:00–21:00 peak window.",
    type: "insight",
  },
  {
    icon: "⚠️",
    title: "Snacks & Kuih underperforming",
    desc: "These categories are down 2–5% vs last month. Relocating to higher-traffic zones could help.",
    type: "warning",
  },
  {
    icon: "📈",
    title: "Drinks demand peaks at 20:00",
    desc: "1,100 transactions for drinks vs 890 for grilled — but lower revenue per unit. High volume opportunity.",
    type: "insight",
  },
];

const BASE_HOURLY = [
  5, 8, 12, 18, 25, 35, 50, 65, 85, 110, 145, 180, 220, 260, 290, 320,
  350, 380, 420, 450, 490, 420, 320, 180,
];

const BASE_CATEGORIES = [
  { cat: "Grilled", variance: 1.0, revenueMultiplier: 13.93 },
  { cat: "Noodles", variance: 0.84, revenueMultiplier: 13.69 },
  { cat: "Seafood", variance: 0.7, revenueMultiplier: 23.87 },
  { cat: "Rice", variance: 0.65, revenueMultiplier: 13.1 },
  { cat: "Drinks", variance: 0.9, revenueMultiplier: 5.0 },
  { cat: "Kuih", variance: 0.38, revenueMultiplier: 9.41 },
  { cat: "Fruits", variance: 0.33, revenueMultiplier: 9.66 },
  { cat: "Snacks", variance: 0.24, revenueMultiplier: 8.57 },
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Full payload for GET /api/analytics/unified (admin analytics page).
 */
export function buildMockUnifiedAnalytics(seed?: number): UnifiedAnalyticsResponse {
  const rand = seed != null ? mulberry32(seed) : Math.random;

  const hourlyData: HourlyDataPoint[] = [];
  let peakHour = 0;
  let maxTxns = 0;

  BASE_HOURLY.forEach((txns, idx) => {
    const variance = rand() * 0.2 - 0.1;
    const adjustedTxns = Math.round(txns * (1 + variance));
    if (adjustedTxns > maxTxns) {
      maxTxns = adjustedTxns;
      peakHour = idx;
    }
    hourlyData.push({
      hour: `${String(idx).padStart(2, "0")}:00`,
      transactions: adjustedTxns,
      isPeakHour: idx === peakHour,
    });
  });

  const categoryDataByHour: Record<string, CategoryData[]> = {};

  hourlyData.forEach((hourData, hourIdx) => {
    const categoryData: CategoryData[] = BASE_CATEGORIES.map((baseCat) => {
      const hourIntensity = hourData.transactions / 490;
      const categoryTxns = Math.round(
        (hourIntensity * baseCat.variance * 100 * rand()) / 0.7
      );
      const revenue = Math.round(categoryTxns * baseCat.revenueMultiplier * 100) / 100;
      return {
        cat: baseCat.cat,
        transactions: categoryTxns,
        revenue,
        pct: Math.round(categoryTxns * 10),
        trend: rand() > 0.5 ? "+12%" : "-5%",
      };
    });
    categoryDataByHour[String(hourIdx)] = categoryData;
  });

  const totalTransactions = hourlyData.reduce((s, h) => s + h.transactions, 0);
  const totalRevenue =
    Math.round(
      Object.values(categoryDataByHour)
        .flat()
        .reduce((sum, c) => sum + c.revenue, 0) * 100
    ) / 100;
  const avgOrderValue =
    totalTransactions > 0 ? Math.round((totalRevenue / totalTransactions) * 100) / 100 : 0;

  return {
    success: true,
    currentHour: new Date().getHours(),
    hourlyData,
    categoryDataByHour,
    summary: {
      totalTransactions,
      totalRevenue,
      avgOrderValue,
    },
    timestamp: new Date().toISOString(),
    page: { ...MOCK_PAGE },
    metricTabs: [...MOCK_METRIC_TABS],
    insights: MOCK_INSIGHTS.map((i) => ({ ...i })),
  };
}

/** Hourly series only — for legacy /api/analytics/hourly-transactions */
export function buildMockHourlyTransactions(seed?: number): HourlyDataPoint[] {
  return buildMockUnifiedAnalytics(seed).hourlyData;
}
