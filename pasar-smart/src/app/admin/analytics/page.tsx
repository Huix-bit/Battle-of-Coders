"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnalyticsSummary from "@/components/analytics-summary";
import TransactionsByHourChart from "@/components/transactions-by-hour-chart";
import { useAnalyticsData, type HourlyDataPoint } from "@/hooks/useAnalyticsData";

function getPeakHours(hourlyData: HourlyDataPoint[]) {
  const peakHour = hourlyData.reduce<HourlyDataPoint | null>((currentPeak, point) => {
    if (!currentPeak || point.transactions > currentPeak.transactions) {
      return point;
    }
    return currentPeak;
  }, null);

  if (!peakHour) return [];
  return hourlyData.filter((point) => point.transactions === peakHour.transactions);
}

export default function AnalyticsPage() {
  const {
    hourlyData,
    summary,
    categoryDataForSelectedHour,
    selectedHour,
    setSelectedHour,
    loading: dataLoading,
    lastRefresh,
    isMounted,
    page,
    metricTabs,
    insights,
  } = useAnalyticsData();

  const [tab, setTab] = useState(metricTabs[0] ?? "Category");
  const [metricType, setMetricType] = useState<"txns" | "revenue">("txns");

  useEffect(() => {
    if (metricTabs.length && !metricTabs.includes(tab)) {
      setTab(metricTabs[0]);
    }
  }, [metricTabs, tab]);

  const peakHours = getPeakHours(hourlyData);
  const peakHour = peakHours[0];
  const hasPeakTie = peakHours.length > 1;
  const hourlyDataWithPeakState = hourlyData.map((point) => ({
    ...point,
    isPeakHour: peakHours.some((peakPoint) => peakPoint.hour === point.hour),
  }));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/admin" className="hover:text-[var(--text)]">
          Admin
        </Link>
        <span>/</span>
        <span className="text-[var(--text)]">Analytics</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">{page.headline}</h1>
        <p className="text-sm text-[var(--muted)]">{page.subheadline}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnalyticsSummary summary={summary} />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4">
          <span className="text-xl">⏰</span>
          <p className="mt-1 text-xl font-bold text-pink-400">
            {peakHour?.hour ?? "--:--"}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Peak Hour
          </p>
          <p className="text-[10px] text-emerald-400">
            {peakHour
              ? `${peakHour.transactions} txns/hr${hasPeakTie ? " (tie)" : ""}`
              : "Waiting for data"}
          </p>
        </div>
      </div>

      <TransactionsByHourChart
        data={hourlyDataWithPeakState}
        peakHours={peakHours}
        selectedHour={selectedHour}
        onHourHover={setSelectedHour}
        loading={dataLoading}
        lastRefresh={lastRefresh}
        isMounted={isMounted}
      />

      <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--abyss)] p-1">
        {metricTabs.map((tabName) => (
          <button
            key={tabName}
            type="button"
            onClick={() => setTab(tabName)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${tab === tabName ? "bg-[var(--raised)] text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
          >
            {tabName}
          </button>
        ))}
      </div>

      {tab === metricTabs[0] && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMetricType("txns")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${metricType === "txns" ? "bg-violet-500 text-white" : "border border-[var(--border)] text-[var(--muted)]"}`}
              >
                By Transactions
              </button>
              <button
                type="button"
                onClick={() => setMetricType("revenue")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${metricType === "revenue" ? "bg-violet-500 text-white" : "border border-[var(--border)] text-[var(--muted)]"}`}
              >
                By Revenue
              </button>
            </div>
            {isMounted && (
              <p className="text-xs text-[var(--muted)]">
                📊 Data for{" "}
                <span className="font-semibold text-[var(--accent)]">
                  {String(selectedHour).padStart(2, "0")}:00
                </span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            {categoryDataForSelectedHour.length > 0 ? (
              [...categoryDataForSelectedHour]
                .sort((a, b) =>
                  metricType === "txns"
                    ? b.transactions - a.transactions
                    : b.revenue - a.revenue
                )
                .map((category) => {
                  const value =
                    metricType === "txns" ? category.transactions : category.revenue;
                  const maxValue =
                    metricType === "txns"
                      ? Math.max(
                          ...categoryDataForSelectedHour.map((item) => item.transactions),
                          1
                        )
                      : Math.max(
                          ...categoryDataForSelectedHour.map((item) => item.revenue),
                          1
                        );

                  return (
                    <div
                      key={category.cat}
                      className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold text-[var(--text)]">{category.cat}</p>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-bold ${category.trend.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {category.trend}
                          </span>
                          <p className="text-sm font-bold text-[var(--accent)]">
                            {metricType === "txns"
                              ? `${value || 0} txns`
                              : `RM ${(value || 0).toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--raised)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500 ease-out"
                          style={{ width: `${(value / maxValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] p-6 text-center">
                <p className="text-sm text-[var(--muted)]">
                  Loading category data for selected hour...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {metricTabs[1] && tab === metricTabs[1] && (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.title}
              className={`rounded-2xl border p-5 ${insight.type === "warning" ? "border-amber-400/30 bg-amber-400/5" : insight.type === "opportunity" ? "border-emerald-400/30 bg-emerald-400/5" : "border-[var(--border)] bg-[var(--lifted)]"}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <div>
                  <p className="font-bold text-[var(--text)]">{insight.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{insight.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
