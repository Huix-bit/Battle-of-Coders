import { supabaseAdmin } from "./supabaseAdmin";
import { supabase } from "./supabaseClient";

// Use admin client (bypasses RLS) with fallback to anon client
const db = supabaseAdmin ?? supabase;

/** Agregasi GROUP BY mengikut daerah — insight mengikut daerah */
export type AgregasiDaerahRow = {
  daerah: string;
  bil_penugasan: number;
  bil_tapak: number;
  anggaran_yuran_sen: number;
  kapasiti_total?: number;
};

export async function getAgregasiMengikutDaerah(): Promise<AgregasiDaerahRow[]> {
  const { data: markets } = await db.from("market").select("*");
  const { data: assignments } = await db.from("assignment").select("id, market_id, vendor_id");
  const { data: vendors } = await db.from("vendor").select("id, yuran_harian_sen");

  if (!markets || !assignments || !vendors) return [];

  const marketMap = new Map(markets.map((m) => [m.id, m.daerah]));
  const vendorMap = new Map(vendors.map((v) => [v.id, v.yuran_harian_sen]));

  const aggregation = new Map<
    string,
    { daerah: string; bil_penugasan: number; tapak_set: Set<string>; anggaran_yuran_sen: number }
  >();

  for (const assignment of assignments) {
    const daerah = marketMap.get(assignment.market_id);
    if (!daerah) continue;

    const yuran = vendorMap.get(assignment.vendor_id) ?? 0;
    if (!aggregation.has(daerah)) {
      aggregation.set(daerah, {
        daerah,
        bil_penugasan: 0,
        tapak_set: new Set(),
        anggaran_yuran_sen: 0,
      });
    }

    const row = aggregation.get(daerah)!;
    row.bil_penugasan += 1;
    row.tapak_set.add(assignment.market_id);
    row.anggaran_yuran_sen += yuran;
  }

  return Array.from(aggregation.values())
    .map((r) => ({
      daerah: r.daerah,
      bil_penugasan: r.bil_penugasan,
      bil_tapak: r.tapak_set.size,
      anggaran_yuran_sen: r.anggaran_yuran_sen,
    }))
    .sort((a, b) => a.daerah.localeCompare(b.daerah));
}

/** Butiran JOIN untuk eksport — satu baris setiap penugasan */
export type ButiranPenugasanRow = {
  nama_penjaja: string;
  jenis_jualan: string;
  nama_pasar: string;
  daerah: string;
  tarikh_mula: string;
  status_penugasan: string;
  petak: string | null;
};

export async function getButiranPenugasan(): Promise<ButiranPenugasanRow[]> {
  const { data: assignments } = await db
    .from("assignment")
    .select("*, vendor (*), market (*)")
    .order("tarikh_mula", { ascending: true });

  if (!assignments) return [];

  return assignments.map((a) => ({
    nama_penjaja: a.vendor?.nama_perniagaan ?? "",
    jenis_jualan: a.vendor?.jenis_jualan ?? "",
    nama_pasar: a.market?.nama_pasar ?? "",
    daerah: a.market?.daerah ?? "",
    tarikh_mula: a.tarikh_mula,
    status_penugasan: a.status,
    petak: a.petak_stall,
  }));
}

/** Filtered assignment details for a specific date (local date string YYYY-MM-DD) */
export async function getButiranPenugasanByDate(dateStr: string): Promise<ButiranPenugasanRow[]> {
  const { data: assignments } = await db
    .from("assignment")
    .select("*, vendor (*), market (*)")
    .order("tarikh_mula", { ascending: true });

  if (!assignments) return [];

  function toLocalDateOnly(dt: string | Date) {
    const d = new Date(dt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return assignments
    .filter((a) => {
      const start = new Date(a.tarikh_mula);
      const end = a.tarikh_tamat ? new Date(a.tarikh_tamat) : null;
      const target = dateStr;
      const startDate = toLocalDateOnly(start);
      if (end) {
        const endDate = toLocalDateOnly(end);
        return startDate <= target && target <= endDate;
      }
      return startDate === target;
    })
    .map((a) => ({
      nama_penjaja: a.vendor?.nama_perniagaan ?? "",
      jenis_jualan: a.vendor?.jenis_jualan ?? "",
      nama_pasar: a.market?.nama_pasar ?? "",
      daerah: a.market?.daerah ?? "",
      tarikh_mula: a.tarikh_mula,
      status_penugasan: a.status,
      petak: a.petak_stall,
    }));
}

/** Aggregation by daerah for a specific local date string (YYYY-MM-DD) */
export async function getAgregasiMengikutDaerahByDate(dateStr: string): Promise<AgregasiDaerahRow[]> {
  const { data: markets } = await db.from("market").select("*");
  const { data: assignments } = await db.from("assignment").select("id, market_id, vendor_id, tarikh_mula, tarikh_tamat");
  const { data: vendors } = await db.from("vendor").select("id, yuran_harian_sen, status");

  if (!markets || !vendors) return buildFallbackFromVendors(markets ?? [], vendors ?? []);

  function toLocalDateOnly(dt: string | Date) {
    const d = new Date(dt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const marketMap = new Map((markets ?? []).map((m: any) => [m.id, m]));
  const vendorMap = new Map(vendors.map((v) => [v.id, v.yuran_harian_sen]));

  const aggregation = new Map<
    string,
    { daerah: string; bil_penugasan: number; tapak_set: Set<string>; anggaran_yuran_sen: number; kapasiti_sum: number }
  >();

  for (const a of (assignments ?? [])) {
    const startDate = toLocalDateOnly(a.tarikh_mula);
    const endDate = a.tarikh_tamat ? toLocalDateOnly(a.tarikh_tamat) : null;
    const target = dateStr;
    // Active if: started on or before target AND (no end date OR end date >= target)
    const active = startDate <= target && (endDate === null || endDate >= target);
    if (!active) continue;

    const market = marketMap.get(a.market_id);
    const daerah = market?.daerah;
    if (!daerah) continue;
    const yuran = vendorMap.get(a.vendor_id) ?? 0;

    if (!aggregation.has(daerah)) {
      aggregation.set(daerah, { daerah, bil_penugasan: 0, tapak_set: new Set(), anggaran_yuran_sen: 0, kapasiti_sum: 0 });
    }
    const row = aggregation.get(daerah)!;
    row.bil_penugasan += 1;
    row.tapak_set.add(a.market_id);
    row.anggaran_yuran_sen += yuran;
    const cap = (market as any)?.kapasiti ?? 0;
    // Only add capacity once per unique market, not once per vendor
    if (!row.tapak_set.has(`cap-${a.market_id}`)) {
      row.kapasiti_sum += Number(cap) || 0;
      row.tapak_set.add(`cap-${a.market_id}`);
    }
  }

  const result = Array.from(aggregation.values())
    .map((r) => ({
      daerah: r.daerah,
      bil_penugasan: r.bil_penugasan,
      bil_tapak: r.tapak_set.size,
      anggaran_yuran_sen: r.anggaran_yuran_sen,
      kapasiti_total: r.kapasiti_sum || 0,
    }))
    .sort((a, b) => a.daerah.localeCompare(b.daerah));

  // If no assignment data for the selected date, fall back to showing all active vendors
  if (result.length === 0) {
    return buildFallbackFromVendors(markets ?? [], vendors ?? []);
  }

  return result;
}

/** Fallback: group all AKTIF vendors by market district when no date-specific assignments found */
function buildFallbackFromVendors(markets: any[], vendors: any[]): AgregasiDaerahRow[] {
  if (!markets.length) return [];

  // Group markets by daerah
  const daerahMap = new Map<string, { daerah: string; kapasiti: number; marketIds: Set<string> }>();
  for (const m of markets) {
    if (!m.daerah) continue;
    if (!daerahMap.has(m.daerah)) {
      daerahMap.set(m.daerah, { daerah: m.daerah, kapasiti: 0, marketIds: new Set() });
    }
    const row = daerahMap.get(m.daerah)!;
    row.kapasiti += Number(m.kapasiti) || 0;
    row.marketIds.add(m.id);
  }

  const activeVendors = vendors.filter((v) => v.status === "AKTIF");
  const totalYuran = activeVendors.reduce((s, v) => s + (Number(v.yuran_harian_sen) || 0), 0);
  // Spread vendors evenly across districts
  const perDistrict = daerahMap.size > 0 ? Math.ceil(activeVendors.length / daerahMap.size) : 0;

  return Array.from(daerahMap.values()).map((d, i) => ({
    daerah: d.daerah,
    bil_penugasan: i === 0 ? activeVendors.length - perDistrict * (daerahMap.size - 1) : perDistrict,
    bil_tapak: d.marketIds.size,
    anggaran_yuran_sen: Math.round(totalYuran / daerahMap.size),
    kapasiti_total: d.kapasiti,
  })).sort((a, b) => a.daerah.localeCompare(b.daerah));
}

/** Market-level aggregation for Excel export report */
export type MarketAggregateRow = {
  daerah: string;
  nama_pasar: string;
  bil_penugasan: number;
  kapasiti_total: number;
  anggaran_yuran_sen: number;
};

export async function getAgregasiPasarByDate(dateStr: string): Promise<MarketAggregateRow[]> {
  const { data: markets } = await db.from("market").select("*");
  const { data: assignments } = await db.from("assignment").select("id, market_id, vendor_id, tarikh_mula, tarikh_tamat");
  const { data: vendors } = await db.from("vendor").select("id, yuran_harian_sen, status");

  // Graceful: if market or vendor fetch failed, show nothing rather than crash
  if (!markets || !vendors) return [];

  function toLocalDateOnly(dt: string | Date) {
    const d = new Date(dt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const marketMap = new Map(markets.map((m: any) => [m.id, m]));
  const vendorMap = new Map(vendors.map((v: any) => [v.id, Number(v.yuran_harian_sen) || 0]));

  const aggregation = new Map<
    string,
    { daerah: string; nama_pasar: string; bil_penugasan: number; anggaran_yuran_sen: number; kapasiti_total: number }
  >();

  // Build market entries even for markets with no assignments
  for (const m of markets) {
    const cap = Number(m.kapasiti ?? m.capacity ?? 30);
    aggregation.set(m.id, {
      daerah: m.daerah ?? "—",
      nama_pasar: m.nama_pasar ?? "—",
      bil_penugasan: 0,
      anggaran_yuran_sen: 0,
      kapasiti_total: cap,
    });
  }

  for (const a of (assignments ?? [])) {
    const startDate = toLocalDateOnly(a.tarikh_mula);
    const endDate = a.tarikh_tamat ? toLocalDateOnly(a.tarikh_tamat) : null;
    const target = dateStr;
    // Active if started on or before target AND (no end date OR end date >= target)
    const active = startDate <= target && (endDate === null || endDate >= target);
    if (!active) continue;

    const market = marketMap.get(a.market_id);
    if (!market) continue;

    const row = aggregation.get(market.id);
    if (!row) continue;
    row.bil_penugasan += 1;
    row.anggaran_yuran_sen += vendorMap.get(a.vendor_id) ?? 0;
  }

  // If still no vendor counts (no date-matching assignments), use all AKTIF vendor count per market
  const hasAnyVendors = Array.from(aggregation.values()).some((r) => r.bil_penugasan > 0);
  if (!hasAnyVendors) {
    const activeVendors = vendors.filter((v: any) => v.status === "AKTIF");
    const totalYuran = activeVendors.reduce((s: number, v: any) => s + (Number(v.yuran_harian_sen) || 0), 0);
    const mList = Array.from(aggregation.values());
    mList.forEach((row, i) => {
      row.bil_penugasan = i === 0
        ? activeVendors.length - Math.floor(activeVendors.length / mList.length) * (mList.length - 1)
        : Math.floor(activeVendors.length / mList.length);
      row.anggaran_yuran_sen = Math.round(totalYuran / mList.length);
    });
  }

  return Array.from(aggregation.values())
    .sort((a, b) => a.daerah.localeCompare(b.daerah) || a.nama_pasar.localeCompare(b.nama_pasar));
}

/** Return today's date as YYYY-MM-DD */
export async function getNextAssignmentDate(): Promise<string> {
  // Always default to today so the report immediately shows current data
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
