"use client";
import Link from "next/link";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────
//  STALL MAP DATA (Mock for visualization)
// ─────────────────────────────────────────────────────────────
const STALLS = [
  // Row 1 - Hot Zone (Gold/Orange)
  { id: "A1", name: "Nasi Lemak", status: "active", temp: "hot", revenue: "RM 420" },
  { id: "A2", name: "Satay", status: "active", temp: "hot", revenue: "RM 380" },
  { id: "A3", name: "Roti Canai", status: "active", temp: "hot", revenue: "RM 290" },
  { id: "A4", name: "Mee Goreng", status: "active", temp: "hot", revenue: "RM 350" },
  // Row 2 - Neutral Zone
  { id: "B1", name: "Air Sirap", status: "active", temp: "neutral", revenue: "RM 180" },
  { id: "B2", name: "Popcorn", status: "active", temp: "neutral", revenue: "RM 150" },
  { id: "B3", name: "Keropok", status: "active", temp: "neutral", revenue: "RM 120" },
  { id: "B4", name: "Teh Tarik", status: "active", temp: "neutral", revenue: "RM 200" },
  // Row 3 - Cold Zone (Neon Blue)
  { id: "C1", name: "Ice Cream", status: "active", temp: "cold", revenue: "RM 90" },
  { id: "C2", name: "Cendol", status: "active", temp: "cold", revenue: "RM 85" },
  { id: "C3", name: "ABC", status: "inactive", temp: "cold", revenue: "RM 0" },
  { id: "C4", name: "Jus Limau", status: "active", temp: "cold", revenue: "RM 110" },
];

// ─────────────────────────────────────────────────────────────
//  STATS DATA
// ─────────────────────────────────────────────────────────────
const STATS = [
  { label: "Active Vendors", value: "38", trend: "+3", unit: "vs yesterday" },
  { label: "Market Coverage", value: "84%", trend: "92%", unit: "stalls filled" },
  { label: "Crowd Index", value: "Moderate", trend: "Peak", unit: "in 40 min" },
  { label: "Revenue Est.", value: "RM 4,820", trend: "+12%", unit: "vs avg" },
];

// ─────────────────────────────────────────────────────────────
//  AUTO-HEALING SUGGESTIONS
// ─────────────────────────────────────────────────────────────
const AUTO_HEAL = [
  { type: "move", from: "C3", to: "B2", reason: "Low traffic → high demand zone", impact: "+RM 80" },
  { type: "alert", zone: "A4", reason: "Unusual order spike detected", impact: "Check inventory" },
  { type: "optimize", suggestion: "Rotate B1 to A1 during peak hours", impact: "+15% revenue" },
];

export default function AdminPage() {
  const [hoveredStall, setHoveredStall] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0D0A1F] text-white font-sans">
      {/* ─────────────────────────────────────────────────────
          HEADER SECTION
      ───────────────────────────────────────────────────── */}
      <header className="border-b border-white/5 bg-[#120B30]/60 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400/80">Admin Panel</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Night Market Command Center</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/monitor" className="rounded-lg bg-blue-500/20 border border-blue-500/30 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/30 transition-colors">
                📡 Live Monitor
              </Link>
              <Link href="/admin/analytics" className="rounded-lg bg-violet-500/20 border border-violet-500/30 px-4 py-2 text-sm font-medium text-violet-400 hover:bg-violet-500/30 transition-colors">
                📊 Analytics
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-8 py-10 space-y-12">
        {/* ─────────────────────────────────────────────────────
            STATS ROW - Slimmed horizontal bar
        ───────────────────────────────────────────────────── */}
        <section className="grid grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div 
              key={stat.label} 
              className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-[#1A1060]/60 to-[#120B30]/40 p-5"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">{stat.label}</p>
              <p className="mt-2 text-3xl font-light text-white">{stat.value}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-xs font-semibold ${stat.trend.includes('+') ? 'text-emerald-400' : stat.trend === 'Peak' ? 'text-amber-400' : 'text-white/60'}`}>
                  {stat.trend}
                </span>
                <span className="text-xs text-white/30">{stat.unit}</span>
              </div>
            </div>
          ))}
        </section>

        {/* ─────────────────────────────────────────────────────
            MAIN CONTENT GRID - 16:9 Layout
        ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-10">
          
          {/* ── STALL MAP (Expanded) ── */}
          <div className="col-span-9 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white/80">Stall Distribution Map</h2>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,166,35,0.5)]" />
                  <span className="text-white/50">Hot Zone</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-white/20" />
                  <span className="text-white/50">Neutral</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
                  <span className="text-white/50">Cold Zone</span>
                </span>
              </div>
            </div>

            {/* STALL GRID - Increased gutters, rounded corners, glow */}
            <div className="grid grid-cols-4 gap-6">
              {STALLS.map((stall, i) => {
                const isHot = stall.temp === "hot";
                const isCold = stall.temp === "cold";
                const isHovered = hoveredStall === stall.id;
                
                return (
                  <button
                    key={stall.id}
                    onMouseEnter={() => setHoveredStall(stall.id)}
                    onMouseLeave={() => setHoveredStall(null)}
                    className={`
                      relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300
                      ${isHot 
                        ? 'border-amber-500/30 bg-gradient-to-br from-amber-900/30 to-orange-900/20' 
                        : isCold 
                          ? 'border-cyan-500/30 bg-gradient-to-br from-cyan-900/30 to-blue-900/20'
                          : 'border-white/10 bg-white/5'
                      }
                      ${isHovered ? 'scale-[1.02] shadow-2xl' : 'hover:border-white/20 hover:bg-white/10'}
                      ${isHot ? (isHovered ? 'shadow-[0_0_30px_rgba(245,166,35,0.3)]' : 'shadow-[0_0_20px_rgba(245,166,35,0.1)]') : ''}
                      ${isCold ? (isHovered ? 'shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'shadow-[0_0_20px_rgba(34,211,238,0.1)]') : ''}
                    `}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Glow effect for hot/cold */}
                    {isHot && <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl" />}
                    {isCold && <div className="absolute -top-10 -right-10 w-20 h-20 bg-cyan-400/20 rounded-full blur-2xl" />}
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/30">{stall.id}</span>
                        <span className={`
                          w-2 h-2 rounded-full shadow-lg
                          ${stall.status === 'active' 
                            ? (isHot ? 'bg-amber-400 shadow-amber-400/50' : isCold ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-emerald-400')
                            : 'bg-red-500'
                          }
                        `} />
                      </div>
                      <p className="mt-4 text-sm font-medium text-white">{stall.name}</p>
                      <p className="mt-1 text-xs text-white/40">{stall.revenue}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* LEGEND & ACTIONS */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-white/30">12 stalls • 9 active • 3 zones</p>
              <Link href="/admin/layout" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Optimize Layout →
              </Link>
            </div>
          </div>

          {/* ── AUTO-HEALING SIDEBAR (Glassmorphism) ── */}
          <div className="col-span-3">
            <div className="sticky top-8">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl">
                {/* Glassmorphism gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-amber-500/30 border border-white/10">
                      <span className="text-lg">🔮</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Auto-Healing</h3>
                      <p className="text-xs text-white/40">AI Suggestions</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {AUTO_HEAL.map((item, i) => (
                      <div 
                        key={i}
                        className="rounded-xl border border-white/8 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-medium text-white/80">
                              {item.type === 'move' && `Move ${item.from} → ${item.to}`}
                              {item.type === 'alert' && `Alert: ${item.zone}`}
                              {item.type === 'optimize' && 'Optimization'}
                            </p>
                            <p className="mt-1 text-xs text-white/40">{item.reason}</p>
                          </div>
                          <span className="text-xs font-semibold text-emerald-400">{item.impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-amber-600 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                    Apply Suggestions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────
            MODULE LINKS - Minimal row
        ───────────────────────────────────────────────────── */}
        <section className="border-t border-white/5 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white/60">Quick Access</h2>
          </div>
          <div className="grid grid-cols-6 gap-4">
            {[
              { icon: "📡", label: "Monitor", href: "/admin/monitor", color: "blue" },
              { icon: "📊", label: "Analytics", href: "/admin/analytics", color: "violet" },
              { icon: "🗺️", label: "Layout", href: "/admin/layout", color: "amber" },
              { icon: "👤", label: "Vendors", href: "/penjaja", color: "emerald" },
              { icon: "📅", label: "Schedule", href: "/jadual", color: "cyan" },
              { icon: "📋", label: "Reports", href: "/laporan", color: "pink" },
            ].map((mod) => (
              <Link 
                key={mod.label}
                href={mod.href}
                className={`
                  group flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5 
                  hover:bg-white/[0.06] hover:border-white/10 transition-all
                `}
              >
                <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">{mod.icon}</span>
                <span className="text-xs font-medium text-white/50 group-hover:text-white/80 transition-colors">{mod.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
