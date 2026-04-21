"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";

const STATUS_CFG = {
  open:    { label: "Open",    dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10" },
  phantom: { label: "Phantom", dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10"     },
  closed:  { label: "Closed",  dot: "bg-[var(--muted)]", text: "text-[var(--muted)]", bg: "bg-[var(--raised)]" },
  absent:  { label: "Absent",  dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-400/10"   },
};

type VendorStatus = keyof typeof STATUS_CFG;

interface VendorRow {
  id: string;
  name: string;
  stall: string;
  status: VendorStatus;
  crowd: number;
  sales: number;
  verified: boolean;
  flash: boolean;
}

export default function MonitorPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | VendorStatus>("all");
  const [tick, setTick] = useState(0);

  async function fetchData() {
    if (!SUPABASE_CONFIGURED) { setLoading(false); return; }
    try {
      // 1. All active vendors
      const { data: vendorRows } = await supabase
        .from("vendor")
        .select("id, nama_perniagaan")
        .eq("status", "AKTIF");

      if (!vendorRows || vendorRows.length === 0) { setVendors([]); setLoading(false); return; }
      const ids = vendorRows.map((v: any) => v.id);

      // 2. Stall presence & stall number
      const { data: stallRows } = await supabase
        .from("stall_status")
        .select("vendor_id, is_present, current_stall_number")
        .in("vendor_id", ids);

      // 3. Assignment stall codes (fallback stall number)
      const { data: assignRows } = await supabase
        .from("assignment")
        .select("vendor_id, petak_stall")
        .in("vendor_id", ids)
        .eq("status", "DIJADUALKAN");

      // 4. Active flash sales
      const now = new Date().toISOString();
      const { data: flashRows } = await supabase
        .from("flash_sale")
        .select("vendor_id")
        .in("vendor_id", ids)
        .eq("is_active", true)
        .gt("end_time", now);

      // 5. Today's analytics (txns / sales)
      const today = new Date().toISOString().slice(0, 10);
      const { data: analyticsRows } = await supabase
        .from("vendor_analytics")
        .select("vendor_id, total_quantity_sold")
        .in("vendor_id", ids)
        .eq("date", today);

      const stallMap = new Map((stallRows ?? []).map((s: any) => [s.vendor_id, s]));
      const assignMap = new Map((assignRows ?? []).map((a: any) => [a.vendor_id, a.petak_stall]));
      const flashSet = new Set((flashRows ?? []).map((f: any) => f.vendor_id));
      const analyticsMap = new Map((analyticsRows ?? []).map((a: any) => [a.vendor_id, a.total_quantity_sold ?? 0]));

      const rows: VendorRow[] = vendorRows.map((v: any) => {
        const stall = stallMap.get(v.id);
        const stallCode = stall?.current_stall_number || assignMap.get(v.id) || "—";
        const isPresent = stall?.is_present ?? false;
        return {
          id: v.id.slice(0, 6).toUpperCase(),
          name: v.nama_perniagaan,
          stall: stallCode,
          status: isPresent ? "open" : "absent",
          crowd: 0,
          sales: analyticsMap.get(v.id) ?? 0,
          verified: isPresent,
          flash: flashSet.has(v.id),
        };
      });

      setVendors(rows);
    } catch (e) {
      console.error("Monitor fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(() => {
      setTick((t) => t + 1);
      fetchData();
    }, 10000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = filter === "all" ? vendors : vendors.filter((v) => v.status === filter);
  const open     = vendors.filter((v) => v.status === "open").length;
  const phantoms = vendors.filter((v) => v.status === "phantom").length;
  const absent   = vendors.filter((v) => v.status === "absent").length;
  const totalSales = vendors.reduce((s, v) => s + v.sales, 0);

  // Dynamic alerts
  const alerts: { type: string; icon: string; msg: string }[] = [];
  const busy = vendors.filter((v) => v.status === "open" && v.crowd >= 80);
  if (busy.length > 0) alerts.push({ type: "info", icon: "📍", msg: `${busy[0].name} (${busy[0].stall}) crowd high — consider traffic diversion` });
  const phantomList = vendors.filter((v) => v.status === "phantom");
  phantomList.forEach((v) => alerts.push({ type: "warning", icon: "⚠️", msg: `Phantom stall detected — ${v.name} (${v.stall}) not physically present` }));
  if (open > 0) alerts.push({ type: "success", icon: "✓", msg: `Attendance verified for ${open} of ${vendors.length} registered vendors tonight` });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/admin" className="hover:text-[var(--text)]">Admin</Link><span>/</span>
        <span className="text-[var(--text)]">Real-Time Monitor</span>
      </div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">📡 Real-Time Monitor</h1>
          <p className="text-sm text-[var(--muted)]">Live vendor attendance, crowd density, and phantom stall detection</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 inline-block" />
          Live · tick #{tick}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active Vendors",  value: loading ? "…" : open,        icon: "🟢", accent: "text-emerald-400" },
          { label: "Phantom Stalls",  value: loading ? "…" : phantoms,    icon: "👻", accent: "text-red-400" },
          { label: "Absent Tonight",  value: loading ? "…" : absent,      icon: "❌", accent: "text-amber-400" },
          { label: "Transactions",    value: loading ? "…" : totalSales,  icon: "💳", accent: "text-[var(--accent)]" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4">
            <span className="text-xl">{s.icon}</span>
            <p className={`mt-1 text-2xl font-bold ${s.accent}`}>{s.value}</p>
            <p className="text-xs text-[var(--muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${a.type === "warning" ? "border-red-400/30 bg-red-400/5 text-red-300" : a.type === "info" ? "border-amber-400/30 bg-amber-400/5 text-amber-300" : "border-emerald-400/30 bg-emerald-400/5 text-emerald-300"}`}>
              <span>{a.icon}</span><p>{a.msg}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "open", "phantom", "absent"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all capitalize ${filter === f ? "bg-[var(--accent)] text-[var(--abyss)]" : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/30"}`}>
            {f === "all" ? `All Vendors${!loading ? ` (${vendors.length})` : ""}` : `${f} (${vendors.filter((v) => v.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Vendor table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--lifted)]">
        {loading ? (
          <div className="py-16 text-center text-sm text-[var(--muted)]">Loading live vendor data…</div>
        ) : vendors.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--muted)]">No vendors found. Register vendors to see them here.</div>
        ) : (
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
                const cfg = STATUS_CFG[v.status];
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
                      {v.status === "open" && v.crowd > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-[var(--raised)] overflow-hidden">
                            <div className={`h-full rounded-full ${v.crowd >= 80 ? "bg-red-500" : v.crowd >= 50 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${v.crowd}%` }} />
                          </div>
                          <span className="text-xs text-[var(--muted)]">{v.crowd}%</span>
                        </div>
                      ) : <span className="text-[var(--muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[var(--secondary)]">{v.sales > 0 ? v.sales : "—"}</td>
                    <td className="px-4 py-3">{v.verified ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✕</span>}</td>
                    <td className="px-4 py-3">{v.flash ? <span className="text-amber-400">⚡</span> : <span className="text-[var(--muted)]">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
