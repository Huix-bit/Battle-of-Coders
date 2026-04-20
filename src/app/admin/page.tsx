"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const LOOP_STEPS = [
  { step: "01", icon: "📡", title: "Monitor", subtitle: "Real-Time Visibility", desc: "Live dashboard tracking active vendors, crowd density, and stall attendance — eliminating phantom stalls.", href: "/admin/monitor", cta: "Open Monitor →", color: "from-blue-500/20 to-indigo-500/20", border: "border-blue-500/40" },
  { step: "02", icon: "📊", title: "Analyze", subtitle: "Data & Insights", desc: "Aggregate transaction and behavioral data to surface top categories, peak hours, and market trends.", href: "/admin/analytics", cta: "View Analytics →", color: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/40" },
  { step: "03", icon: "🗺️", title: "Optimize", subtitle: "Layout & Flow", desc: "Identify congestion hotspots and dead zones. AI auto-healing suggests stall reassignments for balanced traffic.", href: "/admin/layout", cta: "Layout Optimizer →", color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/40" },
  { step: "04", icon: "🔮", title: "Govern", subtitle: "Smart Governance", desc: "Close the loop with predictive insights and data-driven decisions that continuously improve market performance.", href: "/admin/analytics", cta: "View Reports →", color: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/40" },
];

const MODULES = [
  { icon: "📡", title: "Real-Time Monitor", desc: "Live vendor count, crowd density, attendance verification, and phantom stall detection.", href: "/admin/monitor", accent: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: "📊", title: "Analytics & Insights", desc: "Category rankings, peak hour charts, and market trend analysis across all districts.", href: "/admin/analytics", accent: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: "🗺️", title: "Layout Optimizer", desc: "Crowd-flow heatmap, congestion zones, and auto-healing stall reassignment suggestions.", href: "/admin/layout", accent: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: "👤", title: "Vendor Management", desc: "Full CRUD control over vendor records, fees, and status transitions.", href: "/penjaja", accent: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: "📅", title: "Market Schedule", desc: "Manage night market schedules, sites, and district assignments.", href: "/jadual", accent: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: "📋", title: "Business Reports", desc: "Aggregated summaries and CSV exports by district for external analysis.", href: "/laporan", accent: "text-pink-400", bg: "bg-pink-500/10" },
];

const LIVE = [
  { label: "Active Vendors", value: "38", trend: "+3 vs yesterday", up: true, icon: "👤" },
  { label: "Market Coverage", value: "84%", trend: "stalls occupied", up: true, icon: "🏪" },
  { label: "Crowd Index", value: "Moderate", trend: "peak in 40 min", up: null, icon: "👥" },
  { label: "Revenue Est.", value: "RM 4,820", trend: "+12% vs avg", up: true, icon: "💰" },
];

export default function AdminPage() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((s) => (s + 1) % LOOP_STEPS.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-14 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#1a1060_0%,_transparent_60%)]" />
        <div className="pointer-events-none absolute -top-10 -left-10 h-52 w-52 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <p className="inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Admin Panel</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight text-[var(--text)] sm:text-4xl">Command center for Melaka's night markets</h1>
        <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">Monitor live vendor activity, analyze market trends, optimize stall layouts, and govern with real-time data.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/admin/monitor" className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:bg-blue-400">📡 Live Monitor</Link>
          <Link href="/admin/analytics" className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--text)] transition-all hover:scale-105 hover:bg-[var(--surface)]">📊 Analytics</Link>
          <Link href="/admin/layout" className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--text)] transition-all hover:scale-105 hover:bg-[var(--surface)]">🗺️ Layout</Link>
        </div>
      </section>

      {/* Live KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LIVE.map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4">
            <span className="text-xl">{s.icon}</span>
            <p className="mt-2 text-xl font-bold text-[var(--accent)]">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{s.label}</p>
            <p className={`text-[10px] ${s.up === true ? "text-emerald-400" : s.up === false ? "text-red-400" : "text-[var(--muted)]"}`}>
              {s.up === true ? "↑" : s.up === false ? "↓" : ""} {s.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Admin Loop */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--accent-strong)]">The Admin Loop</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">A continuous governance cycle powered by real-time data</p>
        </div>
        <div className="flex items-center justify-center gap-0">
          {LOOP_STEPS.map((s, i) => (
            <button key={s.step} onClick={() => setActive(i)} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${i === active ? "bg-blue-500 text-white scale-110" : "bg-[var(--raised)] text-[var(--muted)]"}`}>{s.step}</div>
              {i < LOOP_STEPS.length - 1 && <div className={`h-0.5 w-12 sm:w-20 transition-colors duration-300 ${i < active ? "bg-blue-500" : "bg-[var(--border)]"}`} />}
            </button>
          ))}
          <div className="ml-2 text-[var(--muted)] text-sm">↩</div>
        </div>
        <div className={`rounded-2xl border bg-gradient-to-br ${LOOP_STEPS[active].color} ${LOOP_STEPS[active].border} p-8 shadow-xl transition-all duration-500`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--abyss)]/50 text-5xl">{LOOP_STEPS[active].icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Step {LOOP_STEPS[active].step}</span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-400">{LOOP_STEPS[active].subtitle}</span>
              </div>
              <h3 className="mt-1 text-2xl font-bold text-[var(--text)]">{LOOP_STEPS[active].title}</h3>
              <p className="mt-2 max-w-lg text-[var(--muted)]">{LOOP_STEPS[active].desc}</p>
            </div>
            <Link href={LOOP_STEPS[active].href} className="shrink-0 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90">{LOOP_STEPS[active].cta}</Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP_STEPS.map((s, i) => (
            <button key={s.step} onClick={() => setActive(i)} className={`rounded-xl border p-4 text-left transition-all duration-200 ${i === active ? `bg-gradient-to-br ${s.color} ${s.border} shadow-lg` : "border-[var(--border)] bg-[var(--lifted)] hover:border-blue-500/30 hover:bg-[var(--raised)]"}`}>
              <span className="text-2xl">{s.icon}</span>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{s.step}</p>
              <p className="font-semibold text-[var(--text)]">{s.title}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{s.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 6 module cards */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[var(--accent-strong)]">All Modules</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Link key={m.title} href={m.href} className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6 transition-all hover:border-blue-500/30 hover:bg-[var(--raised)] hover:shadow-lg">
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${m.bg}`}>{m.icon}</div>
              <h3 className="font-semibold text-[var(--text)] group-hover:text-[var(--accent-strong)]">{m.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-[var(--muted)]">{m.desc}</p>
              <span className={`mt-4 text-sm font-semibold ${m.accent}`}>Open →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
