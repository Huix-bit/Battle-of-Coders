import { SUPABASE_CONFIGURED } from "@/lib/supabaseClient";
import { getAgregasiPasarByDate, getNextAssignmentDate } from "@/lib/reports";
import ReportsClient from "@/components/reports-client";

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
  const initialDate = SUPABASE_CONFIGURED ? await getNextAssignmentDate() : new Date().toISOString().slice(0,10);
  const agregasi = SUPABASE_CONFIGURED
    ? await getAgregasiPasarByDate(initialDate)
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
      </div>

      <ReportsClient initialData={agregasi} initialDate={initialDate} />
    </div>
  );
}
