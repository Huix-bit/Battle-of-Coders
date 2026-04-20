"use client";
import Link from "next/link";
import { useState } from "react";

type ZoneType = "hot" | "warm" | "cold" | "empty" | "phantom";
interface Zone { id: string; row: number; col: number; type: ZoneType; vendor?: string; crowd?: number; }

const ZONE_DATA: Zone[] = [
  { id:"A1", row:0,col:0, type:"cold",    vendor:"Snacks Stall",        crowd:20 },
  { id:"A2", row:0,col:1, type:"warm",    vendor:"Kuih Muih Puan Ros",  crowd:20 },
  { id:"A3", row:0,col:2, type:"hot",     vendor:"Cendol Pak Din",      crowd:85 },
  { id:"A4", row:0,col:3, type:"hot",     vendor:"Mee Goreng Haji Ali", crowd:95 },
  { id:"A5", row:0,col:4, type:"hot",     vendor:"Satay Jamilah",       crowd:88 },
  { id:"A6", row:0,col:5, type:"warm",    vendor:"Rojak Buah",          crowd:40 },
  { id:"A7", row:0,col:6, type:"cold",    vendor:"Keropok Lekor",       crowd:25 },
  { id:"B1", row:1,col:0, type:"empty",                                            },
  { id:"B2", row:1,col:1, type:"warm",    vendor:"Nasi Lemak Wangi",    crowd:45 },
  { id:"B3", row:1,col:2, type:"hot",     vendor:"Ayam Percik Siti",    crowd:50 },
  { id:"B4", row:1,col:3, type:"hot",     vendor:"Ikan Bakar Hamidah",  crowd:80 },
  { id:"B5", row:1,col:4, type:"warm",    vendor:"Murtabak Rafiq",      crowd:35 },
  { id:"B6", row:1,col:5, type:"cold",    vendor:"Air Tebu",            crowd:18 },
  { id:"B7", row:1,col:6, type:"phantom", vendor:"Ahmad Burger (absent)"},
  { id:"C1", row:2,col:0, type:"cold",    vendor:"Buah Tempatan",       crowd:15 },
  { id:"C2", row:2,col:1, type:"cold",    vendor:"Kerepek Stall",       crowd:12 },
  { id:"C3", row:2,col:2, type:"warm",    vendor:"Laksa Johor",         crowd:42 },
  { id:"C4", row:2,col:3, type:"warm",    vendor:"Char Kway Teow",      crowd:48 },
  { id:"C5", row:2,col:4, type:"empty",                                            },
  { id:"C6", row:2,col:5, type:"empty",                                            },
  { id:"C7", row:2,col:6, type:"cold",    vendor:"Pudding Stall",       crowd:10 },
];

const ZONE_CFG: Record<ZoneType, { label: string; bg: string; text: string; border: string; dot: string }> = {
  hot:     { label: "Hot Zone",     bg: "bg-red-500/25",     text: "text-red-300",     border: "border-red-500/50",     dot: "bg-red-400"     },
  warm:    { label: "Warm Zone",    bg: "bg-amber-500/20",   text: "text-amber-300",   border: "border-amber-500/40",   dot: "bg-amber-400"   },
  cold:    { label: "Cold Zone",    bg: "bg-blue-500/15",    text: "text-blue-300",    border: "border-blue-500/30",    dot: "bg-blue-400"    },
  empty:   { label: "Available",    bg: "bg-[var(--raised)]",text: "text-[var(--muted)]",border: "border-dashed border-[var(--border)]", dot: "bg-[var(--muted)]" },
  phantom: { label: "Phantom Stall",bg: "bg-red-900/30",     text: "text-red-400",     border: "border-red-400/50",     dot: "bg-red-400"     },
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

export default function LayoutPage() {
  const [selected, setSelected] = useState<Zone | null>(null);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  const rows = [0, 1, 2];
  const cols = [0, 1, 2, 3, 4, 5, 6];

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
          { label: "Hot Zones",     value: ZONE_DATA.filter((z) => z.type === "hot").length,     dot: "bg-red-400",     accent: "text-red-400"     },
          { label: "Warm Zones",    value: ZONE_DATA.filter((z) => z.type === "warm").length,    dot: "bg-amber-400",   accent: "text-amber-400"   },
          { label: "Cold Zones",    value: ZONE_DATA.filter((z) => z.type === "cold").length,    dot: "bg-blue-400",    accent: "text-blue-400"    },
          { label: "Phantom Stalls",value: ZONE_DATA.filter((z) => z.type === "phantom").length, dot: "bg-red-400",     accent: "text-red-400"     },
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
            <div className="space-y-2">
              {rows.map((ri) => (
                <div key={ri} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-[10px] font-bold text-[var(--muted)]">{String.fromCharCode(65 + ri)}</span>
                  {cols.map((ci) => {
                    const zone = ZONE_DATA.find((z) => z.row === ri && z.col === ci);
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
