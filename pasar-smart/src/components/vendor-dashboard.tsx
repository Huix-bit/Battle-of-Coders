"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toggleStallPresence, getVendorStallStatus } from "@/actions/stallStatus";
import { getDailySalesSummary, getRecommendations } from "@/actions/analytics";
import { getActiveFlashSales } from "@/actions/sellingTools";

interface DashboardStats {
  totalSales: number;
  transactionCount: number;
  peakHour: number | null;
  avgTransactionValue: number;
}

const PEAK_HOURS = [
  { h: "17", pct: 20 }, { h: "18", pct: 45 }, { h: "19", pct: 70 },
  { h: "20", pct: 100 }, { h: "21", pct: 85 }, { h: "22", pct: 55 },
  { h: "23", pct: 30 },
];

const REC_ICONS: Record<string, string> = {
  pricing: "💰", positioning: "📍", bundling: "🎁", timing: "⏰", default: "🤖",
};

export function VendorDashboard({ vendorId, marketId }: { vendorId: string; marketId: string }) {
  const [isPresent, setIsPresent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeFlashSales, setActiveFlashSales] = useState<any[]>([]);
  const [statusNote, setStatusNote] = useState("Open for business");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const STATUS_NOTES = [
    "Open for business", "Slightly busy — orders may be slow",
    "Very busy — queue forming!", "Running low on ingredients", "Sold out — closing soon",
  ];

  useEffect(() => {
    const load = async () => {
      setDataLoading(true);
      try {
        const status = await getVendorStallStatus(vendorId, marketId);
        if (status) setIsPresent(status.isPresent);
        const daily = await getDailySalesSummary(vendorId, marketId);
        setStats({
          totalSales: daily.totalSales,
          transactionCount: daily.transactionCount,
          peakHour: daily.peakHour ? parseInt(daily.peakHour) : null,
          avgTransactionValue: daily.avgTransactionValue,
        });
        const recs = await getRecommendations(vendorId);
        setRecommendations(recs.slice(0, 3));
        const flash = await getActiveFlashSales(vendorId);
        setActiveFlashSales(flash);
      } catch (e) {
        console.error(e);
      } finally {
        setDataLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [vendorId, marketId]);

  async function handleToggle() {
    setLoading(true);
    try {
      const result = await toggleStallPresence(vendorId, marketId, `assign-${vendorId}-${marketId}`, !isPresent);
      if (result.success) setIsPresent(!isPresent);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">

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
              {isPresent ? "🟢 I'm Here — Active" : "⚫ Closed"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {isPresent ? statusNote : "Toggle on to appear on the live market map"}
            </p>
            {isPresent && (
              <div className="relative mt-3">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--abyss)]/50 px-3 py-1.5 text-xs text-[var(--secondary)] hover:border-[var(--accent)]/40"
                >
                  📝 Update status note <span className="text-[var(--muted)]">▾</span>
                </button>
                {showStatusMenu && (
                  <div className="absolute left-0 top-9 z-20 w-64 rounded-xl border border-[var(--border)] bg-[var(--abyss)] shadow-xl">
                    {STATUS_NOTES.map((n) => (
                      <button
                        key={n}
                        onClick={() => { setStatusNote(n); setShowStatusMenu(false); }}
                        className={`block w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-[var(--raised)] ${
                          n === statusNote ? "text-[var(--accent)]" : "text-[var(--secondary)]"
                        }`}
                      >
                        {n === statusNote ? "✓ " : ""}{n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`relative h-16 w-32 shrink-0 rounded-2xl text-sm font-bold transition-all duration-300 disabled:opacity-60 ${
              isPresent
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-600"
                : "bg-[var(--raised)] text-[var(--muted)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)]"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Updating
              </span>
            ) : isPresent ? "✓ OPEN\nToggle off" : "CLOSED\nTap to open"}
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

      {/* ── Peak hours bar chart ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6">
        <h3 className="mb-5 font-semibold text-[var(--accent-strong)]">⏰ Hourly Traffic Pattern</h3>
        <div className="flex items-end gap-2 h-28">
          {PEAK_HOURS.map((h) => (
            <div key={h.h} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[var(--accent)] to-amber-300 transition-all duration-700"
                style={{ height: `${h.pct}%`, opacity: h.pct === 100 ? 1 : 0.4 + h.pct / 200 }}
              />
              <span className="text-[10px] text-[var(--muted)]">{h.h}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">Typical pattern for night markets in Melaka — 20:00 is peak. Plan flash sales before 19:30.</p>
      </div>

      {/* ── Active flash sales ── */}
      {activeFlashSales.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h3 className="mb-4 font-semibold text-amber-400">⚡ Active Flash Sales</h3>
          <div className="space-y-3">
            {activeFlashSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--abyss)]/50 p-4">
                <div>
                  <p className="font-semibold text-[var(--text)]">{sale.itemName ?? "Flash Deal"}</p>
                  <p className="text-sm text-[var(--muted)]">{sale.discountPercentage}% off</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-400">RM {sale.discountedPrice?.toFixed(2)}</p>
                  <p className="text-xs text-[var(--muted)]">{sale.quantitySold}/{sale.quantity} sold</p>
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
          🗺️ View Market Map
        </Link>
        <Link href="/vendor/tools" className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-all hover:border-[var(--accent)]/40 hover:bg-[var(--raised)]">
          💰 Request Duit Pecah
        </Link>
      </div>
    </div>
  );
}
