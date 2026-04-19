import { redirect } from "next/navigation";
import type { StallMarketOption, StallRow } from "@/components/stalls-panel";
import { StallsPanel } from "@/components/stalls-panel";
import type { VendorOption } from "@/components/jadual-panel";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StallStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function GeraiPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/gerai");
  if (profile.role === "BUYER") redirect("/");

  const supabase = await createSupabaseServerClient();

  const [marketsRes, vendorsRes] = await Promise.all([
    supabase.from("market").select("id, nama_pasar, daerah").order("nama_pasar", { ascending: true }),
    supabase.from("vendor").select("id, nama_perniagaan").order("nama_perniagaan", { ascending: true }),
  ]);

  const marketsData = marketsRes.data ?? [];
  const vendorsData = vendorsRes.data ?? [];

  const markets: StallMarketOption[] = marketsData.map((m) => ({
    id: m.id,
    namaPasar: m.nama_pasar,
    daerah: m.daerah,
  }));

  const vendors: VendorOption[] = vendorsData.map((v) => ({
    id: v.id,
    namaPerniagaan: v.nama_perniagaan,
  }));

  let linkedVendorId: string | null = null;
  if (profile.role === "VENDOR") {
    const { data: vRow } = await supabase
      .from("vendor")
      .select("id")
      .eq("auth_user_id", profile.id)
      .maybeSingle();
    linkedVendorId = vRow?.id ?? null;
  }

  let stallsQuery = supabase.from("stalls").select("*, vendor (*), market (*)").order("name", { ascending: true });

  if (profile.role === "VENDOR") {
    if (!linkedVendorId) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--accent-strong)]">Gerai penjaja</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Rekod penjaja anda belum dipautkan kepada akaun ini.
            </p>
          </div>
          <StallsPanel stalls={[]} vendors={vendors} markets={markets} mode="vendor" linkedVendorId={null} />
        </div>
      );
    }
    stallsQuery = stallsQuery.eq("vendor_id", linkedVendorId);
  }

  const { data: stallsRaw } = await stallsQuery;

  const stalls: StallRow[] = (stallsRaw ?? []).map((row) => ({
    id: row.id,
    vendorId: row.vendor_id,
    vendorName: row.vendor?.nama_perniagaan ?? "",
    marketId: row.market_id,
    marketName: row.market?.nama_pasar ?? null,
    name: row.name,
    category: row.category,
    status: row.status as StallStatus,
    flashSaleActive: row.flash_sale_active,
    isHere: row.is_here,
    mapLocationX: row.map_location_x,
    mapLocationY: row.map_location_y,
  }));

  const mode = profile.role === "ADMIN" ? "admin" : "vendor";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--accent-strong)]">
          {mode === "admin" ? "Pengurusan gerai (semua penjaja)" : "Gerai penjaja"}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Cipta dan kemas kini gerai, status kehadiran, dan jimat kilat untuk pasar malam.
        </p>
      </div>
      <StallsPanel
        stalls={stalls}
        vendors={vendors}
        markets={markets}
        mode={mode}
        linkedVendorId={linkedVendorId}
      />
    </div>
  );
}
