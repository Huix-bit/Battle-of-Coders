"use client";

import { useState } from "react";
import Link from "next/link";

type StallStatus = "mine" | "open" | "flash" | "busy" | "available";

interface Stall {
  id: number;
  row: number;
  col: number;
  status: StallStatus;
  vendor: string | null;
  category: string | null;
  note?: string;
}

const CATEGORIES = ["Noodles", "Rice", "Grilled", "Drinks", "Kuih", "Fruits", "Snacks", "Seafood"];
const VENDORS = [
  "Mee Goreng Haji Ali", "Ayam Percik Siti", "Nasi Lemak Wangi", "Air Balang Rahman",
  "Kuih Muih Puan Ros", "Rojak Buah Pak Zaini", "Satay Jamilah", "Keropok Lekor Azri",
  "Cendol Pak Din", "Burger Bakar Aman", "Murtabak Rafiq", "Ikan Bakar Hamidah",
];

function makeStalls(): Stall[] {
  const stalls: Stall[] = [];
  let vi = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 9; col++) {
      const id = row * 9 + col + 1;
      if (id === 23) {
        stalls.push({ id, row, col, status: "mine", vendor: "Faridah Peniaga (You)", category: "Noodles", note: "I'm Here — Open" });
        continue;
      }
      if (id === 7 || id === 31) {
        stalls.push({ id, row, col, status: "flash", vendor: VENDORS[vi % VENDORS.length], category: CATEGORIES[vi % CATEGORIES.length], note: "⚡ Flash Sale 20% off!" });
        vi++;
        continue;
      }
      if (id === 12 || id === 38 || id === 42) {
        stalls.push({ id, row, col, status: "busy", vendor: VENDORS[vi % VENDORS.length], category: CATEGORIES[vi % CATEGORIES.length], note: "Very busy — queue forming" });
        vi++;
        continue;
      }
      if (id % 9 === 0 || id === 5 || id === 18 || id === 33) {
        stalls.push({ id, row, col, status: "available", vendor: null, category: null });
        continue;
      }
      stalls.push({ id, row, col, status: "open", vendor: VENDORS[vi % VENDORS.length], category: CATEGORIES[vi % CATEGORIES.length], note: "Open for business" });
      vi++;
    }
  }
  return stalls;
}

const STALLS = makeStalls();

const STATUS_CONFIG: Record<StallStatus, { label: string; color: string; dot: string; bg: string; border: string }> = {
  mine:      { label: "My Stall",   color: "text-amber-400",  dot: "bg-amber-400",  bg: "bg-amber-400/20",   border: "border-amber-400/60" },
  open:      { label: "Active",     color: "text-emerald-400",dot: "bg-emerald-400",bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  flash:     { label: "Flash Sale", color: "text-yellow-300", dot: "bg-yellow-300", bg: "bg-yellow-400/15",  border: "border-yellow-400/50" },
  busy:      { label: "Busy",       color: "text-orange-400", dot: "bg-orange-400", bg: "bg-orange-500/15",  border: "border-orange-500/40" },
  available: { label: "Available",  color: "text-[var(--muted)]", dot: "bg-[var(--raised)]", bg: "bg-[var(--lifted)]", border: "border-[var(--border)]" },
};

type FilterType = "all" | StallStatus;

export default function MarketLayoutPage() {
  const [selected, setSelected] = useState<Stall | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const counts = {
    total: STALLS.length,
    open: STALLS.filter((s) => s.status === "open" || s.status === "mine" || s.status === "busy").length,
    available: STALLS.filter((s) => s.status === "available").length,
    flash: STALLS.filter((s) => s.status === "flash").length,
  };

  const visible = filter === "all" ? STALLS : STALLS.filter((s) => s.status === filter);

  return (
    <div className="space-y-6 pb-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/vendor" className="hover:text-[var(--text)]">Vendor Portal</Link>
        <span>/</span>
        <span className="text-[var(--text)]">Market Map</span>
      </div>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">🗺️ Market Layout</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Live stall availability — tap any stall for details</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live · refreshes every 30s
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Stalls",  value: counts.total,     accent: "text-[var(--text)]",   icon: "🏪" },
          { label: "Active Now",    value: counts.open,      accent: "text-emerald-400",      icon: "🟢" },
          { label: "Available",     value: counts.available, accent: "text-[var(--muted)]",   icon: "⬜" },
          { label: "Flash Sales",   value: counts.flash,     accent: "text-yellow-400",       icon: "⚡" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] p-4">
            <span className="text-xl">{s.icon}</span>
            <p className={`mt-1 text-2xl font-bold ${s.accent}`}>{s.value}</p>
            <p className="text-xs text-[var(--muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2">
            {(["all", "mine", "open", "flash", "busy", "available"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-[var(--accent)] text-[var(--abyss)]"
                    : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text)]"
                }`}
              >
                {f === "all" ? "All Stalls" : STATUS_CONFIG[f].label}
                {f !== "all" && (
                  <span className="ml-1 opacity-70">({STALLS.filter((s) => s.status === f).length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {(Object.entries(STATUS_CONFIG) as [StallStatus, typeof STATUS_CONFIG[StallStatus]][]).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-sm ${cfg.dot}`} />
                <span className={cfg.color}>{cfg.label}</span>
              </div>
            ))}
          </div>

          {/* Stall grid */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)]/60 p-4">
            {/* Path indicator */}
            <div className="mb-3 flex items-center gap-2 text-xs text-[var(--muted)]">
              <span>← Entrance</span>
              <div className="h-px flex-1 border-t border-dashed border-[var(--border)]" />
              <span>Exit →</span>
            </div>

            <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}>
              {STALLS.map((stall) => {
                const cfg = STATUS_CONFIG[stall.status];
                const isHidden = filter !== "all" && stall.status !== filter;
                return (
                  <button
                    key={stall.id}
                    onClick={() => setSelected(stall.status !== "available" ? stall : null)}
                    className={`relative aspect-square rounded-lg border text-[10px] font-bold transition-all duration-150 ${cfg.bg} ${cfg.border} ${
                      isHidden ? "opacity-15" : "hover:scale-110 hover:shadow-lg hover:z-10"
                    } ${selected?.id === stall.id ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--abyss)] scale-110 z-10" : ""}`}
                  >
                    <span className={`${cfg.color}`}>
                      {stall.status === "mine" ? "⭐" : stall.status === "flash" ? "⚡" : stall.status === "busy" ? "🔴" : stall.status === "available" ? "" : "•"}
                    </span>
                    <span className={`absolute bottom-0.5 left-0 right-0 text-center text-[8px] ${cfg.color} opacity-70`}>
                      {stall.id}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Row labels */}
            <div className="mt-3 flex justify-center gap-1 text-[10px] text-[var(--muted)]">
              {["Row A", "Row B", "Row C", "Row D", "Row E"].map((r) => (
                <span key={r} className="flex-1 text-center">{r}</span>
              ))}
            </div>
          </div>

          {/* My stall highlight */}
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
            <span className="text-xl">⭐</span>
            <div>
              <p className="font-semibold text-amber-400">Your stall: #23 — Row C, Col 5</p>
              <p className="text-xs text-[var(--muted)]">Faridah Peniaga · Noodles · Currently marked Open</p>
            </div>
            <Link href="/vendor/dashboard" className="ml-auto shrink-0 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/30">
              Manage →
            </Link>
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selected ? (
            <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Stall #{selected.id}</p>
                  <h3 className="mt-0.5 text-lg font-bold text-[var(--text)]">{selected.vendor}</h3>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_CONFIG[selected.status].bg} ${STATUS_CONFIG[selected.status].color}`}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Category</span>
                  <span className="font-medium text-[var(--text)]">{selected.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Location</span>
                  <span className="font-medium text-[var(--text)]">Row {String.fromCharCode(65 + selected.row)}, Col {selected.col + 1}</span>
                </div>
                {selected.note && (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--raised)] px-3 py-2 text-xs text-[var(--secondary)]">
                    {selected.note}
                  </div>
                )}
                {selected.status === "flash" && (
                  <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-2">
                    <p className="text-xs font-semibold text-yellow-400">⚡ Flash Sale Active!</p>
                    <p className="text-xs text-[var(--muted)]">Limited time discount — visit now</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelected(null)}
                className="mt-4 w-full rounded-lg border border-[var(--border)] py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--raised)]"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div className="sticky top-24 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--lifted)]/50 p-6 text-center">
              <p className="text-3xl">🏪</p>
              <p className="mt-3 text-sm font-medium text-[var(--text)]">Select a stall</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Click any active stall on the map to see vendor details</p>
            </div>
          )}

          {/* Nearby flash sales */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4">
            <h4 className="mb-3 text-sm font-semibold text-[var(--accent-strong)]">⚡ Flash Sales Nearby</h4>
            {STALLS.filter((s) => s.status === "flash").map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="mb-2 flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--raised)]/50 px-3 py-2 text-left transition-all hover:border-yellow-400/30"
              >
                <span className="text-lg">⚡</span>
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{s.vendor}</p>
                  <p className="text-[10px] text-[var(--muted)]">Stall #{s.id} · {s.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
