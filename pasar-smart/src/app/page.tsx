import Link from "next/link";

export default function HomePage() {
  const roles = [
    {
      icon: "🛒",
      title: "Vendor",
      subtitle: "Empower your stall",
      features: [
        { icon: "🤖", label: "Zero-UI AI Onboarding", desc: "Chat your way to a live digital storefront in minutes." },
        { icon: "📍", label: "Live Presence Toggle", desc: "One tap to mark yourself as open — keeps the market map real-time accurate." },
        { icon: "⚡", label: "Flash Sales & Duit Pecah", desc: "One-tap promotions and digital small-change requests for fast-paced selling." },
        { icon: "📈", label: "Growth Intelligence", desc: "AI tips on pricing, bundling, and positioning from live performance data." },
      ],
    },
    {
      icon: "🍜",
      title: "Buyer",
      subtitle: "Discover & shop smarter",
      features: [
        { icon: "🌡️", label: "Live Heatmap", desc: "See crowd density and trending stalls to navigate like a market expert." },
        { icon: "🛍️", label: "Multi-Stall Cart", desc: "Buy from multiple vendors in one checkout — no more five separate payments." },
        { icon: "🚗", label: "Pasar-Drive", desc: "Curbside pickup at the market edge — the fix for the classic parking struggle." },
        { icon: "✨", label: "Hyper-Personalization", desc: "AI-generated Food Trails and recommendations based on budget and past cravings." },
      ],
    },
    {
      icon: "🏛️",
      title: "Admin",
      subtitle: "Govern & optimize",
      features: [
        { icon: "📊", label: "Operational Visibility", desc: "Real-time dashboard for vendor counts and crowd hotspots." },
        { icon: "🔮", label: "Predictive Analytics", desc: "Aggregated insights on which categories drive the local economy." },
        { icon: "🗺️", label: "Auto-Healing Layouts", desc: "AI identifies dead zones and suggests stall reassignments for balanced traffic flow." },
        { icon: "📋", label: "Vendor & Schedule Management", desc: "Full CRUD control over vendors, market sites, and assignments by district." },
      ],
    },
  ];

  const stats = [
    { value: "3", label: "User Roles" },
    { value: "AI", label: "Powered Insights" },
    { value: "Live", label: "Market Data" },
    { value: "∞", label: "Vendors Supported" },
  ];

  return (
    <div className="space-y-20">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-16 shadow-sm text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#341F6A_0%,_transparent_60%)]" />
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
          Introducing Pasar-Smart
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[var(--accent-strong)] sm:text-5xl">
          The Future of the Malaysian Night Market
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)]">
          A high-tech, data-driven ecosystem that transforms the traditional <em>pasar malam</em> into a
          streamlined digital marketplace — maximizing revenue for vendors, convenience for buyers, and
          operational efficiency for administrators.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          >
            Sign in to your account
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-4">
              <p className="text-2xl font-bold text-[var(--accent-strong)]">{s.value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Purpose ── */}
      <section className="space-y-4">
        <div className="text-center">
          <span className="text-2xl">🏛️</span>
          <h2 className="mt-2 text-2xl font-bold text-[var(--accent-strong)]">Our Purpose</h2>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <p className="text-center text-lg font-medium text-[var(--accent-strong)]">
            Eliminate &ldquo;Market Friction&rdquo;
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-center text-[var(--muted)]">
            Pasar-Smart solves the real-world issues plaguing traditional night markets — unpredictable vendor
            attendance (phantom stalls), navigational chaos, and logistics bottlenecks like parking and crowds.
            By leveraging AI and real-time data, it bridges the gap between traditional street vending and
            modern e-commerce expectations.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: "👻", title: "Phantom Stalls", desc: "Real-time vendor presence eliminates wasted trips to empty booths." },
              { icon: "🗺️", title: "Navigation Chaos", desc: "Live heatmaps and smart Food Trails guide buyers effortlessly." },
              { icon: "🚗", title: "Parking Struggle", desc: "Pasar-Drive curbside pickup removes the biggest pain point of every visit." },
            ].map((p) => (
              <div key={p.title} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
                <p className="text-3xl">{p.icon}</p>
                <p className="mt-2 font-semibold text-[var(--accent-strong)]">{p.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role Feature Cards ── */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--accent-strong)]">Built for Every Role</h2>
          <p className="mt-2 text-[var(--muted)]">
            Three purpose-built portals, each tailored to a different part of the market ecosystem.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {roles.map((r) => (
            <div
              key={r.title}
              className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
            >
              <div className="mb-4">
                <span className="text-4xl">{r.icon}</span>
                <h3 className="mt-3 text-xl font-bold text-[var(--accent-strong)]">{r.title}</h3>
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
                className="mt-6 block rounded-xl border border-[var(--border)] py-2.5 text-center text-sm font-medium text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-colors"
              >
                Join as {r.title} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="rounded-3xl border border-[var(--accent)] bg-[var(--surface)] px-8 py-14 text-center">
        <h2 className="text-2xl font-bold text-[var(--accent-strong)]">
          Ready to modernize your night market experience?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
          Sign up in seconds. No setup fees — just pick your role and start using Pasar-Smart today.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
          >
            Create a free account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--border)] px-8 py-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--card)] transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </section>
    </div>
  );
}
