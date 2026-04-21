"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PublicChatWidget } from "@/components/public-chat-widget";

/* ── Scroll-reveal hook ──────────────────────────────────────────────────── */
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add("revealed");
            observer.disconnect();
          }
        },
        { threshold: 0.12 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return ref;
}

/* ── 3-D tilt card ───────────────────────────────────────────────────────── */
function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    card.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`;
    card.style.boxShadow = `${-x * 12}px ${-y * 12}px 40px rgba(245,166,35,0.10)`;
  }

  function onLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(700px) rotateY(0deg) rotateX(0deg) scale(1)";
    card.style.boxShadow = "";
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Animated counter ────────────────────────────────────────────────────── */
function CountUp({ value }: { value: string }) {
  const [displayed, setDisplayed] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const num = parseInt(value, 10);
    if (isNaN(num)) { setDisplayed(value); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = Math.ceil(num / 30);
      const id = setInterval(() => {
        start += step;
        if (start >= num) { setDisplayed(String(num)); clearInterval(id); }
        else setDisplayed(String(start));
      }, 40);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{displayed}</span>;
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const roles = [
    {
      icon: "🛒",
      title: "Vendor",
      subtitle: "Empower your stall",
      color: "from-indigo-500/10 to-purple-500/10",
      border: "hover:border-indigo-400/50",
      features: [
        { icon: "🤖", label: "Zero-UI AI Onboarding",     desc: "Chat your way to a live digital storefront in minutes."                        },
        { icon: "📍", label: "Live Presence Toggle",       desc: "One tap to mark yourself as open — keeps the market map real-time accurate."   },
        { icon: "⚡", label: "Flash Sales & Duit Pecah",   desc: "One-tap promotions and digital small-change requests for fast-paced selling."  },
        { icon: "📈", label: "Growth Intelligence",        desc: "AI tips on pricing, bundling, and positioning from live performance data."      },
      ],
    },
    {
      icon: "🍜",
      title: "Buyer",
      subtitle: "Discover & shop smarter",
      color: "from-emerald-500/10 to-teal-500/10",
      border: "hover:border-emerald-400/50",
      features: [
        { icon: "🌡️", label: "Live Heatmap",              desc: "See crowd density and trending stalls to navigate like a market expert."        },
        { icon: "🛍️", label: "Multi-Stall Cart",          desc: "Buy from multiple vendors in one checkout — no more five separate payments."    },
        { icon: "🚗", label: "Pasar-Drive",                desc: "Curbside pickup at the market edge — the fix for the classic parking struggle." },
        { icon: "✨", label: "Hyper-Personalization",      desc: "AI-generated Food Trails and recommendations based on budget and past cravings." },
      ],
    },
    {
      icon: "🏛️",
      title: "Admin",
      subtitle: "Govern & optimize",
      color: "from-amber-500/10 to-orange-500/10",
      border: "hover:border-amber-400/50",
      features: [
        { icon: "📊", label: "Operational Visibility",     desc: "Real-time dashboard for vendor counts and crowd hotspots."                      },
        { icon: "🔮", label: "Predictive Analytics",       desc: "Aggregated insights on which categories drive the local economy."               },
        { icon: "🗺️", label: "Auto-Healing Layouts",      desc: "AI identifies dead zones and suggests stall reassignments."                     },
        { icon: "📋", label: "Vendor & Schedule Mgmt",     desc: "Full CRUD control over vendors, market sites, and assignments by district."     },
      ],
    },
  ];

  const stats = [
    { value: "3",    label: "User Roles"      },
    { value: "AI",   label: "Powered Insights" },
    { value: "Live", label: "Market Data"      },
    { value: "∞",   label: "Vendors Supported" },
  ];

  const problems = [
    { icon: "👻", title: "Phantom Stalls",    desc: "Real-time vendor presence eliminates wasted trips to empty booths."              },
    { icon: "🗺️", title: "Navigation Chaos", desc: "Live heatmaps and smart Food Trails guide buyers effortlessly."                  },
    { icon: "🚗", title: "Parking Struggle",  desc: "Pasar-Drive curbside pickup removes the biggest pain point of every visit."      },
  ];

  /* reveal refs for section headers */
  const purposeRef = useReveal(0);
  const rolesRef   = useReveal(0);
  const ctaRef     = useReveal(0);

  /* Global observer — reveals every .reveal element on scroll */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
    <div className="space-y-24 pb-8">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-20 text-center shadow-lg">

        {/* Radial base glow */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#341F6A_0%,_transparent_65%)]" />

        {/* Floating orbs */}
        <div className="animate-float-orb      pointer-events-none absolute -top-16 -left-16  h-64 w-64  rounded-full bg-purple-600/20  blur-3xl" style={{ animationDelay: "0s"   }} />
        <div className="animate-float-orb-slow pointer-events-none absolute -bottom-20 right-0  h-80 w-80  rounded-full bg-amber-500/15   blur-3xl" style={{ animationDelay: "2s"   }} />
        <div className="animate-float-orb      pointer-events-none absolute top-1/3 left-1/2   h-48 w-48  rounded-full bg-indigo-500/15  blur-2xl" style={{ animationDelay: "1.2s" }} />

        {/* Spinning ring decoration */}
        <div className="animate-spin-slow pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-10">
          <div className="h-[600px] w-[600px] rounded-full border border-[var(--accent)] border-dashed" />
        </div>

        {/* Badge */}
        <p className="animate-fade-up inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em]"
           style={{ animationDelay: "0.05s" }}>
          <span className="shimmer-text">Introducing Pasar-Smart</span>
        </p>

        {/* Headline */}
        <h1
          className="animate-fade-up mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[var(--accent-strong)] sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "0.15s" }}
        >
          The Future of the<br />
          <span className="shimmer-text">Malaysian Night Market</span>
        </h1>

        {/* Sub */}
        <p
          className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)]"
          style={{ animationDelay: "0.28s" }}
        >
          A high-tech, data-driven ecosystem that transforms the traditional{" "}
          <em className="text-[var(--secondary)]">pasar malam</em> into a streamlined digital marketplace —
          maximizing revenue for vendors, convenience for buyers, and operational efficiency for administrators.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-up mt-9 flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "0.38s" }}
        >
          <Link
            href="/signup"
            className="rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--abyss)] shadow-lg shadow-amber-500/20 transition-all hover:scale-105 hover:opacity-90"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--border)] px-7 py-3 text-sm font-semibold text-[var(--text)] transition-all hover:scale-105 hover:bg-[var(--surface)]"
          >
            Sign in to your account
          </Link>
        </div>

        {/* Stats */}
        <div
          className="animate-fade-up mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4"
          style={{ animationDelay: "0.5s" }}
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="animate-scale-in rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 py-5 backdrop-blur-sm transition-transform hover:scale-105"
              style={{ animationDelay: `${0.55 + i * 0.08}s` }}
            >
              <p className="text-2xl font-bold text-[var(--accent-strong)]">
                <CountUp value={s.value} />
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Purpose ───────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div ref={purposeRef} className="reveal text-center">
          <span className="text-3xl">🏛️</span>
          <h2 className="mt-2 text-2xl font-bold text-[var(--accent-strong)]">Our Purpose</h2>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <p className="text-center text-lg font-semibold text-[var(--accent-strong)]">
            Eliminate &ldquo;Market Friction&rdquo;
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-center text-[var(--muted)]">
            Pasar-Smart solves the real-world issues plaguing traditional night markets — unpredictable vendor
            attendance (phantom stalls), navigational chaos, and logistics bottlenecks like parking and crowds.
            By leveraging AI and real-time data, it bridges the gap between traditional street vending and
            modern e-commerce expectations.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {problems.map((p) => (
              <TiltCard
                key={p.title}
                className="reveal rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center"
              >
                <p className="text-4xl">{p.icon}</p>
                <p className="mt-3 font-semibold text-[var(--accent-strong)]">{p.title}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{p.desc}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ongoing Event ─────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center reveal">
          <span className="text-3xl">🌙</span>
          <h2 className="mt-2 text-2xl font-bold text-[var(--accent-strong)]">Ongoing Event</h2>
          <p className="mt-1 text-[var(--muted)]">Live tonight — explore the market before you arrive</p>
        </div>

        <a
          href="/live-map"
          className="group relative block overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg transition-all hover:border-[var(--accent)]/50 hover:shadow-[var(--accent)]/10 hover:shadow-2xl"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom-left,_#1a3a2a_0%,_transparent_60%)]" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-4xl">
                🏮
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Live Now</span>
                </div>
                <h3 className="mt-1 text-xl font-bold text-[var(--accent-strong)]">Pasar Malam Melaka</h3>
                <p className="text-sm text-[var(--muted)]">📅 April 20, 2026 &nbsp;·&nbsp; 🕕 6:00 PM – 11:30 PM</p>
                <p className="mt-1 text-xs text-[var(--muted)]">📍 Jalan Banda, 75200 Melaka</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3 sm:flex-col sm:items-end">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs">
                <span>🏪</span>
                <span className="font-semibold text-[var(--text)]">9 Active Stalls</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                <span>⚡</span>
                <span className="font-semibold text-amber-400">2 Flash Deals</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs">
                <span>🔥</span>
                <span className="font-semibold text-[var(--text)]">95% crowd at B4</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3">
            <span className="text-sm text-[var(--muted)]">Heatmap · Stall Layout · Parking &amp; Gates · Live Deals</span>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all group-hover:scale-105">
              Explore Live Map →
            </span>
          </div>
        </a>
      </section>

      {/* ── Role cards ────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div ref={rolesRef} className="reveal text-center">
          <h2 className="text-2xl font-bold text-[var(--accent-strong)]">Built for Every Role</h2>
          <p className="mt-2 text-[var(--muted)]">
            Three purpose-built portals, each tailored to a different part of the market ecosystem.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {roles.map((r) => (
            <TiltCard
              key={r.title}
              className={`reveal flex flex-col rounded-2xl border border-[var(--border)] bg-gradient-to-br ${r.color} ${r.border} bg-[var(--card)] p-6 shadow-sm transition-colors`}
            >
              <div className="mb-4">
                <span className="text-5xl">{r.icon}</span>
                <h3 className="mt-4 text-xl font-bold text-[var(--accent-strong)]">{r.title}</h3>
                <p className="text-sm text-[var(--muted)]">{r.subtitle}</p>
              </div>
              <ul className="flex-1 space-y-3">
                {r.features.map((f) => (
                  <li key={f.label} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-lg">{f.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">{f.label}</p>
                      <p className="text-xs text-[var(--muted)]">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 block rounded-xl border border-[var(--border)] py-2.5 text-center text-sm font-medium text-[var(--text)] transition-all hover:border-[var(--accent)] hover:bg-[var(--surface)] hover:text-[var(--accent)]"
              >
                Join as {r.title} →
              </Link>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className="reveal animate-pulse-glow rounded-3xl border border-[var(--accent)]/60 bg-[var(--surface)] px-8 py-16 text-center"
      >
        <h2 className="text-2xl font-bold text-[var(--accent-strong)]">
          Ready to modernize your night market experience?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
          Sign up in seconds. No setup fees — just pick your role and start using Pasar-Smart today.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-[var(--accent)] px-9 py-3 text-sm font-semibold text-[var(--abyss)] shadow-lg shadow-amber-500/20 transition-all hover:scale-105 hover:opacity-90"
          >
            Create a free account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--border)] px-9 py-3 text-sm font-semibold text-[var(--text)] transition-all hover:scale-105 hover:bg-[var(--card)]"
          >
            I already have an account
          </Link>
        </div>
      </section>
    </div>

    <PublicChatWidget />
    </>
  );
}
