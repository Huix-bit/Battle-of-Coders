import { JadualPanel, type AssignmentRow, type MarketRow, type VendorOption } from "@/components/jadual-panel";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function JadualPage() {
  const [marketsResult, vendorsResult, assignmentsResult] = await Promise.all([
    supabase.from("market").select("*").order("nama_pasar", { ascending: true }),
    supabase.from("vendor").select("id, nama_perniagaan").order("nama_perniagaan", { ascending: true }),
    supabase
      .from("assignment")
      .select("*, vendor (*), market (*)")
      .order("tarikh_mula", { ascending: true }),
  ]);

  const marketsRaw = marketsResult.data ?? [];
  const vendorsRaw = vendorsResult.data ?? [];
  const assignmentsRaw = assignmentsResult.data ?? [];

  const markets: MarketRow[] = marketsRaw.map((m) => ({
    id: m.id,
    namaPasar: m.nama_pasar,
    daerah: m.daerah,
    alamat: m.alamat,
    hariOperasi: m.hari_operasi,
    status: m.status,
  }));

  const vendors: VendorOption[] = vendorsRaw.map((v) => ({
    id: v.id,
    namaPerniagaan: v.nama_perniagaan,
  }));

  const assignments: AssignmentRow[] = assignmentsRaw.map((a) => ({
    id: a.id,
    vendorId: a.vendor_id,
    marketId: a.market_id,
    tarikhMula: a.tarikh_mula,
    tarikhTamat: a.tarikh_tamat ?? null,
    petakStall: a.petak_stall,
    catatan: a.catatan,
    status: a.status,
    vendorName: a.vendor?.nama_perniagaan ?? "",
    marketName: a.market?.nama_pasar ?? "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--accent-strong)]">Jadual pasar & tapak</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Urus lokasi pasar mengikut daerah Melaka dan jadualkan penjaja ke petak — tarikh tidak boleh lampau.
        </p>
      </div>
      <JadualPanel markets={markets} vendors={vendors} assignments={assignments} />
    </div>
  );
}
