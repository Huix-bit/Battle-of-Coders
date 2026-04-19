import { JadualPanel, type AssignmentRow, type MarketRow, type VendorOption } from "@/components/jadual-panel";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";
import { MOCK_MARKETS, MOCK_VENDORS } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export default async function JadualPage() {
  let markets: MarketRow[] = [];
  let vendors: VendorOption[] = [];
  let assignments: AssignmentRow[] = [];

  if (SUPABASE_CONFIGURED) {
    const [marketsResult, vendorsResult, assignmentsResult] = await Promise.all([
      supabase.from("market").select("*").order("nama_pasar", { ascending: true }),
      supabase.from("vendor").select("id, nama_perniagaan").order("nama_perniagaan", { ascending: true }),
      supabase.from("assignment").select("*, vendor (*), market (*)").order("tarikh_mula", { ascending: true }),
    ]);

    markets = (marketsResult.data ?? []).map((m) => ({
      id: m.id, namaPasar: m.nama_pasar, daerah: m.daerah,
      alamat: m.alamat, hariOperasi: m.hari_operasi, status: m.status,
    }));

    vendors = (vendorsResult.data ?? []).map((v) => ({
      id: v.id, namaPerniagaan: v.nama_perniagaan,
    }));

    assignments = (assignmentsResult.data ?? []).map((a) => ({
      id: a.id, vendorId: a.vendor_id, marketId: a.market_id,
      tarikhMula: a.tarikh_mula, tarikhTamat: a.tarikh_tamat ?? null,
      petakStall: a.petak_stall, catatan: a.catatan, status: a.status,
      vendorName: a.vendor?.nama_perniagaan ?? "",
      marketName: a.market?.nama_pasar ?? "",
    }));
  } else {
    // Demo data: convert MOCK_MARKETS → MarketRow and MOCK_VENDORS → VendorOption
    markets = MOCK_MARKETS.map((m) => ({
      id: m.id, namaPasar: m.name, daerah: m.district,
      alamat: null, hariOperasi: null, status: "BEROPERASI",
    }));
    vendors = MOCK_VENDORS.map((v) => ({
      id: v.id, namaPerniagaan: v.namaPerniagaan,
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
          Manage market locations by Melaka district and schedule vendors to stalls — start dates cannot be in the past.
        </p>
      </div>
      <JadualPanel markets={markets} vendors={vendors} assignments={assignments} />
    </div>
  );
}
