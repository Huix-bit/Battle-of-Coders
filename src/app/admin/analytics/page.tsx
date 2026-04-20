"use client";
import Link from "next/link";
import { useState } from "react";

const CATEGORY_DATA = [
  { cat: "Grilled",  txns: 890, revenue: 12400, pct: 100, trend: "+15%" },
  { cat: "Noodles",  txns: 745, revenue: 10200, pct: 84,  trend: "+8%"  },
  { cat: "Seafood",  txns: 620, revenue: 14800, pct: 70,  trend: "+22%" },
  { cat: "Rice",     txns: 580, revenue: 7600,  pct: 65,  trend: "+5%"  },
  { cat: "Drinks",   txns: 1100,revenue: 5500,  pct: 90,  trend: "+18%" },
  { cat: "Kuih",     txns: 340, revenue: 3200,  pct: 38,  trend: "-2%"  },
  { cat: "Fruits",   txns: 290, revenue: 2800,  pct: 33,  trend: "+3%"  },
  { cat: "Snacks",   txns: 210, revenue: 1800,  pct: 24,  trend: "-5%"  },
];

const PEAK_HOURS = [
  { h: "17", txns: 45 },{ h: "18", txns: 120 },{ h: "19", txns: 280 },
  { h: "20", txns: 490 },{ h: "21", txns: 420 },{ h: "22", txns: 260 },{ h: "23", txns: 110 },
];
const maxTxns = Math.max(...PEAK_HOURS.map((h) => h.txns));

const TOP_VENDORS = [
  { name: "Ikan Bakar Hamidah", cat: "Seafood", txns: 501, rev: "RM 4,820", rating: 4.9, trend: "↑" },
  { name: "Cendol Pak Din",     cat: "Drinks",  txns: 445, rev: "RM 2,225", rating: 4.9, trend: "↑" },
  { name: "Satay Jamilah",      cat: "Grilled", txns: 389, rev: "RM 3,200", rating: 4.8, trend: "↑" },
  { name: "Mee Goreng Haji Ali",cat: "Noodles", txns: 312, rev: "RM 2,184", rating: 4.8, trend: "→" },
  { name: "Ayam Percik Siti",   cat: "Grilled", txns: 189, rev: "RM 2,268", rating: 4.7, trend: "↑" },
];

const INSIGHTS = [
  { icon: "🔥", title: "Seafood revenue up 22%", desc: "Seafood stalls average RM 23.87 per transaction — highest of all categories. Consider allocating more prime zones.", type: "opportunity" },
  { icon: "⚡", title: "Flash sales drive 34% more traffic", desc: "Stalls with active flash deals see 34% higher footfall during 19:00–21:00 peak window.", type: "insight" },
  { icon: "⚠️", title: "Snacks & Kuih underperforming", desc: "These categories are down 2–5% vs last month. Relocating to higher-traffic zones could help.", type: "warning" },
  { icon: "📈", title: "Drinks demand peaks at 20:00", desc: "1,100 transactions for drinks vs 890 for grilled — but lower revenue per unit. High volume opportunity.", type: "insight" },
];

const METRIC_TABS = ["Category", "Vendors", "Insights"];

export default function AnalyticsPage() {
  const [tab, setTab] = useState("Category");
  const [metricType, setMetricType] = useState<"txns" | "revenue">("txns");

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/admin" className="hover:text-[var(--text)]">Admin</Link><span>/</span>
        <span className="text-[var(--text)]">Analytics</span>
      </div>
      <div><h1 className="text-2xl font-bold text-[var(--text)]">📊 Analytics & Insights</h1><p className="text-sm text-[var(--muted)]">Aggregated data from all active night markets in Melaka</p></div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Transactions", value: "4,775", trend: "+12% MTD", icon: "💳", accent: "text-violet-400" },
          { label: "Est. Revenue", value: "RM 58,325", trend: "+9% MTD", icon: "💰", accent: "text-[var(--accent)]" },
          { label: "Avg. Order Value", value: "RM 12.20", trend: "+3% MTD", icon: "📊", accent: "text-emerald-400" },
          { label: "Peak Hour", value: "20:00", trend: "490 txns/hr", icon: "⏰", accent: "text-pink-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4">
            <span className="text-xl">{s.icon}</span>
            <p className={`mt-1 text-xl font-bold ${s.accent}`}>{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{s.label}</p>
            <p className="text-[10px] text-emerald-400">{s.trend}</p>
          </div>
        ))}
      </div>

      {/* Peak hours chart */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6">
        <h3 className="mb-5 font-semibold text-[var(--accent-strong)]">⏰ Transactions by Hour</h3>
        <div className="flex items-end gap-2 h-36">
          {PEAK_HOURS.map((h) => (
            <div key={h.h} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-[var(--muted)]">{h.txns}</span>
              <div className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400" style={{ height: `${(h.txns / maxTxns) * 100}%`, opacity: 0.3 + (h.txns / maxTxns) * 0.7 }} />
              <span className="text-[10px] text-[var(--muted)]">{h.h}:00</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">20:00 is the peak hour across all markets. Flash sales recommended 30 min before peak.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--abyss)] p-1">
        {METRIC_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${tab === t ? "bg-[var(--raised)] text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>{t}</button>
        ))}
      </div>

      {/* Category performance */}
      {tab === "Category" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setMetricType("txns")} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${metricType === "txns" ? "bg-violet-500 text-white" : "border border-[var(--border)] text-[var(--muted)]"}`}>By Transactions</button>
            <button onClick={() => setMetricType("revenue")} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${metricType === "revenue" ? "bg-violet-500 text-white" : "border border-[var(--border)] text-[var(--muted)]"}`}>By Revenue</button>
          </div>
          <div className="space-y-3">
            {[...CATEGORY_DATA].sort((a, b) => metricType === "txns" ? b.txns - a.txns : b.revenue - a.revenue).map((c) => {
              const val = metricType === "txns" ? c.txns : c.revenue;
              const max = metricType === "txns" ? 1100 : 14800;
              return (
                <div key={c.cat} className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-[var(--text)]">{c.cat}</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${c.trend.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{c.trend}</span>
                      <p className="text-sm font-bold text-[var(--accent)]">{metricType === "txns" ? c.txns + " txns" : "RM " + c.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--raised)] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700" style={{ width: `${(val / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top vendors */}
      {tab === "Vendors" && (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--lifted)]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[var(--border)] text-left text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <th className="px-4 py-3">#</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Transactions</th><th className="px-4 py-3">Revenue</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Trend</th>
            </tr></thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {TOP_VENDORS.map((v, i) => (
                <tr key={v.name} className="hover:bg-[var(--raised)] transition-colors">
                  <td className="px-4 py-3 text-[var(--muted)]">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text)]">{v.name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{v.cat}</td>
                  <td className="px-4 py-3 tabular-nums text-[var(--secondary)]">{v.txns}</td>
                  <td className="px-4 py-3 font-bold text-[var(--accent)]">{v.rev}</td>
                  <td className="px-4 py-3 text-amber-400">⭐ {v.rating}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">{v.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Insights */}
      {tab === "Insights" && (
        <div className="space-y-4">
          {INSIGHTS.map((ins) => (
            <div key={ins.title} className={`rounded-2xl border p-5 ${ins.type === "warning" ? "border-amber-400/30 bg-amber-400/5" : ins.type === "opportunity" ? "border-emerald-400/30 bg-emerald-400/5" : "border-[var(--border)] bg-[var(--lifted)]"}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{ins.icon}</span>
                <div>
                  <p className="font-bold text-[var(--text)]">{ins.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{ins.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
