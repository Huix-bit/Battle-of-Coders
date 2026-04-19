import Link from "next/link";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";
import { MOCK_MARKETS, type MockMarket } from "@/lib/mockData";

export const dynamic = "force-dynamic";

const DAY_LABELS: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};

export default async function VendorPage() {
  let markets: MockMarket[] = MOCK_MARKETS;

  if (SUPABASE_CONFIGURED) {
    const { data } = await supabase
      .from("market")
      .select("id, name, district, day_of_week, open_time, close_time, is_active")
      .eq("is_active", true)
      .order("day_of_week", { ascending: true });
    if (data) markets = data as MockMarket[];
  }

  return (
    <div className="space-y-10">
      {!SUPABASE_CONFIGURED && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
          <span className="text-lg">⚡</span>
          <span><strong>Demo mode</strong> — showing sample market data.</span>
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Vendor Portal</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text)]">Vendor Dashboard</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          View active night market schedules, site locations, and your stall assignment information.
        </p>
        <div className="mt-6">
          <Link href="/jadual" className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--abyss)] hover:opacity-95">
            Full schedule
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--accent)]">Active Night Markets</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">List of night markets currently in operation.</p>

        {markets.length === 0 ? (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--lifted)] px-6 py-10 text-center text-sm text-[var(--muted)]">
            No active night markets at this time.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((m) => (
              <div key={m.id} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[var(--text)]">{m.name}</p>
                  <span className="shrink-0 rounded-full bg-[#1D9E75]/15 px-2 py-0.5 text-xs font-medium text-[#1D9E75]">
                    Active
                  </span>
                </div>
                <p className="text-sm text-[var(--muted)]">📍 {m.district}</p>
                {m.day_of_week !== null && m.day_of_week !== undefined && (
                  <p className="text-sm text-[var(--muted)]">
                    📅 {DAY_LABELS[m.day_of_week] ?? `Day ${m.day_of_week}`}
                  </p>
                )}
                {m.open_time && m.close_time && (
                  <p className="text-sm text-[var(--muted)]">🕐 {m.open_time} – {m.close_time}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6">
        <h2 className="font-semibold text-[var(--text)]">Need help?</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Contact the administrator for questions about stall assignments or vendor registration.
        </p>
        <Link href="/jadual" className="mt-4 inline-block rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--raised)] transition">
          Full schedule →
        </Link>
      </section>
    </div>
  );
}
