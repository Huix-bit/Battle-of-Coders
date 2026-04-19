import Link from "next/link";
import { SUPABASE_CONFIGURED } from "@/lib/supabaseClient";
import { labelDaerah } from "@/lib/melaka";
import { senToRmLabel } from "@/lib/money";
import { getAgregasiMengikutDaerah } from "@/lib/reports";

export const dynamic = "force-dynamic";

// Mock district summary for demo mode
const MOCK_REPORT = [
  { daerah: "BUKIT_BERUANG",  bil_penugasan: 14, bil_tapak: 2, anggaran_yuran_sen: 35000 },
  { daerah: "AYER_KEROH",     bil_penugasan: 11, bil_tapak: 2, anggaran_yuran_sen: 28500 },
  { daerah: "MELAKA_TENGAH",  bil_penugasan: 12, bil_tapak: 2, anggaran_yuran_sen: 30000 },
  { daerah: "ALOR_GAJAH",     bil_penugasan:  5, bil_tapak: 1, anggaran_yuran_sen: 12000 },
  { daerah: "JASIN",          bil_penugasan:  5, bil_tapak: 1, anggaran_yuran_sen: 11000 },
];

export default async function LaporanPage() {
  const agregasi = SUPABASE_CONFIGURED
    ? await getAgregasiMengikutDaerah()
    : MOCK_REPORT;

  return (
    <div className="space-y-8">
      {!SUPABASE_CONFIGURED && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
          <span className="text-lg">⚡</span>
          <span><strong>Demo mode</strong> — showing sample report data. CSV downloads require a live Supabase connection.</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Business Reports</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Data aggregated from the database using{" "}
          <code className="rounded bg-[var(--raised)] px-1">GROUP BY</code> and{" "}
          <code className="rounded bg-[var(--raised)] px-1">JOIN</code> — download CSV for Excel or further analysis.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--accent)]">Summary by district</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Number of assignments, unique sites, and estimated total daily stall fees (based on current records).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="py-2 pr-4 font-medium">District</th>
                <th className="py-2 pr-4 font-medium">Assignments</th>
                <th className="py-2 pr-4 font-medium">Sites</th>
                <th className="py-2 font-medium">Est. fees (RM)</th>
              </tr>
            </thead>
            <tbody>
              {agregasi.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[var(--muted)]">
                    No data — add sites and assignments in the schedule module.
                  </td>
                </tr>
              ) : (
                agregasi.map((r) => (
                  <tr key={r.daerah} className="border-b border-[var(--border-subtle)]">
                    <td className="py-3 pr-4 text-[var(--text)]">{labelDaerah(r.daerah)}</td>
                    <td className="py-3 pr-4 tabular-nums text-[var(--secondary)]">{r.bil_penugasan}</td>
                    <td className="py-3 pr-4 tabular-nums text-[var(--secondary)]">{r.bil_tapak}</td>
                    <td className="py-3 tabular-nums text-[var(--accent)]">{senToRmLabel(r.anggaran_yuran_sen)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {SUPABASE_CONFIGURED ? (
            <>
              <a href="/api/laporan/csv?jenis=daerah" className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--abyss)] hover:opacity-95">
                Download CSV (by district)
              </a>
              <a href="/api/laporan/csv?jenis=butiran" className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--raised)]">
                Download CSV (assignment details)
              </a>
            </>
          ) : (
            <span className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm text-[var(--muted)]">
              CSV download requires live Supabase connection
            </span>
          )}
          <Link href="/jadual" className="text-sm text-[var(--muted)] underline-offset-2 hover:underline">
            Back to schedule
          </Link>
        </div>
      </section>
    </div>
  );
}
