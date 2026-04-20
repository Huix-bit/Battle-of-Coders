"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const VENDORS = [
  { id: "V01", name: "Mee Goreng Haji Ali",   stall: "B4", status: "open",    crowd: 95, sales: 312, verified: true,  flash: false },
  { id: "V02", name: "Ayam Percik Siti",       stall: "C2", status: "open",    crowd: 50, sales: 189, verified: true,  flash: true  },
  { id: "V03", name: "Cendol Pak Din",          stall: "A4", status: "open",    crowd: 85, sales: 445, verified: true,  flash: false },
  { id: "V04", name: "Nasi Lemak Wangi",        stall: "D3", status: "open",    crowd: 45, sales: 267, verified: true,  flash: false },
  { id: "V05", name: "Satay Jamilah",           stall: "B5", status: "open",    crowd: 88, sales: 389, verified: true,  flash: false },
  { id: "V06", name: "Kuih Muih Puan Ros",      stall: "F2", status: "open",    crowd: 20, sales: 134, verified: true,  flash: false },
  { id: "V07", name: "Rojak Buah Pak Zaini",    stall: "E5", status: "open",    crowd: 40, sales: 221, verified: true,  flash: true  },
  { id: "V08", name: "Ikan Bakar Hamidah",      stall: "C4", status: "open",    crowd: 80, sales: 501, verified: true,  flash: false },
  { id: "V09", name: "Keropok Lekor Azri",      stall: "F6", status: "open",    crowd: 25, sales: 88,  verified: true,  flash: false },
  { id: "V10", name: "Ahmad Burger Bakar",       stall: "D5", status: "phantom", crowd: 0,  sales: 0,   verified: false, flash: false },
  { id: "V11", name: "Burger Bakar Aman",        stall: "E3", status: "closed",  crowd: 0,  sales: 0,   verified: false, flash: false },
  { id: "V12", name: "Murtabak Rafiq",           stall: "B7", status: "absent",  crowd: 0,  sales: 0,   verified: false, flash: false },
];

const STATUS_CFG = {
  open:    { label: "Open",    dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10" },
  phantom: { label: "Phantom", dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10"     },
  closed:  { label: "Closed",  dot: "bg-[var(--muted)]", text: "text-[var(--muted)]", bg: "bg-[var(--raised)]" },
  absent:  { label: "Absent",  dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-400/10"   },
};

const ALERTS = [
  { type: "warning", icon: "⚠️", msg: "Phantom stall detected — Ahmad Burger Bakar (D5) not physically present" },
  { type: "info",    icon: "📍", msg: "Stall B4 (Mee Goreng Haji Ali) crowd at 95% — consider traffic diversion" },
  { type: "success", icon: "✓",  msg: "Attendance verified for 9 of 12 registered vendors tonight" },
];

export default function MonitorPage() {
  const [filter, setFilter] = useState<"all" | "open" | "phantom" | "absent">("all");
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 5000); return () => clearInterval(id); }, []);

  const filtered = filter === "all" ? VENDORS : VENDORS.filter((v) => v.status === filter);
  const open = VENDORS.filter((v) => v.status === "open").length;
  const phantoms = VENDORS.filter((v) => v.status === "phantom").length;
  const absent = VENDORS.filter((v) => v.status === "absent").length;
  const totalSales = VENDORS.reduce((s, v) => s + v.sales, 0);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/admin" className="hover:text-[var(--text)]">Admin</Link><span>/</span>
        <span className="text-[var(--text)]">Real-Time Monitor</span>
      </div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-bold text-[var(--text)]">📡 Real-Time Monitor</h1><p className="text-sm text-[var(--muted)]">Live vendor attendance, crowd density, and phantom stall detection</p></div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 inline-block" />Live · tick #{tick}</div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active Vendors", value: open, icon: "🟢", accent: "text-emerald-400" },
          { label: "Phantom Stalls", value: phantoms, icon: "👻", accent: "text-red-400" },
          { label: "Absent Tonight", value: absent, icon: "❌", accent: "text-amber-400" },
          { label: "Transactions", value: totalSales, icon: "💳", accent: "text-[var(--accent)]" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4">
            <span className="text-xl">{s.icon}</span>
            <p className={`mt-1 text-2xl font-bold ${s.accent}`}>{s.value}</p>
            <p className="text-xs text-[var(--muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {ALERTS.map((a) => (
          <div key={a.msg} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${a.type === "warning" ? "border-red-400/30 bg-red-400/5 text-red-300" : a.type === "info" ? "border-amber-400/30 bg-amber-400/5 text-amber-300" : "border-emerald-400/30 bg-emerald-400/5 text-emerald-300"}`}>
            <span>{a.icon}</span><p>{a.msg}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "open", "phantom", "absent"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all capitalize ${filter === f ? "bg-[var(--accent)] text-[var(--abyss)]" : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/30"}`}>
            {f === "all" ? "All Vendors" : f} {f !== "all" && `(${VENDORS.filter((v) => v.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Vendor table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--lifted)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Stall</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Crowd</th>
              <th className="px-4 py-3">Txns</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Flash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((v) => {
              const cfg = STATUS_CFG[v.status as keyof typeof STATUS_CFG];
              return (
                <tr key={v.id} className="hover:bg-[var(--raised)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--text)]">{v.name}</p>
                    <p className="text-[10px] text-[var(--muted)]">{v.id}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--secondary)]">{v.stall}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold w-fit ${cfg.bg} ${cfg.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {v.status === "open" ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-[var(--raised)] overflow-hidden">
                          <div className={`h-full rounded-full ${v.crowd >= 80 ? "bg-red-500" : v.crowd >= 50 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${v.crowd}%` }} />
                        </div>
                        <span className="text-xs text-[var(--muted)]">{v.crowd}%</span>
                      </div>
                    ) : <span className="text-[var(--muted)]">—</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[var(--secondary)]">{v.sales || "—"}</td>
                  <td className="px-4 py-3">{v.verified ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✕</span>}</td>
                  <td className="px-4 py-3">{v.flash ? <span className="text-amber-400">⚡</span> : <span className="text-[var(--muted)]">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
