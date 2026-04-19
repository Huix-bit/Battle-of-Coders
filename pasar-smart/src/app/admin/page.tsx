import Link from "next/link";
import { AdminDashboard, type TimetableRow, type TrackerRow } from "@/components/admin-dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PIPELINE = new Set(["DIJADUALKAN", "DISAHKAN", "BERJALAN"]);

type AssignmentJoinRow = {
  id: string;
  market_id: string;
  tarikh_mula: string;
  petak_stall: string | null;
  status: string;
  vendor: { nama_perniagaan: string } | null;
  market: { nama_pasar: string } | null;
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const [assignmentsRes, marketsRes] = await Promise.all([
    supabase
      .from("assignment")
      .select("id, market_id, tarikh_mula, petak_stall, status, vendor (*), market (*)")
      .order("tarikh_mula", { ascending: true }),
    supabase.from("market").select("id, nama_pasar, daerah, status").order("nama_pasar", { ascending: true }),
  ]);

  const assignments = (assignmentsRes.data ?? []) as unknown as AssignmentJoinRow[];
  const markets = marketsRes.data ?? [];

  const timetable: TimetableRow[] = assignments.map((a) => ({
    id: a.id,
    tarikhMula: a.tarikh_mula,
    vendorName: a.vendor?.nama_perniagaan ?? "",
    marketName: a.market?.nama_pasar ?? "",
    petak: a.petak_stall ?? null,
    status: a.status,
  }));

  const countsByMarket = new Map<string, number>();
  for (const a of assignments) {
    if (!PIPELINE.has(a.status)) continue;
    countsByMarket.set(a.market_id, (countsByMarket.get(a.market_id) ?? 0) + 1);
  }

  const tracker: TrackerRow[] = markets.map((m) => ({
    marketId: m.id,
    namaPasar: m.nama_pasar,
    daerah: m.daerah,
    marketStatus: m.status,
    pipelineCount: countsByMarket.get(m.id) ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Pentadbir</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--accent-strong)]">Papan pemuka Smart Night Market</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Pantau jadual penugasan dan status tapak; urus gerai daripada skrin gerai di bawah.
          </p>
        </div>
        <Link
          href="/gerai"
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-95"
        >
          Pengurusan gerai
        </Link>
      </div>
      <AdminDashboard timetable={timetable} tracker={tracker} />
    </div>
  );
}
