"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const LOOP_STEPS = [
  { step: "01", icon: "🔍", title: "Discover", subtitle: "Intelligent Discovery", desc: "Browse trending stalls, active vendors, and get AI-personalized recommendations based on your taste and budget.", href: "/user/discover", cta: "Explore Now →", color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/40" },
  { step: "02", icon: "🗺️", title: "Navigate", subtitle: "Live Heatmap", desc: "Real-time crowd density map lets you avoid queues, find popular stalls, and follow AI-optimized routes.", href: "/user/map", cta: "Open Map →", color: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/40" },
  { step: "03", icon: "🛒", title: "Purchase", subtitle: "Multi-Stall Cart", desc: "Add items from multiple vendors into one cart. Use Pasar-Drive for curbside pickup without the crowds.", href: "/user/cart", cta: "View Cart →", color: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/40" },
  { step: "04", icon: "✨", title: "Optimize", subtitle: "Personalization", desc: "AI learns your preferences over time. Get food trails, save favorites, and receive smarter picks each visit.", href: "/user/profile", cta: "My Profile →", color: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/40" },
];

const FEATURES = [
  { icon: "🔍", title: "Intelligent Discovery", desc: "Trending stalls, live activity, and AI picks tailored to your taste profile.", href: "/user/discover", accent: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: "🌡️", title: "Live Heatmap", desc: "Real-time crowd density so you navigate like a market expert.", href: "/user/map", accent: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: "🛍️", title: "Multi-Stall Cart", desc: "One checkout across multiple vendors — no more five separate payments.", href: "/user/cart", accent: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: "🚗", title: "Pasar-Drive", desc: "Order from the map, pick up at the market edge without parking.", href: "/user/cart", accent: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: "✨", title: "AI Food Trails", desc: "Curated routes through the market based on budget and cravings.", href: "/user/profile", accent: "text-pink-400", bg: "bg-pink-500/10" },
];

const LIVE_STATS = [
  { icon: "🏪", label: "Active Stalls", value: "38", sub: "of 45 open tonight" },
  { icon: "👥", label: "Crowd Level", value: "Moderate", sub: "best time to arrive" },
  { icon: "⚡", label: "Flash Deals", value: "4", sub: "live right now" },
  { icon: "🚗", label: "Drive Slots", value: "12", sub: "pickup available" },
];

export default function UserPage() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((s) => (s + 1) % LOOP_STEPS.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-14 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#0f3d2e_0%,_transparent_60%)]" />
        <div className="pointer-events-none absolute -top-10 -left-10 h-52 w-52 rounded-full bg-emerald-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
        <p className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Buyer Portal</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight text-[var(--text)] sm:text-4xl">Your smart night market companion</h1>
        <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">Discover trending stalls, navigate crowds with live data, order from multiple vendors in one go, and let AI craft your perfect food trail.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/user/discover" className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:bg-emerald-400">🔍 Discover Markets</Link>
          <Link href="/user/map" className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--text)] transition-all hover:scale-105 hover:bg-[var(--surface)]">🗺️ Live Map</Link>
          <Link href="/user/cart" className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--text)] transition-all hover:scale-105 hover:bg-[var(--surface)]">🛒 My Cart</Link>
        </div>
      </section>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LIVE_STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4 text-center">
            <span className="text-2xl">{s.icon}</span>
            <p className="mt-1 text-lg font-bold text-emerald-400">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{s.label}</p>
            <p className="text-[10px] text-[var(--muted)]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Buyer Loop */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--accent-strong)]">The Buyer Loop</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">A smarter way to experience every night market visit</p>
        </div>
        <div className="flex items-center justify-center gap-0">
          {LOOP_STEPS.map((s, i) => (
            <button key={s.step} onClick={() => setActive(i)} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${i === active ? "bg-emerald-500 text-white scale-110" : "bg-[var(--raised)] text-[var(--muted)]"}`}>{s.step}</div>
              {i < LOOP_STEPS.length - 1 && <div className={`h-0.5 w-12 sm:w-20 transition-colors duration-300 ${i < active ? "bg-emerald-500" : "bg-[var(--border)]"}`} />}
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
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">{LOOP_STEPS[active].subtitle}</span>
              </div>
              <h3 className="mt-1 text-2xl font-bold text-[var(--text)]">{LOOP_STEPS[active].title}</h3>
              <p className="mt-2 max-w-lg text-[var(--muted)]">{LOOP_STEPS[active].desc}</p>
            </div>
            <Link href={LOOP_STEPS[active].href} className="shrink-0 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90">{LOOP_STEPS[active].cta}</Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP_STEPS.map((s, i) => (
            <button key={s.step} onClick={() => setActive(i)} className={`rounded-xl border p-4 text-left transition-all duration-200 ${i === active ? `bg-gradient-to-br ${s.color} ${s.border} shadow-lg` : "border-[var(--border)] bg-[var(--lifted)] hover:border-emerald-500/30 hover:bg-[var(--raised)]"}`}>
              <span className="text-2xl">{s.icon}</span>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{s.step}</p>
              <p className="font-semibold text-[var(--text)]">{s.title}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{s.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="space-y-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--accent-strong)]">Everything in One Place</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Five smart modules for the ultimate night market experience</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6 transition-all hover:border-emerald-500/30 hover:bg-[var(--raised)] hover:shadow-lg">
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${f.bg}`}>{f.icon}</div>
              <h3 className="font-semibold text-[var(--text)] group-hover:text-[var(--accent-strong)]">{f.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-[var(--muted)]">{f.desc}</p>
              <span className={`mt-4 text-sm font-semibold ${f.accent}`}>Explore →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
