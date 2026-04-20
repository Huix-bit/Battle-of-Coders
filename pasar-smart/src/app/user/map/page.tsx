"use client";
import Link from "next/link";
import { useState } from "react";

// ── shared stall data ────────────────────────────────────────────────────────
const ACTIVE_STALLS = [
  { id: "B4", name: "Mee Goreng Haji Ali",  cat: "Noodles",  crowd: 95, wait: "20 min", flash: false, emoji: "🍜", open: true  },
  { id: "B5", name: "Satay Jamilah",         cat: "Grilled",  crowd: 88, wait: "15 min", flash: false, emoji: "🍢", open: true  },
  { id: "C4", name: "Ikan Bakar Hamidah",    cat: "Seafood",  crowd: 80, wait: "25 min", flash: false, emoji: "🐠", open: true  },
  { id: "A4", name: "Cendol Pak Din",        cat: "Drinks",   crowd: 85, wait: "5 min",  flash: false, emoji: "🧊", open: true  },
  { id: "C2", name: "Ayam Percik Siti",      cat: "Grilled",  crowd: 50, wait: "10 min", flash: true,  emoji: "🍗", open: true  },
  { id: "D3", name: "Nasi Lemak Wangi",      cat: "Rice",     crowd: 45, wait: "3 min",  flash: false, emoji: "🍚", open: true  },
  { id: "E5", name: "Rojak Buah Pak Zaini",  cat: "Fruits",   crowd: 40, wait: "8 min",  flash: true,  emoji: "🥭", open: true  },
  { id: "F2", name: "Kuih Muih Puan Ros",    cat: "Kuih",     crowd: 20, wait: "2 min",  flash: false, emoji: "🧁", open: true  },
  { id: "E7", name: "Keropok Lekor Azri",    cat: "Snacks",   crowd: 15, wait: "5 min",  flash: false, emoji: "🐟", open: false },
];

type StallInfo = typeof ACTIVE_STALLS[0];

// ── map view definitions ─────────────────────────────────────────────────────
const MAP_VIEWS = [
  { id: "heatmap", label: "🔥 Crowd Heatmap",  desc: "Real-time density"   },
  { id: "layout",  label: "🏪 Stall Layout",    desc: "Zone directory"      },
  { id: "access",  label: "🚗 Parking & Gates", desc: "Entrances & pickup"  },
  { id: "deals",   label: "⚡ Live Deals",      desc: "Flash & active offers"},
];

// ── Heatmap data ─────────────────────────────────────────────────────────────
const DENSITY: number[][] = [
  [10, 20, 40, 85, 90, 75, 35, 15],
  [15, 30, 65, 95, 100, 80, 45, 20],
  [25, 50, 70, 80, 85, 70, 40, 18],
  [20, 45, 60, 65, 70, 55, 30, 12],
  [10, 25, 35, 45, 50, 40, 20, 10],
  [5,  15, 20, 25, 30, 20, 12,  8],
];
const ROW_LABELS = ["A","B","C","D","E","F"];
const COL_LABELS = ["1","2","3","4","5","6","7","8"];

const AI_ROUTES = [
  { label: "⚡ Minimize Wait",    path: ["F2","E5","D3","C2"],         desc: "Quieter stalls first — avg wait under 5 min",    color: "emerald" },
  { label: "🌟 Maximize Variety", path: ["A4","D3","C2","E5","F2"],    desc: "5 stalls, 5 categories, full experience",        color: "violet"  },
  { label: "🔥 Popular Picks",    path: ["B4","B5","A4","C4"],         desc: "Highest-rated stalls — expect queues",           color: "amber"   },
];

function heatColor(d: number) {
  if (d >= 80) return "bg-red-500";
  if (d >= 60) return "bg-orange-500";
  if (d >= 40) return "bg-amber-400";
  if (d >= 20) return "bg-emerald-500";
  return "bg-[var(--raised)]";
}
function heatOpacity(d: number) { return 0.2 + (d / 100) * 0.75; }

// ── Layout map ───────────────────────────────────────────────────────────────
type LayoutCell = { cat: string; label: string; stall?: string; emoji?: string } | null;

const CAT_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Noodles:  { bg: "bg-green-900/60",  text: "text-green-300",  border: "border-green-500/40"  },
  Grilled:  { bg: "bg-orange-900/60", text: "text-orange-300", border: "border-orange-500/40" },
  Seafood:  { bg: "bg-cyan-900/60",   text: "text-cyan-300",   border: "border-cyan-500/40"   },
  Drinks:   { bg: "bg-blue-900/60",   text: "text-blue-300",   border: "border-blue-500/40"   },
  Rice:     { bg: "bg-yellow-900/60", text: "text-yellow-300", border: "border-yellow-500/40" },
  Fruits:   { bg: "bg-lime-900/60",   text: "text-lime-300",   border: "border-lime-500/40"   },
  Kuih:     { bg: "bg-pink-900/60",   text: "text-pink-300",   border: "border-pink-500/40"   },
  Snacks:   { bg: "bg-purple-900/60", text: "text-purple-300", border: "border-purple-500/40" },
  Toilet:   { bg: "bg-[var(--raised)]", text: "text-[var(--muted)]", border: "border-[var(--border)]" },
  Path:     { bg: "bg-transparent",   text: "text-transparent", border: "border-transparent"  },
};

// 8 cols × 6 rows — mirrors the heatmap grid
const LAYOUT_GRID: LayoutCell[][] = [
  [null, null, null, {cat:"Drinks",  label:"Drinks Zone",  stall:"Cendol Pak Din",       emoji:"🧊"}, {cat:"Drinks", label:"Drinks"}, null, null, null],
  [null, {cat:"Noodles",label:"Noodles",stall:"Mee Goreng Haji Ali",emoji:"🍜"}, null, {cat:"Grilled",label:"Grilled"}, {cat:"Grilled",label:"Satay",stall:"Satay Jamilah",emoji:"🍢"}, null, null, null],
  [null, {cat:"Grilled",label:"Grilled",stall:"Ayam Percik Siti",emoji:"🍗"}, null, {cat:"Seafood",label:"Seafood",stall:"Ikan Bakar Hamidah",emoji:"🐠"}, {cat:"Seafood",label:"Seafood"}, null, null, null],
  [{cat:"Toilet",label:"🚻"}, null, {cat:"Rice",label:"Rice",stall:"Nasi Lemak Wangi",emoji:"🍚"}, null, null, null, null, {cat:"Toilet",label:"🚻"}],
  [null, null, null, {cat:"Fruits",label:"Fruits"}, {cat:"Fruits",label:"Fruits",stall:"Rojak Buah",emoji:"🥭"}, null, {cat:"Snacks",label:"Snacks",stall:"Keropok Lekor",emoji:"🐟"}, null],
  [null, {cat:"Kuih",label:"Kuih",stall:"Kuih Muih Puan Ros",emoji:"🧁"}, {cat:"Kuih",label:"Kuih"}, null, null, null, null, null],
];

// ── Parking / Access map ─────────────────────────────────────────────────────
type AccessType = "road"|"carpark"|"mkt"|"gate-a"|"gate-b"|"gate-c"|"green"|"wall"|"path"|"pickup";

type AccessCell2 = {
  type: AccessType;
  label?: string;
  sub?: string;
  icon?: string;
};

// 10 cols × 8 rows
const ACCESS_GRID: AccessCell2[][] = [
  [{type:"road"},{type:"road"},{type:"road"},{type:"road"},{type:"road"},{type:"gate-a",label:"Gate A",sub:"Main Entrance",icon:"🚪"},{type:"road"},{type:"road"},{type:"road"},{type:"road"}],
  [{type:"road"},{type:"green",label:"🌿"},{type:"wall"},{type:"wall"},{type:"wall"},{type:"wall"},{type:"wall"},{type:"wall"},{type:"green",label:"🌿"},{type:"road"}],
  [{type:"gate-b",label:"Gate B",sub:"Side Lane",icon:"🏍️"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"road"}],
  [{type:"road"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"road"}],
  [{type:"road"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"path",label:"🚶 Path"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"road"}],
  [{type:"road"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"mkt"},{type:"road"}],
  [{type:"road"},{type:"green",label:"🌿"},{type:"wall"},{type:"wall"},{type:"gate-c",label:"Gate C",sub:"Car Park",icon:"🅿️"},{type:"wall"},{type:"wall"},{type:"green",label:"🌿"},{type:"road"},{type:"road"}],
  [{type:"road"},{type:"carpark",label:"P"},{type:"carpark",label:"P"},{type:"carpark",label:"P"},{type:"pickup",label:"Pickup",sub:"P3",icon:"🚗"},{type:"carpark",label:"P"},{type:"carpark",label:"P"},{type:"carpark",label:"P"},{type:"road"},{type:"road"}],
];

const ACCESS_STYLE: Record<AccessType, { bg: string; text: string; border: string }> = {
  "road":    { bg:"bg-zinc-800/80",        text:"text-zinc-500",   border:"border-zinc-700/30"  },
  "carpark": { bg:"bg-slate-800/80",       text:"text-slate-400",  border:"border-slate-700/30" },
  "mkt":     { bg:"bg-emerald-900/40",     text:"text-emerald-400",border:"border-emerald-700/30"},
  "gate-a":  { bg:"bg-violet-600/80",      text:"text-white",      border:"border-violet-400/60"},
  "gate-b":  { bg:"bg-cyan-600/80",        text:"text-white",      border:"border-cyan-400/60"  },
  "gate-c":  { bg:"bg-amber-600/80",       text:"text-white",      border:"border-amber-400/60" },
  "green":   { bg:"bg-green-900/60",       text:"text-green-400",  border:"border-green-800/30" },
  "wall":    { bg:"bg-[var(--abyss)]/80",  text:"text-[var(--muted)]",border:"border-[var(--border)]"},
  "path":    { bg:"bg-zinc-700/60",        text:"text-zinc-300",   border:"border-zinc-600/30"  },
  "pickup":  { bg:"bg-emerald-500/80",     text:"text-white",      border:"border-emerald-300/60"},
};

// Pickup points legend
const PICKUP_LEGEND = [
  { id:"P1", gate:"Gate A", desc:"Main Entrance", color:"bg-violet-500" },
  { id:"P2", gate:"Gate B", desc:"Side Lane",     color:"bg-cyan-500"   },
  { id:"P3", gate:"Gate C", desc:"Car Park",      color:"bg-emerald-500"},
];

// ── Deals data ───────────────────────────────────────────────────────────────
type DealCell = {
  stallId?: string;
  deal?: "flash" | "open" | "busy" | "closed" | "none";
  discount?: string;
  wait?: string;
  emoji?: string;
  name?: string;
};

// Map stalls onto the 8x6 deal grid
const DEAL_STALLS: Record<string, { deal:"flash"|"open"|"busy"|"closed"; discount?:string; wait:string; emoji:string; name:string }> = {
  "A4": { deal:"busy",  wait:"5 min",  emoji:"🧊", name:"Cendol Pak Din"       },
  "B4": { deal:"busy",  wait:"20 min", emoji:"🍜", name:"Mee Goreng Haji Ali"  },
  "B5": { deal:"busy",  wait:"15 min", emoji:"🍢", name:"Satay Jamilah"        },
  "C2": { deal:"flash", discount:"20% off", wait:"10 min", emoji:"🍗", name:"Ayam Percik Siti"   },
  "C4": { deal:"busy",  wait:"25 min", emoji:"🐠", name:"Ikan Bakar Hamidah"   },
  "D3": { deal:"open",  wait:"3 min",  emoji:"🍚", name:"Nasi Lemak Wangi"     },
  "E5": { deal:"flash", discount:"15% off", wait:"8 min",  emoji:"🥭", name:"Rojak Buah Pak Zaini"},
  "E7": { deal:"closed",wait:"–",     emoji:"🐟", name:"Keropok Lekor Azri"   },
  "F2": { deal:"open",  wait:"2 min",  emoji:"🧁", name:"Kuih Muih Puan Ros"   },
};

function dealStyle(deal?: string) {
  if (deal === "flash")  return "bg-amber-500/80 ring-1 ring-amber-300/60 animate-pulse";
  if (deal === "busy")   return "bg-orange-500/60 ring-1 ring-orange-400/40";
  if (deal === "open")   return "bg-emerald-500/60 ring-1 ring-emerald-400/40";
  if (deal === "closed") return "bg-zinc-700/60";
  return "bg-[var(--raised)]/40";
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LiveMapPage() {
  const [mapView,    setMapView]    = useState("heatmap");
  const [activeRoute,setActiveRoute]= useState<number | null>(null);
  const [selected,   setSelected]   = useState<StallInfo | null>(null);
  const [dealSel,    setDealSel]    = useState<string | null>(null);

  const routePath = activeRoute !== null ? AI_ROUTES[activeRoute].path : [];

  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link href="/user" className="hover:text-[var(--text)]">Home</Link>
          <span>/</span>
          <span className="text-[var(--text)]">Live Map</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live · updates every 30s
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">🗺️ Live Market Map</h1>
        <p className="text-sm text-[var(--muted)]">Choose a map view to explore the night market</p>
      </div>

      {/* ── Map view selector tabs ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MAP_VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => { setMapView(v.id); setSelected(null); setDealSel(null); }}
            className={`flex flex-col items-start gap-0.5 rounded-2xl border px-4 py-3 text-left transition-all ${
              mapView === v.id
                ? "border-[var(--accent)]/60 bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--lifted)] text-[var(--text)] hover:border-[var(--accent)]/30 hover:bg-[var(--raised)]"
            }`}
          >
            <span className="text-sm font-bold">{v.label}</span>
            <span className={`text-[11px] ${mapView === v.id ? "text-[var(--accent)]/70" : "text-[var(--muted)]"}`}>{v.desc}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAP 1 — CROWD HEATMAP
      ══════════════════════════════════════════════════════════════ */}
      {mapView === "heatmap" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {/* AI route buttons */}
            <div className="flex flex-wrap gap-2">
              {AI_ROUTES.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setActiveRoute(activeRoute === i ? null : i)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeRoute === i
                      ? "border-[var(--accent)]/60 bg-[var(--accent)]/20 text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/30"
                  }`}
                >
                  {r.label}
                </button>
              ))}
              {activeRoute !== null && (
                <span className="rounded-full border border-[var(--border)] bg-[var(--lifted)] px-3 py-1.5 text-xs text-[var(--muted)]">
                  {AI_ROUTES[activeRoute].desc}
                </span>
              )}
            </div>

            {/* Grid */}
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)]/80 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted)]">← Entrance</span>
                <div className="h-px flex-1 border-t border-dashed border-[var(--border)]" />
                <span className="text-xs font-semibold text-[var(--muted)]">Exit →</span>
              </div>
              <div className="space-y-1">
                {DENSITY.map((row, ri) => (
                  <div key={ri} className="flex items-center gap-1">
                    <span className="w-4 shrink-0 text-center text-[10px] font-bold text-[var(--muted)]">{ROW_LABELS[ri]}</span>
                    {row.map((d, ci) => {
                      const cellId = `${ROW_LABELS[ri]}${COL_LABELS[ci]}`;
                      const stall  = ACTIVE_STALLS.find((s) => s.id === cellId);
                      const inRoute = routePath.includes(cellId);
                      return (
                        <button
                          key={ci}
                          onClick={() => setSelected(stall ?? null)}
                          style={{ opacity: heatOpacity(d) }}
                          title={stall ? stall.name : `Zone ${cellId} — ${d}% density`}
                          className={`relative h-10 flex-1 rounded-lg transition-all hover:scale-105 hover:z-10 ${heatColor(d)} ${stall ? "ring-1 ring-white/40" : ""} ${inRoute ? "scale-110 z-10 ring-2 ring-[var(--accent)]" : ""}`}
                        >
                          {stall && <span className="absolute inset-0 flex items-center justify-center text-base">{stall.emoji}</span>}
                          {inRoute && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[var(--accent)]" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
                <div className="mt-1 flex gap-1 pl-5">
                  {COL_LABELS.map((c) => <span key={c} className="flex-1 text-center text-[10px] text-[var(--muted)]">{c}</span>)}
                </div>
              </div>
              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-[var(--muted)]">
                <span className="font-semibold">Crowd:</span>
                {[{color:"bg-emerald-500",label:"Low"},{color:"bg-amber-400",label:"Moderate"},{color:"bg-orange-500",label:"High"},{color:"bg-red-500",label:"Very High"}].map((l) => (
                  <div key={l.label} className="flex items-center gap-1"><span className={`h-2.5 w-4 rounded-sm opacity-80 ${l.color}`} />{l.label}</div>
                ))}
                <div className="flex items-center gap-1"><span className="h-2.5 w-4 rounded-sm bg-white/30 ring-1 ring-white/40" />Has stall</div>
              </div>
            </div>

            {/* Selected stall panel */}
            {selected && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selected.emoji}</span>
                    <div>
                      <p className="font-bold text-[var(--text)]">{selected.name}</p>
                      <p className="text-xs text-[var(--muted)]">Zone {selected.id} · {selected.cat}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">✕</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${selected.crowd >= 80 ? "bg-red-400/20 text-red-400" : selected.crowd >= 50 ? "bg-amber-400/20 text-amber-400" : "bg-emerald-400/20 text-emerald-400"}`}>
                    {selected.crowd}% busy
                  </span>
                  <span className="text-sm text-[var(--muted)]">⏱ Wait: {selected.wait}</span>
                  {selected.flash && <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-400">⚡ Flash Deal</span>}
                </div>
                <Link href="/user/discover" className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-400">
                  Add to Cart →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--accent-strong)]">Active Stalls Tonight</h3>
            <p className="text-xs text-[var(--muted)]">Sorted by crowd level</p>
            {[...ACTIVE_STALLS].sort((a,b) => b.crowd - a.crowd).map((s) => (
              <button key={s.id} onClick={() => setSelected(s)}
                className={`w-full rounded-xl border p-3 text-left transition-all hover:border-emerald-500/30 hover:bg-[var(--raised)] ${selected?.id === s.id ? "border-emerald-500/50 bg-emerald-500/10" : s.flash ? "border-amber-500/30 bg-[var(--lifted)]" : "border-[var(--border)] bg-[var(--lifted)]"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text)]">{s.name}</p>
                    <p className="text-[10px] text-[var(--muted)]">Zone {s.id} · ⏱ {s.wait}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--raised)]">
                      <div className={`h-full rounded-full ${s.crowd >= 80 ? "bg-red-500" : s.crowd >= 50 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width:`${s.crowd}%` }} />
                    </div>
                    <p className="text-[10px] text-[var(--muted)]">{s.crowd}%</p>
                  </div>
                </div>
                {s.flash && <span className="mt-1 inline-block rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">⚡ Flash Deal Active</span>}
              </button>
            ))}
            <Link href="/user/cart" className="block rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-400 transition-all">🛒 Go to Cart</Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MAP 2 — STALL LAYOUT
      ══════════════════════════════════════════════════════════════ */}
      {mapView === "layout" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)]/80 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted)]">← North (Entrance)</span>
                <div className="h-px flex-1 border-t border-dashed border-[var(--border)]" />
                <span className="text-xs font-semibold text-[var(--muted)]">South →</span>
              </div>
              <div className="space-y-1.5">
                {LAYOUT_GRID.map((row, ri) => (
                  <div key={ri} className="flex items-stretch gap-1.5">
                    <span className="flex w-4 shrink-0 items-center justify-center text-[10px] font-bold text-[var(--muted)]">{ROW_LABELS[ri]}</span>
                    {row.map((cell, ci) => {
                      const cellId = `${ROW_LABELS[ri]}${ci + 1}`;
                      const style  = cell ? CAT_STYLE[cell.cat] : null;
                      const stallData = ACTIVE_STALLS.find((s) => s.id === cellId);
                      return (
                        <div
                          key={ci}
                          title={cell?.stall ?? cellId}
                          onClick={() => cell?.stall && setSelected(stallData ?? null)}
                          className={`relative flex h-14 flex-1 flex-col items-center justify-center rounded-xl border text-center transition-all ${
                            style
                              ? `${style.bg} ${style.border} ${cell?.stall ? "cursor-pointer hover:brightness-125" : ""}`
                              : "border-transparent"
                          }`}
                        >
                          {cell && (
                            <>
                              {cell.emoji && <span className="text-lg leading-none">{cell.emoji}</span>}
                              <span className={`text-[9px] font-semibold leading-tight ${style?.text}`}>
                                {cell.emoji ? cell.stall?.split(" ").slice(0, 2).join(" ") ?? cell.label : cell.label}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="mt-1 flex gap-1.5 pl-5">
                  {COL_LABELS.map((c) => <span key={c} className="flex-1 text-center text-[10px] text-[var(--muted)]">{c}</span>)}
                </div>
              </div>

              {/* Category legend */}
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(CAT_STYLE).filter(([k]) => k !== "Path").map(([cat, s]) => (
                  <div key={cat} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.border} ${s.text}`}>
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected stall */}
            {selected && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selected.emoji}</span>
                    <div>
                      <p className="font-bold text-[var(--text)]">{selected.name}</p>
                      <p className="text-xs text-[var(--muted)]">Zone {selected.id} · {selected.cat}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">✕</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${selected.crowd >= 80 ? "bg-red-400/20 text-red-400" : selected.crowd >= 50 ? "bg-amber-400/20 text-amber-400" : "bg-emerald-400/20 text-emerald-400"}`}>
                    {selected.crowd}% busy · ⏱ {selected.wait}
                  </span>
                  {selected.flash && <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-400">⚡ Flash Deal</span>}
                </div>
                <Link href="/user/discover" className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-400">
                  Add to Cart →
                </Link>
              </div>
            )}
          </div>

          {/* Stall directory sidebar */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--accent-strong)]">Zone Directory</h3>
            {(["Noodles","Grilled","Seafood","Drinks","Rice","Fruits","Kuih","Snacks"] as const).map((cat) => {
              const stalls = ACTIVE_STALLS.filter((s) => s.cat === cat);
              if (!stalls.length) return null;
              const s = CAT_STYLE[cat];
              return (
                <div key={cat} className={`rounded-xl border p-3 ${s.bg} ${s.border}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${s.text}`}>{cat}</p>
                  {stalls.map((st) => (
                    <button key={st.id} onClick={() => setSelected(st)} className="mt-1.5 flex w-full items-center gap-2 text-left hover:opacity-80">
                      <span>{st.emoji}</span>
                      <span className={`flex-1 truncate text-xs ${s.text}`}>{st.name}</span>
                      <span className="shrink-0 text-[10px] text-[var(--muted)]">Zone {st.id}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MAP 3 — PARKING & GATES
      ══════════════════════════════════════════════════════════════ */}
      {mapView === "access" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)]/80 p-4">
              <p className="mb-3 text-xs font-semibold text-[var(--muted)]">Market perimeter, gates, and Pasar-Drive pickup points</p>
              <div className="space-y-1">
                {ACCESS_GRID.map((row, ri) => (
                  <div key={ri} className="flex gap-1">
                    {row.map((cell, ci) => {
                      const s = ACCESS_STYLE[cell.type];
                      const isGate = cell.type === "gate-a" || cell.type === "gate-b" || cell.type === "gate-c";
                      const isPickup = cell.type === "pickup";
                      return (
                        <div
                          key={ci}
                          className={`relative flex h-12 flex-1 flex-col items-center justify-center rounded-lg border text-center ${s.bg} ${s.border} ${isGate || isPickup ? "ring-1 ring-white/30" : ""}`}
                        >
                          {cell.icon && <span className="text-sm leading-none">{cell.icon}</span>}
                          {cell.label && (
                            <span className={`text-[8px] font-bold leading-tight ${s.text}`}>{cell.label}</span>
                          )}
                          {cell.sub && (
                            <span className={`text-[7px] leading-none opacity-75 ${s.text}`}>{cell.sub}</span>
                          )}
                          {cell.type === "mkt" && !cell.label && (
                            <span className="text-[8px] text-emerald-700/50">·</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                {[
                  { color:"bg-violet-600", label:"Gate A (Main Entrance)" },
                  { color:"bg-cyan-600",   label:"Gate B (Side Lane)"     },
                  { color:"bg-amber-600",  label:"Gate C (Car Park)"      },
                  { color:"bg-emerald-500",label:"Pasar-Drive Pickup"     },
                  { color:"bg-emerald-900/60",label:"Market Area"         },
                  { color:"bg-slate-800",  label:"Car Park"               },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1 text-[var(--muted)]">
                    <span className={`h-2.5 w-4 rounded-sm ${l.color}`} />{l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pickup info sidebar */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--accent-strong)]">🚗 Pasar-Drive Pickup Points</h3>
            <p className="text-xs text-[var(--muted)]">Enable Pasar-Drive in your cart and choose one of these points to collect all your orders in one go.</p>
            {PICKUP_LEGEND.map((p) => (
              <div key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] p-4">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${p.color}`} />
                  <p className="font-semibold text-[var(--text)]">{p.gate}</p>
                  <span className="ml-auto rounded-full bg-[var(--raised)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">{p.id}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{p.desc}</p>
              </div>
            ))}

            <div className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] p-4 text-xs text-[var(--muted)] space-y-1.5">
              <p className="font-semibold text-[var(--text)]">ℹ️ How it works</p>
              <p>1. Add items from stalls to your cart</p>
              <p>2. Enable Pasar-Drive &amp; choose a pickup point</p>
              <p>3. Pay via Stripe</p>
              <p>4. Vendors prepare &amp; deliver to your gate (≈ 20 min)</p>
            </div>

            <Link href="/user/cart" className="block rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-400 transition-all">
              🛒 Enable Pasar-Drive in Cart
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MAP 4 — LIVE DEALS
      ══════════════════════════════════════════════════════════════ */}
      {mapView === "deals" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {/* Flash deal highlights */}
            <div className="flex flex-wrap gap-2">
              {ACTIVE_STALLS.filter((s) => s.flash).map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  {s.emoji} {s.name.split(" ").slice(0,2).join(" ")} — {DEAL_STALLS[s.id]?.discount}
                </div>
              ))}
            </div>

            {/* Deals grid */}
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)]/80 p-4">
              <p className="mb-3 text-xs font-semibold text-[var(--muted)]">Tap a stall to see deal details</p>
              <div className="space-y-1">
                {ROW_LABELS.map((row, ri) => (
                  <div key={ri} className="flex items-center gap-1">
                    <span className="w-4 shrink-0 text-center text-[10px] font-bold text-[var(--muted)]">{row}</span>
                    {COL_LABELS.map((col) => {
                      const cellId  = `${row}${col}`;
                      const deal    = DEAL_STALLS[cellId];
                      return (
                        <button
                          key={col}
                          onClick={() => setDealSel(deal ? cellId : null)}
                          title={deal ? `${deal.emoji} ${deal.name}` : `Zone ${cellId}`}
                          className={`relative h-10 flex-1 rounded-lg border border-transparent transition-all hover:scale-105 hover:z-10 ${dealStyle(deal?.deal)} ${dealSel === cellId ? "ring-2 ring-white/60 scale-110 z-10" : ""}`}
                        >
                          {deal && <span className="absolute inset-0 flex items-center justify-center text-base">{deal.emoji}</span>}
                          {deal?.deal === "flash" && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
                <div className="mt-1 flex gap-1 pl-5">
                  {COL_LABELS.map((c) => <span key={c} className="flex-1 text-center text-[10px] text-[var(--muted)]">{c}</span>)}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-[var(--muted)]">
                {[
                  {color:"bg-amber-500",  label:"Flash Deal ⚡"},
                  {color:"bg-orange-500", label:"Busy"},
                  {color:"bg-emerald-500",label:"Open & Quiet"},
                  {color:"bg-zinc-700",   label:"Closed"},
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1"><span className={`h-2.5 w-4 rounded-sm opacity-80 ${l.color}`} />{l.label}</div>
                ))}
              </div>
            </div>

            {/* Deal detail panel */}
            {dealSel && DEAL_STALLS[dealSel] && (() => {
              const d = DEAL_STALLS[dealSel];
              return (
                <div className={`rounded-2xl border p-5 ${d.deal === "flash" ? "border-amber-500/40 bg-amber-500/8" : "border-[var(--border)] bg-[var(--lifted)]"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{d.emoji}</span>
                      <div>
                        <p className="font-bold text-[var(--text)]">{d.name}</p>
                        <p className="text-xs text-[var(--muted)]">Zone {dealSel} · ⏱ Wait: {d.wait}</p>
                      </div>
                    </div>
                    <button onClick={() => setDealSel(null)} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">✕</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {d.deal === "flash" && (
                      <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-400">⚡ Flash: {d.discount}</span>
                    )}
                    {d.deal === "busy"  && <span className="rounded-full bg-orange-400/20 px-2 py-0.5 text-xs font-semibold text-orange-400">🔥 High demand</span>}
                    {d.deal === "open"  && <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">✓ Open & quiet</span>}
                    {d.deal === "closed"&& <span className="rounded-full bg-zinc-600/40 px-2 py-0.5 text-xs font-semibold text-zinc-400">✕ Closed tonight</span>}
                  </div>
                  {d.deal !== "closed" && (
                    <Link href="/user/discover" className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-400">
                      {d.deal === "flash" ? "⚡ Grab the Deal →" : "Add to Cart →"}
                    </Link>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Deals sidebar */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--accent-strong)]">Tonight&apos;s Offers</h3>

            {/* Flash deals first */}
            {ACTIVE_STALLS.filter((s) => s.flash).map((s) => (
              <button key={s.id} onClick={() => setDealSel(s.id)}
                className={`w-full rounded-xl border border-amber-500/40 bg-amber-500/8 p-3 text-left transition-all hover:bg-amber-500/15 ${dealSel === s.id ? "ring-1 ring-amber-400/60" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  <span className="text-xl">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-amber-300">{s.name}</p>
                    <p className="text-[10px] text-amber-400/70">{DEAL_STALLS[s.id]?.discount} · ⏱ {s.wait}</p>
                  </div>
                </div>
              </button>
            ))}

            <div className="border-t border-[var(--border)] pt-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">All Active Stalls</p>
              {ACTIVE_STALLS.filter((s) => !s.flash && s.open).map((s) => (
                <button key={s.id} onClick={() => setDealSel(s.id)}
                  className={`mb-1.5 flex w-full items-center gap-2 rounded-xl border p-2.5 text-left transition-all hover:border-emerald-500/30 ${dealSel === s.id ? "border-emerald-500/50 bg-emerald-500/10" : "border-[var(--border)] bg-[var(--lifted)]"}`}>
                  <span className="text-lg">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[var(--text)]">{s.name}</p>
                    <p className="text-[10px] text-[var(--muted)]">⏱ {s.wait}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${s.crowd >= 80 ? "bg-red-400/20 text-red-400" : s.crowd >= 50 ? "bg-amber-400/20 text-amber-400" : "bg-emerald-400/20 text-emerald-400"}`}>
                    {s.crowd}%
                  </span>
                </button>
              ))}
            </div>

            <Link href="/user/cart" className="block rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-400 transition-all">🛒 Go to Cart</Link>
          </div>
        </div>
      )}
    </div>
  );
}
