import { useEffect, useEffectEvent, useState } from "react";

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

interface UnifiedAnalyticsData {
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
  page: { headline: string; subheadline: string };
  metricTabs: string[];
  insights: AnalyticsInsight[];
}

interface AnalyticsSummary {
  totalTransactions: number;
  totalRevenue: number;
  avgOrderValue: number;
}

interface UseAnalyticsDataReturn {
  hourlyData: HourlyDataPoint[];
  summary: AnalyticsSummary;
  categoryDataForSelectedHour: CategoryData[];
  selectedHour: number;
  setSelectedHour: (hour: number) => void;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  isMounted: boolean;
  page: { headline: string; subheadline: string };
  metricTabs: string[];
  insights: AnalyticsInsight[];
}

const EMPTY_PAGE = { headline: "📊 Analytics & Insights", subheadline: "" };
const FALLBACK_METRIC_TABS = ["Category", "Insights"];

export function useAnalyticsData(): UseAnalyticsDataReturn {
  const [analyticsData, setAnalyticsData] = useState<UnifiedAnalyticsData | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchUnifiedData = useEffectEvent(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics/unified");
      if (!res.ok) throw new Error("Failed to fetch analytics data");

      const data: UnifiedAnalyticsData = await res.json();
      setAnalyticsData(data);
      setLastRefresh(new Date(data.timestamp));

      if (!analyticsData && data.currentHour !== undefined) {
        setSelectedHour(data.currentHour);
      } else if (
        data.hourlyData.length > 0 &&
        (selectedHour < 0 || selectedHour >= data.hourlyData.length || !data.hourlyData[selectedHour])
      ) {
        setSelectedHour(Math.min(data.currentHour ?? 0, data.hourlyData.length - 1));
      }
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching unified analytics data:", err);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const mountedTimeout = window.setTimeout(() => {
      setIsMounted(true);
    }, 0);
    const initialFetch = window.setTimeout(() => {
      void fetchUnifiedData();
    }, 0);

    return () => {
      window.clearTimeout(mountedTimeout);
      window.clearTimeout(initialFetch);
    };
  }, []);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      void fetchUnifiedData();
    }, 3600000);

    return () => clearInterval(refreshInterval);
  }, []);

  const categoryDataForSelectedHour: CategoryData[] =
    analyticsData && analyticsData.categoryDataByHour[String(selectedHour)]
      ? analyticsData.categoryDataByHour[String(selectedHour)]
      : [];

  const summary: AnalyticsSummary = analyticsData?.summary ?? {
    totalTransactions: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  };

  const page = analyticsData?.page ?? EMPTY_PAGE;
  const metricTabs = analyticsData?.metricTabs ?? FALLBACK_METRIC_TABS;
  const insights = analyticsData?.insights ?? [];

  return {
    hourlyData: analyticsData?.hourlyData ?? [],
    summary,
    categoryDataForSelectedHour,
    selectedHour,
    setSelectedHour,
    loading,
    error,
    lastRefresh,
    isMounted,
    page,
    metricTabs,
    insights,
  };
}
