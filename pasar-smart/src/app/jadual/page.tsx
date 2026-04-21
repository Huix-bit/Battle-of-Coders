import { JadualPanel, type MarketRow } from "@/components/jadual-panel";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";
import { MOCK_MARKETS } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export default async function JadualPage() {
  let markets: MarketRow[] = [];

  if (SUPABASE_CONFIGURED) {
    const marketsResult = await supabase
      .from("market")
      .select("*")
      .order("nama_pasar", { ascending: true });

    markets = (marketsResult.data ?? []).map((m) => ({
      id: m.id, namaPasar: m.nama_pasar, daerah: m.daerah,
      alamat: m.alamat, hariOperasi: m.hari_operasi, status: m.status,
    }));
  } else {
    markets = MOCK_MARKETS.map((m) => ({
      id: m.id, namaPasar: m.name, daerah: m.district,
      alamat: null, hariOperasi: null, status: "BEROPERASI",
    }));
  }

  return (
    <div className="space-y-6">
      {!SUPABASE_CONFIGURED && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
          <span className="text-lg">⚡</span>
          <span>
            <strong>Demo mode</strong> — changes will not be saved. Connect Supabase to enable full scheduling.
          </span>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Market Schedule &amp; Sites</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manage market locations by Melaka district — add, edit, or update site status.
        </p>
      </div>
      <JadualPanel markets={markets} />
    </div>
  );
}
