import Link from "next/link";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";
import { MOCK_MARKETS, type MockMarket } from "@/lib/mockData";

export const dynamic = "force-dynamic";

const DAY_LABELS: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};

export default async function UserPage() {
  let markets: MockMarket[] = MOCK_MARKETS;

  if (SUPABASE_CONFIGURED) {
    const { data } = await supabase
      .from("market")
      .select("id, name, district, day_of_week, open_time, close_time, is_active")
      .eq("is_active", true)
      .order("district", { ascending: true });
    if (data) markets = data as MockMarket[];
  }

  const districts = [...new Set(markets.map((m) => m.district).filter(Boolean))];

  return (
    <div className="space-y-10">
      {!SUPABASE_CONFIGURED && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
          <span className="text-lg">⚡</span>
          <span><strong>Demo mode</strong> — showing sample market data.</span>
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">User Portal</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text)]">Melaka Night Markets</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Find nearby night markets, check operating days, and discover your favourite stall locations.
        </p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Active markets",   value: markets.length, icon: "🏪" },
          { label: "Districts covered", value: districts.length, icon: "📍" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5">
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--accent)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Markets by district */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--accent)]">Active Night Markets by District</h2>
        {markets.length === 0 ? (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--lifted)] px-6 py-10 text-center text-sm text-[var(--muted)]">
            No active night markets at this time.
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {districts.map((district) => {
              const districtMarkets = markets.filter((m) => m.district === district);
              return (
                <div key={district}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    {district}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {districtMarkets.map((m) => (
                      <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] p-4 space-y-1.5">
                        <p className="font-medium text-[var(--text)]">{m.name}</p>
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
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6">
        <h2 className="font-semibold text-[var(--text)]">Want to become a vendor?</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Register as a vendor to access the vendor portal and stall assignment information.
        </p>
        <Link href="/signup" className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--abyss)] hover:opacity-90 transition">
          Sign up as Vendor →
        </Link>
      </section>
    </div>
  );
}
