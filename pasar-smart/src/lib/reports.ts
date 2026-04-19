import { prisma } from "./prisma";

/** Agregasi GROUP BY di peringkat pangkalan data (SQLite) — insight mengikut daerah */
export type AgregasiDaerahRow = {
  daerah: string;
  bil_penugasan: number;
  bil_tapak: number;
  anggaran_yuran_sen: number;
};

export async function getAgregasiMengikutDaerah(): Promise<AgregasiDaerahRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      daerah: string;
      bil_penugasan: bigint | number | null;
      bil_tapak: bigint | number | null;
      anggaran_yuran_sen: bigint | number | null;
    }>
  >`
    SELECT
      m.daerah AS daerah,
      COUNT(a.id) AS bil_penugasan,
      COUNT(DISTINCT m.id) AS bil_tapak,
      COALESCE(SUM(v."yuranHarianSen"), 0) AS anggaran_yuran_sen
    FROM Market m
    LEFT JOIN Assignment a ON a."marketId" = m.id
    LEFT JOIN Vendor v ON v.id = a."vendorId"
    GROUP BY m.daerah
    ORDER BY m.daerah ASC
  `;
  return rows.map((r) => ({
    daerah: r.daerah,
    bil_penugasan: Number(r.bil_penugasan ?? 0),
    bil_tapak: Number(r.bil_tapak ?? 0),
    anggaran_yuran_sen: Number(r.anggaran_yuran_sen ?? 0),
  }));
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
  const rows = await prisma.$queryRaw<
    Array<{
      nama_penjaja: string;
      jenis_jualan: string;
      nama_pasar: string;
      daerah: string;
      tarikh_mula: Date;
      status_penugasan: string;
      petak: string | null;
    }>
  >`
    SELECT
      v."namaPerniagaan" AS nama_penjaja,
      v."jenisJualan" AS jenis_jualan,
      m."namaPasar" AS nama_pasar,
      m.daerah AS daerah,
      a."tarikhMula" AS tarikh_mula,
      a.status AS status_penugasan,
      a."petakStall" AS petak
    FROM Assignment a
    INNER JOIN Vendor v ON v.id = a."vendorId"
    INNER JOIN Market m ON m.id = a."marketId"
    ORDER BY a."tarikhMula" ASC
  `;
  return rows.map((r) => ({
    nama_penjaja: r.nama_penjaja,
    jenis_jualan: r.jenis_jualan,
    nama_pasar: r.nama_pasar,
    daerah: r.daerah,
    tarikh_mula: r.tarikh_mula.toISOString(),
    status_penugasan: r.status_penugasan,
    petak: r.petak,
  }));
}
