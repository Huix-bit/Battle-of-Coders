"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";

type ZoneType = "hot" | "warm" | "cold" | "empty" | "phantom";
interface Zone { id: string; row: number; col: number; type: ZoneType; vendor?: string; crowd?: number; }

const ZONE_CFG: Record<ZoneType, { label: string; bg: string; text: string; border: string; dot: string }> = {
  hot:     { label: "Hot Zone",     bg: "bg-red-500/25",     text: "text-white", border: "border-red-500/50",     dot: "bg-red-400"     },
  warm:    { label: "Warm Zone",    bg: "bg-amber-500/20",   text: "text-white", border: "border-amber-500/40",   dot: "bg-amber-400"   },
  cold:    { label: "Cold Zone",    bg: "bg-blue-500/15",    text: "text-white", border: "border-blue-500/30",    dot: "bg-blue-400"    },
  empty:   { label: "Available",    bg: "bg-[var(--raised)]",text: "text-white", border: "border-dashed border-[var(--border)]", dot: "bg-[var(--muted)]" },
  phantom: { label: "Phantom Stall",bg: "bg-red-900/30",     text: "text-white", border: "border-red-400/50",     dot: "bg-red-400"     },
};

const SUGGESTIONS = [
  { icon: "🔄", type: "reassign",    priority: "High",   title: "Move Snacks (A1) to B1", desc: "A1 cold zone near entrance. Move to empty B1 adjacent to Nasi Lemak — cross-sell potential.", savings: "+35% traffic est." },
  { icon: "🚫", type: "phantom",     priority: "Urgent", title: "Remove Ahmad Burger (B7)", desc: "Stall marked absent 3 nights in a row. Remove from map to prevent phantom stall confusion.", savings: "Trust +12 pts" },
  { icon: "📍", type: "reposition",  priority: "Medium", title: "Expand Row A hot zone", desc: "A3–A5 consistently >80% crowd. Consider splitting stalls or adding C5/C6 as overflow.", savings: "Queue -20%" },
  { icon: "💡", type: "suggestion",  priority: "Low",    title: "Add drinks stall to Row C", desc: "Row C lacks drink vendors. Adding one near C4 would serve the warm zone crowd.", savings: "+RM 800/night est." },
];

const PRIORITY_CFG: Record<string, string> = {
  Urgent: "bg-red-400/20 text-red-400 border-red-400/30",
  High:   "bg-amber-400/20 text-amber-400 border-amber-400/30",
  Medium: "bg-blue-400/20 text-blue-400 border-blue-400/30",
  Low:    "bg-[var(--raised)] text-[var(--muted)] border-[var(--border)]",
};

// Parse stall code like "A01" → { row: 0, col: 0 }
function parseStallCode(code: string | null): { row: number; col: number } | null {
  if (!code) return null;
  const rowChar = code[0]?.toUpperCase();
  const colStr = code.slice(1).replace(/^0+/, "") || "1";
  const row = rowChar ? rowChar.charCodeAt(0) - 65 : -1;
  const col = parseInt(colStr, 10) - 1;
  if (row < 0 || isNaN(col) || col < 0) return null;
  return { row, col };
}

export default function LayoutPage() {
  const [zoneData, setZoneData] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Zone | null>(null);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setLoading(false); return; }
    async function fetchLayout() {
      try {
        // All vendors (admin sees everyone regardless of status)
        const { data: vendorRows } = await supabase
          .from("vendor")
          .select("id, nama_perniagaan, status")
          .order("created_at", { ascending: true });

        if (!vendorRows || vendorRows.length === 0) { setLoading(false); return; }
        const ids = vendorRows.map((v: any) => v.id);
        const vendorNameMap = new Map(vendorRows.map((v: any) => [v.id, v.nama_perniagaan as string]));

        // Assignments (stall positions)
        const { data: assignments } = await supabase
          .from("assignment")
          .select("vendor_id, petak_stall")
          .in("vendor_id", ids)
          .eq("status", "DIJADUALKAN");

        // Stall presence
        const { data: stallStatus } = await supabase
          .from("stall_status")
          .select("vendor_id, is_present, current_stall_number")
          .in("vendor_id", ids);

        const assignMap = new Map((assignments ?? []).map((a: any) => [a.vendor_id, a.petak_stall as string]));
        const presenceMap = new Map((stallStatus ?? []).map((s: any) => [s.vendor_id, s]));

        const zones: Zone[] = [];
        const usedCells = new Set<string>();
        const placedVendors = new Set<string>();

        // Pass 1: place vendors that have a UNIQUE, valid stall code
        for (const v of vendorRows) {
          const stall = presenceMap.get(v.id);
          const stallCode = stall?.current_stall_number || assignMap.get(v.id);
          const pos = parseStallCode(stallCode ?? null);
          if (!pos) continue;
          const cellKey = `${pos.row}-${pos.col}`;
          if (usedCells.has(cellKey)) continue; // cell already taken by another vendor
          usedCells.add(cellKey);
          placedVendors.add(v.id);
          const isPresent = stall?.is_present ?? false;
          const vStatus = (v as any).status;
          zones.push({
            id: stallCode!,
            row: pos.row,
            col: pos.col,
            type: isPresent ? "hot" : vStatus === "AKTIF" ? "warm" : "cold",
            vendor: vendorNameMap.get(v.id) ?? v.id,
          });
        }

        // Pass 2: auto-place every vendor that wasn't placed in pass 1
        const GRID_COLS = 7;
        const GRID_ROWS = 3;
        let autoRow = 0;
        let autoCol = 0;

        function nextFreeCell() {
          while (autoRow < GRID_ROWS) {
            if (!usedCells.has(`${autoRow}-${autoCol}`)) return true;
            autoCol++;
            if (autoCol >= GRID_COLS) { autoCol = 0; autoRow++; }
          }
          return false;
        }

        for (const v of vendorRows) {
          if (placedVendors.has(v.id)) continue;
          if (!nextFreeCell()) break;
          const cellKey = `${autoRow}-${autoCol}`;
          usedCells.add(cellKey);
          const isPresent = presenceMap.get(v.id)?.is_present ?? false;
          const vStatus = (v as any).status;
          zones.push({
            id: `${String.fromCharCode(65 + autoRow)}${autoCol + 1}`,
            row: autoRow,
            col: autoCol,
            type: isPresent ? "hot" : vStatus === "AKTIF" ? "warm" : "cold",
            vendor: vendorNameMap.get(v.id) ?? v.id,
          });
          autoCol++;
          if (autoCol >= GRID_COLS) { autoCol = 0; autoRow++; }
        }

        setZoneData(zones);
      } catch (e) {
        console.error("Layout fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLayout();
  }, []);

  // Determine grid dimensions from data
  const maxRow = zoneData.length > 0 ? Math.max(...zoneData.map((z) => z.row), 2) : 2;
  const maxCol = zoneData.length > 0 ? Math.max(...zoneData.map((z) => z.col), 6) : 6;
  const rows = Array.from({ length: maxRow + 1 }, (_, i) => i);
  const cols = Array.from({ length: maxCol + 1 }, (_, i) => i);


  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/admin" className="hover:text-[var(--text)]">Admin</Link><span>/</span>
        <span className="text-[var(--text)]">Layout Optimizer</span>
      </div>
      <div><h1 className="text-2xl font-bold text-[var(--text)]">🗺️ Layout Optimizer</h1><p className="text-sm text-[var(--muted)]">Crowd-flow visualization with auto-healing stall reassignment suggestions</p></div>

      {/* Zone stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Hot Zones",     value: loading ? "…" : zoneData.filter((z) => z.type === "hot").length,     dot: "bg-red-400",     accent: "text-red-400"     },
          { label: "Warm Zones",    value: loading ? "…" : zoneData.filter((z) => z.type === "warm").length,    dot: "bg-amber-400",   accent: "text-amber-400"   },
          { label: "Cold Zones",    value: loading ? "…" : zoneData.filter((z) => z.type === "cold").length,    dot: "bg-blue-400",    accent: "text-blue-400"    },
          { label: "Phantom Stalls",value: loading ? "…" : zoneData.filter((z) => z.type === "phantom").length, dot: "bg-red-400",     accent: "text-red-400"     },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4">
            <div className="flex items-center gap-2 mb-1"><span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /><span className="text-xs text-[var(--muted)]">{s.label}</span></div>
            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {(Object.entries(ZONE_CFG) as [ZoneType, typeof ZONE_CFG[ZoneType]][]).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-4 rounded-sm ${cfg.dot} opacity-80`} />
                <span className={cfg.text}>{cfg.label}</span>
              </div>
            ))}
          </div>

          {/* Stall grid */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)]/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-[var(--muted)]">
              <span>← Entrance</span><div className="h-px flex-1 border-t border-dashed border-[var(--border)]" /><span>Exit →</span>
            </div>
            {loading ? (
              <div className="py-12 text-center text-sm text-[var(--muted)]">Loading stall layout…</div>
            ) : (
            <div className="space-y-2">
              {rows.map((ri) => (
                <div key={ri} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-[10px] font-bold text-[var(--muted)]">{String.fromCharCode(65 + ri)}</span>
                  {cols.map((ci) => {
                    const zone = zoneData.find((z) => z.row === ri && z.col === ci);
                    if (!zone) return <div key={ci} className="h-14 flex-1 rounded-lg bg-[var(--raised)]/20" />;
                    const cfg = ZONE_CFG[zone.type];
                    return (
                      <button
                        key={ci}
                        onClick={() => setSelected(zone)}
                        className={`relative h-14 flex-1 rounded-lg border text-[10px] font-bold transition-all hover:scale-105 hover:z-10 ${cfg.bg} ${cfg.border} ${cfg.text} ${selected?.id === zone.id ? "ring-2 ring-[var(--accent)] scale-105 z-10" : ""}`}
                        title={zone.vendor ?? zone.id}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] leading-tight px-1 text-center opacity-80">
                          {zone.type === "empty" ? "+" : zone.type === "phantom" ? "👻" : zone.vendor?.split(" ")[0]}
                        </span>
                        <span className="absolute bottom-0.5 left-0 right-0 text-center text-[7px] opacity-60">{zone.id}</span>
                        {zone.type === "phantom" && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-400 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="flex gap-2 pl-7">
                {cols.map((c) => <span key={c} className="flex-1 text-center text-[10px] text-[var(--muted)]">{c + 1}</span>)}
              </div>
            </div>
            )}
          </div>

          {/* Selected zone detail */}
          {selected && (
            <div className={`rounded-2xl border p-5 ${ZONE_CFG[selected.type].border} ${ZONE_CFG[selected.type].bg}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${ZONE_CFG[selected.type].text}`}>{ZONE_CFG[selected.type].label}</span>
                  <p className="mt-0.5 font-bold text-[var(--text)]">{selected.vendor ?? `Empty Slot — ${selected.id}`}</p>
                  <p className="text-xs text-[var(--muted)]">Zone {selected.id}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">✕</button>
              </div>
              {selected.crowd !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-[var(--muted)] mb-1"><span>Crowd density</span><span>{selected.crowd}%</span></div>
                  <div className="h-2 w-full rounded-full bg-[var(--raised)] overflow-hidden">
                    <div className={`h-full rounded-full ${selected.crowd >= 80 ? "bg-red-500" : selected.crowd >= 40 ? "bg-amber-400" : "bg-blue-400"}`} style={{ width: `${selected.crowd}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Auto-healing suggestions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-[var(--accent-strong)]">🤖 Auto-Healing Suggestions</h3>
          <p className="text-xs text-[var(--muted)]">AI-generated reassignments to balance traffic flow</p>
          {SUGGESTIONS.map((s, i) => (
            <div key={s.title} className={`rounded-xl border bg-[var(--lifted)] p-4 transition-all ${applied.has(i) ? "opacity-40" : ""}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${PRIORITY_CFG[s.priority]}`}>{s.priority}</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-[var(--text)]">{s.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{s.desc}</p>
              <p className="mt-1.5 text-xs font-bold text-emerald-400">{s.savings}</p>
              {!applied.has(i) && (
                <button onClick={() => setApplied((prev) => new Set([...prev, i]))} className="mt-3 w-full rounded-lg bg-[var(--raised)] py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-all">
                  Apply Suggestion →
                </button>
              )}
              {applied.has(i) && <p className="mt-3 text-center text-xs text-emerald-400">✓ Applied</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
