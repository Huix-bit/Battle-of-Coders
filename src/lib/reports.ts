import { supabase } from "./supabaseClient";

/** Agregasi GROUP BY mengikut daerah — insight mengikut daerah */
export type AgregasiDaerahRow = {
  daerah: string;
  bil_penugasan: number;
  bil_tapak: number;
  anggaran_yuran_sen: number;
};

export async function getAgregasiMengikutDaerah(): Promise<AgregasiDaerahRow[]> {
  const { data: markets } = await supabase.from("market").select("id, daerah");
  const { data: assignments } = await supabase.from("assignment").select("id, market_id, vendor_id");
  const { data: vendors } = await supabase.from("vendor").select("id, yuran_harian_sen");

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
  const { data: assignments } = await supabase
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
