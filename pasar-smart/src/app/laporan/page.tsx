import Link from "next/link";
import { labelDaerah } from "@/lib/melaka";
import { senToRmLabel } from "@/lib/money";
import { getAgregasiMengikutDaerah } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function LaporanPage() {
  const agregasi = await getAgregasiMengikutDaerah();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--accent-strong)]">Laporan perniagaan</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Data dikumpulkan di pangkalan data menggunakan <code className="rounded bg-[var(--surface)] px-1">GROUP BY</code>{" "}
          dan <code className="rounded bg-[var(--surface)] px-1">JOIN</code> — muat turun CSV untuk Excel atau analisis
          lanjut.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--accent-strong)]">Ringkasan mengikut daerah</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Bilangan penugasan, bilangan tapak unik, dan anggaran jumlah yuran harian penjaja (berdasarkan rekod semasa).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="py-2 pr-4 font-medium">Daerah</th>
                <th className="py-2 pr-4 font-medium">Penugasan</th>
                <th className="py-2 pr-4 font-medium">Tapak (petak pasar)</th>
                <th className="py-2 font-medium">Anggaran yuran (RM)</th>
              </tr>
            </thead>
            <tbody>
              {agregasi.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[var(--muted)]">
                    Tiada data — tambah tapak dan penugasan di modul jadual.
                  </td>
                </tr>
              ) : (
                agregasi.map((r) => (
                  <tr key={r.daerah} className="border-b border-[var(--border)]/80">
                    <td className="py-3 pr-4">{labelDaerah(r.daerah)}</td>
                    <td className="py-3 pr-4 tabular-nums">{r.bil_penugasan}</td>
                    <td className="py-3 pr-4 tabular-nums">{r.bil_tapak}</td>
                    <td className="py-3 tabular-nums">{senToRmLabel(r.anggaran_yuran_sen)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/api/laporan/csv?jenis=daerah"
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-95"
          >
            Muat turun CSV (daerah)
          </a>
          <a
            href="/api/laporan/csv?jenis=butiran"
            className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface)]"
          >
            Muat turun CSV (butiran penugasan)
          </a>
          <Link href="/jadual" className="text-sm text-[var(--muted)] underline-offset-2 hover:underline">
            Kembali ke jadual
          </Link>
        </div>
      </section>
    </div>
  );
}
