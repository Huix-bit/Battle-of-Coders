"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getVendorStallStatus, toggleStallPresence } from "@/actions/stallStatus";
import { getDailySalesSummary, getRecommendations } from "@/actions/analytics";
import { getActiveFlashSales } from "@/actions/sellingTools";

interface DashboardStats {
  totalSales: number;
  transactionCount: number;
  peakHour: number | null;
  avgTransactionValue: number;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
  return null;
}

const REC_ICONS: Record<string, string> = {
  pricing: "💰", positioning: "📍", bundling: "🎁", timing: "⏰", default: "🤖",
};

export function VendorDashboard({ marketId, vendorId: vendorIdProp }: { marketId: string; vendorId?: string }) {
  const [vendorId, setVendorId] = useState<string | null>(vendorIdProp ?? null);
  const [isPresent, setIsPresent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeFlashSales, setActiveFlashSales] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((c) => c + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  function flashTimeLeft(endIso: string): string {
    void tick;
    const ms = new Date(endIso).getTime() - Date.now();
    if (ms <= 0) return "Ended";
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")} left`;
  }

  useEffect(() => {
    // Read vendor ID from cookie; fall back to the prop if not in cookie.
    const id = getCookie("vendor-id") ?? vendorIdProp ?? null;
    setVendorId(id);

    const load = async () => {
      if (!id) {
        setDataLoading(false);
        return; // Don't fetch data if there's no vendor ID
      }

      setDataLoading(true);
      try {
        const status = await getVendorStallStatus(id, marketId);
        if (status) setIsPresent(status.is_present ?? false);
        const daily = await getDailySalesSummary(id, marketId);
        setStats({
          totalSales: daily.totalSales,
          transactionCount: daily.transactionCount,
          peakHour: daily.peakHour ? parseInt(daily.peakHour) : null,
          avgTransactionValue: daily.avgTransactionValue,
        });
        const recs = await getRecommendations(id);
        setRecommendations(recs.slice(0, 3));
        const flash = await getActiveFlashSales(id);
        setActiveFlashSales(flash);
      } catch (e) {
        console.error(e);
      } finally {
        setDataLoading(false);
      }
    };

    // Check if flash sale was just created
    if (typeof window !== 'undefined') {
      const flashCreated = sessionStorage.getItem('flashSaleCreated');
      if (flashCreated) {
        sessionStorage.removeItem('flashSaleCreated');
        // Refresh immediately if flash sale was just created
        load(); // Load data now, then continue to set up the interval
      }
    }

    load(); // Initial load
    const intervalId = setInterval(load, 30000); // Set up refresh interval
    return () => clearInterval(intervalId); // Clean up on unmount
  }, [marketId, refreshTrigger]);

  async function handleToggle() {
    if (!vendorId) {
      setToggleError("Vendor ID not found. Please sign out and sign back in.");
      return;
    }
    setLoading(true);
    setToggleError(null);
    try {
      const result = await toggleStallPresence(vendorId, marketId, `assign-${vendorId}-${marketId}`, !isPresent);
      if (result.success) {
        setIsPresent(!isPresent);
      } else {
        setToggleError(result.error ?? "Failed to update stall status. Please try again.");
      }
    } catch (e) {
      setToggleError(e instanceof Error ? e.message : "Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // If the vendorId cookie isn't set, we can't show the correct data.
  // This can happen if the user isn't logged in as a mock vendor.
  if (!vendorId && !dataLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
        <p className="text-lg font-semibold text-red-400">Vendor Not Found</p>
        <p className="mt-2 text-sm text-[var(--muted)]">Could not find a vendor ID in your session. Please try signing out and signing back in as a vendor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Toggle error banner ── */}
      {toggleError && (
        <div className="flex items-start gap-3 rounded-xl border border-[#E8342A]/40 bg-[#E8342A]/10 px-4 py-3 text-sm text-[#E8342A]">
          <span className="mt-0.5 shrink-0">✕</span>
          <span>{toggleError}</span>
          <button onClick={() => setToggleError(null)} className="ml-auto shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Status toggle card ── */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 ${
        isPresent
          ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 shadow-lg shadow-emerald-500/10"
          : "border-[var(--border)] bg-[var(--lifted)]"
      }`}>
        {isPresent && (
          <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
        )}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Stall Status</p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--text)]">
              {isPresent ? "🟢 Stall is Open" : "⚫ Closed"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {isPresent ? "Your stall is now visible to customers" : "Tap the button to open your stall"}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`relative h-16 w-36 shrink-0 rounded-2xl text-sm font-bold transition-all duration-300 disabled:opacity-60 ${
              isPresent
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-600"
                : "bg-transparent border-2 border-[var(--border)] text-[var(--muted)] hover:border-emerald-500/50 hover:text-emerald-400"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Updating
              </span>
            ) : isPresent ? (
              <div className="flex flex-col items-center justify-center gap-1">
                <span>✓ OPEN</span>
                <span className="text-[11px] font-normal">Tap to close</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1">
                <span>OPEN STALL</span>
                <span className="text-[11px] font-normal">Tap to open</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: "💰", label: "Today's Sales", value: dataLoading ? "—" : `RM ${(stats?.totalSales ?? 0).toFixed(2)}`, sub: "total revenue", accent: "text-amber-400" },
          { icon: "🛍️", label: "Transactions", value: dataLoading ? "—" : String(stats?.transactionCount ?? 0), sub: "orders completed", accent: "text-emerald-400" },
          { icon: "⏰", label: "Peak Hour", value: dataLoading ? "—" : (stats?.peakHour != null ? `${stats.peakHour}:00` : "20:00"), sub: "busiest window", accent: "text-purple-400" },
          { icon: "📊", label: "Avg. Order", value: dataLoading ? "—" : `RM ${(stats?.avgTransactionValue ?? 0).toFixed(2)}`, sub: "per transaction", accent: "text-pink-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5">
            <span className="text-2xl">{s.icon}</span>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.accent}`}>{s.value}</p>
            <p className="text-xs text-[var(--muted)]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Active flash sales ── */}
      {activeFlashSales.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h3 className="mb-4 font-semibold text-amber-400">⚡ Active Flash Sales</h3>
          <div className="space-y-3">
            {activeFlashSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--abyss)]/50 p-4">
                <div>
                  <p className="font-semibold text-[var(--text)]">{sale.item_id ? "Menu Item" : "Flash Deal"}</p>
                  <p className="text-sm text-[var(--muted)]">{sale.discount_percentage}% off</p>
                  <p className="mt-1 font-mono text-xs font-bold text-amber-300">{flashTimeLeft(sale.end_time)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-400">RM {Number(sale.discounted_price).toFixed(2)}</p>
                  <p className="text-xs text-[var(--muted)]">{sale.quantity_sold}/{sale.quantity || "∞"} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Recommendations ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-semibold text-[var(--accent-strong)]">🤖 AI Recommendations</h3>
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400">
            Live
          </span>
        </div>

        {dataLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--raised)]" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="space-y-3">
            {[
              { type: "pricing", title: "Adjust Mee Goreng price by +RM0.50", desc: "Neighbouring stalls charge RM7.00. You're under-pricing at RM6.50 — small increase unlikely to affect demand.", rationale: "Based on 14 nearby vendor prices" },
              { type: "bundling", title: "Bundle drinks with main dish", desc: "Customers who buy rice dishes also purchase drinks 78% of the time. Offer a RM1 discount on combos.", rationale: "Pattern from 3 weeks of transaction data" },
              { type: "timing", title: "Launch flash sale at 19:30", desc: "Traffic peaks at 20:00. A 15-minute flash sale at 19:30 draws early crowds and reduces your queue.", rationale: "Based on hourly heatmap data" },
            ].map((rec) => (
              <div key={rec.title} className="rounded-xl border border-[var(--border)] bg-[var(--raised)]/50 p-4">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <p className="font-semibold text-[var(--text)]">
                    {REC_ICONS[rec.type] ?? "🤖"} {rec.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                    {rec.type}
                  </span>
                </div>
                <p className="text-sm text-[var(--secondary)]">{rec.desc}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{rec.rationale}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--raised)]/50 p-4">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <p className="font-semibold text-[var(--text)]">{rec.title}</p>
                  <span className="shrink-0 rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400">{rec.type}</span>
                </div>
                <p className="text-sm text-[var(--secondary)]">{rec.description}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{rec.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <div className="flex flex-wrap gap-3">
        <Link href="/vendor/tools" className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-all hover:border-[var(--accent)]/40 hover:bg-[var(--raised)]">
          ⚡ Launch Flash Sale
        </Link>
        <Link href="/vendor/layout" className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-all hover:border-[var(--accent)]/40 hover:bg-[var(--raised)]">
          🗺️ Market Map {activeFlashSales.length > 0 ? "(flash on stall)" : ""}
        </Link>
      </div>
    </div>
  );
}
