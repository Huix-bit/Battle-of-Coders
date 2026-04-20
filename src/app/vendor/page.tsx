"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LOOP_STEPS = [
  {
    step: "01",
    icon: "🤖",
    title: "Register",
    subtitle: "AI Onboarding",
    desc: "Describe your business in natural language — AI extracts category, menu & pricing automatically.",
    href: "/daftar-ai",
    cta: "Start Chat →",
    color: "from-purple-500/20 to-indigo-500/20",
    border: "border-purple-500/40",
    glow: "shadow-purple-500/20",
  },
  {
    step: "02",
    icon: "📍",
    title: "Update",
    subtitle: "Real-Time Presence",
    desc: "One-tap 'I'm Here' toggle keeps the live market map accurate. Flag busy or sold-out instantly.",
    href: "/vendor/dashboard",
    cta: "Open Hub →",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/40",
    glow: "shadow-emerald-500/20",
  },
  {
    step: "03",
    icon: "⚡",
    title: "Sell",
    subtitle: "Revenue Boosters",
    desc: "Launch flash discounts, join Pasar-Drive multi-stall orders, and request duit pecah in seconds.",
    href: "/vendor/tools",
    cta: "Open Tools →",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/40",
    glow: "shadow-amber-500/20",
  },
  {
    step: "04",
    icon: "📈",
    title: "Adapt",
    subtitle: "AI Insights",
    desc: "Get AI-driven tips on pricing, positioning and bundling based on live performance data.",
    href: "/vendor/dashboard",
    cta: "View Analytics →",
    color: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/40",
    glow: "shadow-pink-500/20",
  },
];

const FEATURES = [
  {
    icon: "🤖",
    title: "AI-Driven Registration",
    desc: "Zero-form onboarding via natural-language chat. AI extracts business details automatically.",
    href: "/daftar-ai",
    label: "Start →",
    accent: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: "📍",
    title: "Stall Status Toggle",
    desc: "Mark yourself open or closed in one tap. Eliminate phantom stalls from the live map.",
    href: "/vendor/dashboard",
    label: "Manage →",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: "🗺️",
    title: "Market Layout View",
    desc: "See the full stall map, spot available slots, and plan your positioning before the market opens.",
    href: "/vendor/layout",
    label: "View Map →",
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: "⚡",
    title: "Dynamic Selling Tools",
    desc: "One-tap flash sales, Pasar-Drive curbside orders, and duit pecah requests from nearby vendors.",
    href: "/vendor/tools",
    label: "Open Tools →",
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: "📊",
    title: "Analytics & Insights",
    desc: "Track total sales, peak hours and customer preferences. Designed for non-technical vendors.",
    href: "/vendor/dashboard",
    label: "View Stats →",
    accent: "text-pink-400",
    bg: "bg-pink-500/10",
  },
];

export default function VendorPage() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveStep((s) => (s + 1) % LOOP_STEPS.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-16 pb-12">

      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-14 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#341F6A_0%,_transparent_60%)]" />
        <div className="pointer-events-none absolute -top-10 -left-10 h-52 w-52 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />

        <p className="inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          Vendor Portal
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight text-[var(--text)] sm:text-4xl">
          Your complete stall management system
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">
          Register with AI, broadcast your presence, launch flash deals, view the market map — all in one place.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/vendor/dashboard" className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--abyss)] shadow-lg shadow-amber-500/20 transition-all hover:scale-105 hover:opacity-90">
            📊 Open Hub
          </Link>
          <Link href="/vendor/layout" className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--text)] transition-all hover:scale-105 hover:bg-[var(--surface)]">
            🗺️ Market Map
          </Link>
          <Link href="/vendor/tools" className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--text)] transition-all hover:scale-105 hover:bg-[var(--surface)]">
            🛠️ Selling Tools
          </Link>
        </div>
      </section>

      {/* ── Vendor Loop ── */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--accent-strong)]">The Vendor Loop</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">A continuous cycle designed to grow your stall every night</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0">
          {LOOP_STEPS.map((s, i) => (
            <button key={s.step} onClick={() => setActiveStep(i)} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                i === activeStep
                  ? "bg-[var(--accent)] text-[var(--abyss)] scale-110"
                  : "bg-[var(--raised)] text-[var(--muted)]"
              }`}>
                {s.step}
              </div>
              {i < LOOP_STEPS.length - 1 && (
                <div className={`h-0.5 w-12 transition-colors duration-300 sm:w-20 ${i < activeStep ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
              )}
            </button>
          ))}
          {/* Loop-back arrow */}
          <div className="ml-2 text-[var(--muted)] text-sm">↩</div>
        </div>

        {/* Active step detail */}
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${LOOP_STEPS[activeStep].color} ${LOOP_STEPS[activeStep].border} p-8 shadow-xl ${LOOP_STEPS[activeStep].glow} transition-all duration-500`}>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--abyss)]/50 text-5xl">
              {LOOP_STEPS[activeStep].icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Step {LOOP_STEPS[activeStep].step}</span>
                <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                  {LOOP_STEPS[activeStep].subtitle}
                </span>
              </div>
              <h3 className="mt-1 text-2xl font-bold text-[var(--text)]">{LOOP_STEPS[activeStep].title}</h3>
              <p className="mt-2 max-w-lg text-[var(--muted)]">{LOOP_STEPS[activeStep].desc}</p>
            </div>
            <Link
              href={LOOP_STEPS[activeStep].href}
              className="shrink-0 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--abyss)] transition-all hover:opacity-90"
            >
              {LOOP_STEPS[activeStep].cta}
            </Link>
          </div>
        </div>

        {/* All 4 steps mini-cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP_STEPS.map((s, i) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(i)}
              className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                i === activeStep
                  ? `bg-gradient-to-br ${s.color} ${s.border} shadow-lg`
                  : "border-[var(--border)] bg-[var(--lifted)] hover:border-[var(--accent)]/30 hover:bg-[var(--raised)]"
              }`}
            >
              <span className="text-2xl">{s.icon}</span>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{s.step}</p>
              <p className="font-semibold text-[var(--text)]">{s.title}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{s.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── 5 Feature cards ── */}
      <section className="space-y-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--accent-strong)]">Everything You Need</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Five powerful modules — all accessible from this portal</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6 transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--raised)] hover:shadow-lg"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${f.bg}`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-[var(--text)] group-hover:text-[var(--accent-strong)]">{f.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-[var(--muted)]">{f.desc}</p>
              <span className={`mt-4 text-sm font-semibold ${f.accent}`}>{f.label}</span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
