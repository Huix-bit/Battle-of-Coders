import Link from "next/link";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";
import { MOCK_STATS } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let totalVendors = MOCK_STATS.vendors;
  let totalSites = MOCK_STATS.sites;
  let totalAssignments = MOCK_STATS.assignments;

  if (SUPABASE_CONFIGURED) {
    const [vendorResult, marketResult, assignmentResult] = await Promise.all([
      supabase.from("vendor").select("id", { count: "exact", head: true }),
      supabase.from("market").select("id", { count: "exact", head: true }),
      supabase.from("assignment").select("id", { count: "exact", head: true }),
    ]);
    totalVendors    = vendorResult.count     ?? 0;
    totalSites      = marketResult.count     ?? 0;
    totalAssignments = assignmentResult.count ?? 0;
  }

  const cards = [
    { label: "Registered vendors",               value: totalVendors,     href: "/penjaja", icon: "👤" },
    { label: "Market sites",                      value: totalSites,       href: "/jadual",  icon: "🏪" },
    { label: "Active / scheduled assignments",    value: totalAssignments, href: "/jadual",  icon: "📋" },
  ];

  const actions = [
    { href: "/penjaja", title: "Vendor Management", desc: "Add, update or remove registered vendor records.",         icon: "👤" },
    { href: "/jadual",  title: "Market Schedule",   desc: "Manage night market schedules and sites by district.",     icon: "📅" },
    { href: "/laporan", title: "Business Reports",  desc: "View summaries and download CSV reports.",                 icon: "📊" },
  ];

  return (
    <div className="space-y-10">
      {/* Demo mode banner */}
      {!SUPABASE_CONFIGURED && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
          <span className="text-lg">⚡</span>
          <span>
            <strong>Demo mode</strong> — showing sample data. Add Supabase credentials to{" "}
            <code className="rounded bg-[var(--raised)] px-1">.env.local</code> for live data.
          </span>
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Admin Panel</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text)]">Admin Dashboard</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Manage vendors, schedule sites across districts like Bukit Beruang or Melaka Tengah, and generate business reports.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/penjaja" className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--abyss)] hover:opacity-95">
            Vendor Management
          </Link>
          <Link href="/jadual" className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--raised)]">
            Market Schedule
          </Link>
          <Link href="/laporan" className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--raised)]">
            Business Reports
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--accent)]">System Overview</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5 transition hover:border-[var(--accent)]/60 hover:bg-[var(--raised)]"
            >
              <p className="text-2xl">{c.icon}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{c.label}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--accent)]">{c.value}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--accent)]">Quick Access</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]/60 hover:bg-[var(--lifted)]"
            >
              <span className="text-3xl">{a.icon}</span>
              <p className="mt-3 font-semibold text-[var(--text)]">{a.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{a.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
