"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MarketRow, AssignmentRow, VendorOption } from "./jadual-panel";

export function AssignmentsSummary({ markets, vendors, assignments }: { markets: MarketRow[]; vendors: VendorOption[]; assignments: AssignmentRow[] }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default: next assignment date if available (local), else today
    if (assignments.length > 0) {
      const dates = assignments.map((a) => {
        const d = new Date(a.tarikhMula);
        d.setHours(0, 0, 0, 0);
        return d;
      }).sort((a, b) => a.getTime() - b.getTime());
      const today = new Date();
      today.setHours(0,0,0,0);
      const next = dates.find((dt) => dt.getTime() >= today.getTime()) ?? dates[0];
      return next.toISOString().slice(0,10);
    }
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });

  function toLocalYYYYMMDD(d: string | Date) {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const dayAssignments = useMemo(() => {
    const target = selectedDate; // YYYY-MM-DD local
    return assignments.filter((a) => {
      const startDate = toLocalYYYYMMDD(a.tarikhMula);
      const endDate = a.tarikhTamat ? toLocalYYYYMMDD(a.tarikhTamat) : null;
      if (endDate) return startDate <= target && target <= endDate;
      return startDate === target;
    });
  }, [assignments, selectedDate]);

  const totalAssignments = dayAssignments.length;

  const feesRM = useMemo(() => {
    const sumSen = dayAssignments.reduce((acc, a) => {
      const v = vendors.find((vv) => vv.id === a.vendorId);
      return acc + (v?.yuranHarianSen ?? 0);
    }, 0);
    return (sumSen / 100).toFixed(2);
  }, [dayAssignments, vendors]);

  const byDistrict = useMemo(() => {
    const map = new Map<string, { count: number; capacitySum: number }>();
    for (const a of dayAssignments) {
      const m = markets.find((mm) => mm.id === a.marketId);
      const daerah = m?.daerah ?? "unknown";
      const cap = (m as any)?.kapasiti ?? null;
      const cur = map.get(daerah) ?? { count: 0, capacitySum: 0 };
      cur.count += 1;
      if (typeof cap === "number") cur.capacitySum += cap;
      map.set(daerah, cur);
    }
    const arr = Array.from(map.entries()).map(([daerah, v]) => {
      const pct = v.capacitySum > 0 ? Math.round((v.count / v.capacitySum) * 100) : (totalAssignments > 0 ? Math.round((v.count / totalAssignments) * 100) : 0);
      return { daerah, count: v.count, pct };
    });
    return arr;
  }, [dayAssignments, markets, totalAssignments]);

  const assignmentMap = useMemo(() => {
    const out: Record<string, string> = {};
    for (const a of dayAssignments) {
      out[a.vendorId] = a.petakStall ?? "—";
    }
    return out;
  }, [dayAssignments]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">Date</span>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2" />
          </label>
          <Link href="#assignments" className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">Schedule assignment</Link>
        </div>

        <div className="flex items-center gap-2">
          <a href={`/api/laporan/csv?jenis=butiran&date=${selectedDate}`} className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] px-3 py-2 text-sm font-medium text-[var(--text)]">Export CSV</a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Total assignments</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">{totalAssignments}</p>
          <p className="text-sm text-[var(--muted)]">on {selectedDate}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Estimated fees</p>
          <p className="mt-2 text-2xl font-bold text-amber-400">RM {feesRM}</p>
          <p className="text-sm text-[var(--muted)]">daily total (RM)</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Occupancy by district</p>
          <div className="mt-2 space-y-2">
            {byDistrict.length === 0 && <p className="text-sm text-[var(--muted)]">No assignments</p>}
            {byDistrict.map((d) => (
              <div key={d.daerah} className="flex items-center justify-between gap-2">
                <div className="text-sm text-[var(--text)]">{d.daerah}</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-[var(--muted)]">{d.count}</div>
                  <div className="text-xs text-[var(--muted)]">{d.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AssignmentsTable assignments={dayAssignments} vendors={vendors} assignmentMap={assignmentMap} markets={markets} />
    </div>
  );
}

export function AssignmentsTable({ assignments, vendors, assignmentMap, markets }: { assignments: AssignmentRow[]; vendors: VendorOption[]; assignmentMap: Record<string, string>; markets: MarketRow[] }) {
  return (
    <div id="assignments" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="mb-3 font-semibold text-[var(--accent-strong)]">Assignments</h3>
      {assignments.length === 0 ? (
        <div className="text-sm text-[var(--muted)]">No assignments for the selected date.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-xs text-[var(--muted)]">
                <th className="pr-4">Vendor</th>
                <th className="pr-4">Market</th>
                <th className="pr-4">Stall</th>
                <th className="pr-4">Start</th>
                <th className="pr-4">End</th>
                <th className="pr-4">Fee (RM)</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const v = vendors.find((vv) => vv.id === a.vendorId);
                const m = markets.find((mm) => mm.id === a.marketId);
                return (
                  <tr key={a.id} className="border-t border-[var(--border)]">
                    <td className="py-2 text-sm">{v?.namaPerniagaan ?? a.vendorName}</td>
                    <td className="py-2 text-sm">{m?.namaPasar ?? a.marketName}</td>
                    <td className="py-2 text-sm font-mono">{assignmentMap[a.vendorId] ?? a.petakStall ?? "—"}</td>
                    <td className="py-2 text-sm">{new Date(a.tarikhMula).toLocaleString()}</td>
                    <td className="py-2 text-sm">{a.tarikhTamat ? new Date(a.tarikhTamat).toLocaleString() : "—"}</td>
                    <td className="py-2 text-sm">RM {( (v?.yuranHarianSen ?? 0) / 100 ).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
