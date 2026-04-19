import Link from "next/link";
import { DAERAH_LABEL, type DaerahKey } from "@/lib/melaka";
import {
  ASSIGNMENT_STATUS_LABEL,
  MARKET_STATUS_LABEL,
  type AssignmentStatus,
  type MarketStatus,
} from "@/lib/status";

export type TimetableRow = {
  id: string;
  tarikhMula: string;
  vendorName: string;
  marketName: string;
  petak: string | null;
  status: string;
};

export type TrackerRow = {
  marketId: string;
  namaPasar: string;
  daerah: string;
  marketStatus: string;
  pipelineCount: number;
};

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("ms-MY", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AdminDashboard(props: {
  timetable: TimetableRow[];
  tracker: TrackerRow[];
}) {
  const { timetable, tracker } = props;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--accent-strong)]">Jadual acara penugasan</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Susunan masa penjaja → tapak (penugasan mengikut tarikh mula).
            </p>
          </div>
          <Link
            href="/jadual"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface)]"
          >
            Urus jadual penuh
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="py-2 pr-4 font-medium">Masa mula</th>
                <th className="py-2 pr-4 font-medium">Penjaja</th>
                <th className="py-2 pr-4 font-medium">Tapak</th>
                <th className="py-2 pr-4 font-medium">Petak</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {timetable.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-[var(--muted)]">
                    Tiada penugasan — tambah di halaman Jadual.
                  </td>
                </tr>
              ) : (
                timetable.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 pr-4 tabular-nums">{fmtWhen(row.tarikhMula)}</td>
                    <td className="py-3 pr-4">{row.vendorName}</td>
                    <td className="py-3 pr-4">{row.marketName}</td>
                    <td className="py-3 pr-4">{row.petak ?? "—"}</td>
                    <td className="py-3">
                      {ASSIGNMENT_STATUS_LABEL[row.status as AssignmentStatus] ?? row.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--accent-strong)]">Penjejak jadual tapak pasar</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Status tapak dan bilangan penugasan aktif (dijadualkan / disahkan / sedang berjalan).
            </p>
          </div>
          <Link
            href="/gerai"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            Urus gerai
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {tracker.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Tiada tapak pasar dalam rekod.</p>
          ) : (
            tracker.map((t) => (
              <div
                key={t.marketId}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <p className="font-medium text-[var(--accent-strong)]">{t.namaPasar}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {DAERAH_LABEL[t.daerah as DaerahKey] ?? t.daerah} ·{" "}
                  {MARKET_STATUS_LABEL[t.marketStatus as MarketStatus] ?? t.marketStatus}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{t.pipelineCount}</p>
                <p className="text-xs text-[var(--muted)]">Penugasan dalam saluran aktif</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
