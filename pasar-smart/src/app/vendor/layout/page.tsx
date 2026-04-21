"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** Synthetic grid cell that represents the logged-in vendor on this demo map */
const MY_STALL_GRID_ID = 23;

function formatRemainingMs(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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

function makeStalls(myName: string | null, myCategory: string | null): Stall[] {
  const stalls: Stall[] = [];
  let slot = 1;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 9; col++) {
      const id = row * 9 + col + 1;
      if (id === MY_STALL_GRID_ID) {
        stalls.push({
          id, row, col,
          status: "mine",
          vendor: myName ? `${myName} (You)` : "Your Stall",
          category: myCategory ?? "—",
          note: "I'm Here — Open",
        });
        continue;
      }
      if (id === 12 || id === 38 || id === 42) {
        stalls.push({ id, row, col, status: "busy", vendor: `Vendor #${id}`, category: CATEGORIES[slot % CATEGORIES.length], note: "Very busy — queue forming" });
        slot++;
        continue;
      }
      if (id % 9 === 0 || id === 5 || id === 18 || id === 33) {
        stalls.push({ id, row, col, status: "available", vendor: null, category: null });
        continue;
      }
      stalls.push({ id, row, col, status: "open", vendor: `Vendor #${id}`, category: CATEGORIES[slot % CATEGORIES.length], note: "Open for business" });
      slot++;
    }
  }
  return stalls;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
  return null;
}

const STATUS_CONFIG: Record<StallStatus, { label: string; color: string; dot: string; bg: string; border: string }> = {
  mine:      { label: "My Stall",   color: "text-white", dot: "bg-amber-400",  bg: "bg-amber-400/20",   border: "border-amber-400/60" },
  open:      { label: "Active",     color: "text-white", dot: "bg-emerald-400",bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  flash:     { label: "Flash Sale", color: "text-white", dot: "bg-yellow-300", bg: "bg-yellow-400/15",  border: "border-yellow-400/50" },
  busy:      { label: "Busy",       color: "text-white", dot: "bg-orange-400", bg: "bg-orange-500/15",  border: "border-orange-500/40" },
  available: { label: "Available",  color: "text-white", dot: "bg-[var(--raised)]", bg: "bg-[var(--lifted)]", border: "border-[var(--border)]" },
};

type FilterType = "all" | StallStatus;

export default function MarketLayoutPage() {
  const [myVendorId, setMyVendorId] = useState<string | null>(null);
  const [myVendorName, setMyVendorName] = useState<string | null>(null);
  const [myVendorCategory, setMyVendorCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Stall | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [myFlashActive, setMyFlashActive] = useState(false);
  const [flashEndTime, setFlashEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [allFlashSales, setAllFlashSales] = useState<any[]>([]);
  /** Bumped when a flash sale is created elsewhere in the app (e.g. Selling Tools) */
  const [flashReloadNonce, setFlashReloadNonce] = useState(0);
  /** Re-render every second so countdowns in the map & sidebar stay accurate */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((c) => c + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const id = getCookie("vendor-id");
    setMyVendorId(id);
    if (!id || !SUPABASE_CONFIGURED) return;
    // Fetch real vendor name + category from DB
    const db = supabaseAdmin ?? supabase;
    db.from("vendor")
      .select("nama_perniagaan, jenis_jualan")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          setMyVendorName(data.nama_perniagaan ?? null);
          setMyVendorCategory(data.jenis_jualan ?? null);
        }
      });
  }, []);

  useEffect(() => {
    const bump = () => setFlashReloadNonce((n) => n + 1);
    window.addEventListener("pasar-smart-flash-sale", bump);
    return () => window.removeEventListener("pasar-smart-flash-sale", bump);
  }, []);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !myVendorId) return;

    const loadFlash = async () => {
      try {
        // Load all active flash sales
        const { data: allSales, error: allError } = await supabase
          .from("flash_sale")
          .select("*")
          .eq("is_active", true)
          .gt("end_time", new Date().toISOString());

        if (allError) throw allError;
        setAllFlashSales(allSales || []);

        // Load demo vendor's flash sale for countdown
        const { data: mySales, error: myError } = await supabase
          .from("flash_sale")
          .select("end_time")
          .eq("vendor_id", myVendorId)
          .eq("is_active", true)
          .gt("end_time", new Date().toISOString())
          .order("end_time", { ascending: false })
          .limit(1);

        if (myError) throw myError;

        const activeSale = (mySales ?? [])[0];
        if (activeSale) {
          const endTime = new Date(activeSale.end_time);
          setFlashEndTime(endTime);
          setMyFlashActive(true);
        } else {
          setFlashEndTime(null);
          setMyFlashActive(false);
        }
      } catch (e) {
        console.error("Failed to load flash sales:", e);
        setMyFlashActive(false);
        setFlashEndTime(null);
        setAllFlashSales([]);
      }
    };

    loadFlash();
    const interval = setInterval(loadFlash, 30000);
    return () => clearInterval(interval);
  }, [myVendorId, flashReloadNonce]);

  // Countdown timer effect
  useEffect(() => {
    if (!flashEndTime) {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const remaining = flashEndTime.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeRemaining("EXPIRED");
        setMyFlashActive(false);
        setFlashEndTime(null);
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [flashEndTime]);

  const STALLS = makeStalls(myVendorName, myVendorCategory);
  const liveStalls: Stall[] = STALLS.map((stall) => {
    // Flash deals appear on your stall cell (synthetic grid position for this UI)
    if (stall.id === MY_STALL_GRID_ID && myVendorId) {
      const now = Date.now();
      const myActiveSales = allFlashSales.filter(
        (sale) => sale.vendor_id === myVendorId && new Date(sale.end_time).getTime() > now
      );
      if (myActiveSales.length > 0) {
        const soonestEnd = Math.min(...myActiveSales.map((s) => new Date(s.end_time).getTime()));
        const rem = formatRemainingMs(soonestEnd - Date.now());
        return {
          ...stall,
          status: "flash" as StallStatus,
          note: `⚡ Flash live · ends in ${rem}`,
        };
      }
    }
    return stall;
  });

  const selectedStall = selected
    ? liveStalls.find((s) => s.id === selected.id) ?? selected
    : null;

  const counts = {
    total: liveStalls.length,
    open: liveStalls.filter((s) => s.status === "open" || s.status === "mine" || s.status === "busy").length,
    available: liveStalls.filter((s) => s.status === "available").length,
    flash: liveStalls.filter((s) => s.status === "flash").length,
  };

  const visible = filter === "all" ? liveStalls : liveStalls.filter((s) => s.status === filter);

  const shortestFlashRemaining = useMemo(() => {
    if (!myVendorId || !allFlashSales.length) return null;
    const ends = allFlashSales
      .filter((s) => s.vendor_id === myVendorId)
      .map((s) => new Date(s.end_time).getTime() - Date.now())
      .filter((ms) => ms > 0);
    if (!ends.length) return null;
    return Math.min(...ends);
  }, [allFlashSales, myVendorId, tick]);

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

      {myFlashActive && timeRemaining && timeRemaining !== "EXPIRED" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/15 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <p className="text-sm font-bold text-amber-300">Your flash sale is live on the map</p>
              <p className="text-xs text-[var(--muted)]">Stall #{MY_STALL_GRID_ID} — customers see the deal here</p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-400/50 bg-[var(--abyss)] px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Time left</p>
            <p className="font-mono text-2xl font-bold tabular-nums text-amber-400">{timeRemaining}</p>
          </div>
        </div>
      )}

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
                  <span className="ml-1 opacity-70">({liveStalls.filter((s) => s.status === f).length})</span>
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
              {liveStalls.map((stall) => {
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
                    {stall.id === MY_STALL_GRID_ID && stall.status === "flash" && shortestFlashRemaining != null && (
                      <span className="absolute left-0 right-0 top-5 px-0.5 text-center font-mono text-[7px] font-bold leading-tight text-yellow-300">
                        {formatRemainingMs(shortestFlashRemaining)}
                      </span>
                    )}
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
              <p className="font-semibold text-amber-400">Your stall: #{MY_STALL_GRID_ID} — Row C, Col 5</p>
              <p className="text-xs text-[var(--muted)]">{myVendorName ?? "Your Stall"} · {myVendorCategory ?? "—"} · Currently marked {myFlashActive ? "Flash Sale" : "Open"}</p>
            </div>
            <Link href="/vendor/dashboard" className="ml-auto shrink-0 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/30">
              Manage →
            </Link>
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selectedStall ? (
            <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Stall #{selectedStall.id}</p>
                  <h3 className="mt-0.5 text-lg font-bold text-[var(--text)]">{selectedStall.vendor}</h3>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_CONFIG[selectedStall.status].bg} ${STATUS_CONFIG[selectedStall.status].color}`}>
                  {STATUS_CONFIG[selectedStall.status].label}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Category</span>
                  <span className="font-medium text-[var(--text)]">{selectedStall.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Location</span>
                  <span className="font-medium text-[var(--text)]">Row {String.fromCharCode(65 + selectedStall.row)}, Col {selectedStall.col + 1}</span>
                </div>
                {selectedStall.note && (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--raised)] px-3 py-2 text-xs text-[var(--secondary)]">
                    {selectedStall.note}
                  </div>
                )}
                {selectedStall.status === "flash" && myVendorId && (
                  <div className="space-y-2">
                    {allFlashSales
                      .filter((sale) => sale.vendor_id === myVendorId)
                      .map((sale) => {
                        const remaining = new Date(sale.end_time).getTime() - Date.now();
                        if (remaining <= 0) return null;
                        const timeStr = formatRemainingMs(remaining);
                        return (
                          <div key={sale.id} className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-2">
                            <p className="text-xs font-semibold text-yellow-400">
                              ⚡ {sale.discount_percentage}% OFF · RM {Number(sale.discounted_price).toFixed(2)}
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                              Time remaining:{" "}
                              <span className="font-mono font-bold text-yellow-300">{timeStr}</span>
                            </p>
                          </div>
                        );
                      })}
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
            {myVendorId && allFlashSales.some((s) => s.vendor_id === myVendorId) ? (
              allFlashSales
                .filter((sale) => sale.vendor_id === myVendorId)
                .map((sale) => {
                  const stall = STALLS.find((s) => s.id === MY_STALL_GRID_ID);
                  if (!stall) return null;
                  const remaining = new Date(sale.end_time).getTime() - Date.now();
                  if (remaining <= 0) return null;
                  const timeStr = formatRemainingMs(remaining);
                  const priceStr = `RM ${Number(sale.discounted_price).toFixed(2)}`;

                  return (
                    <button
                      key={sale.id}
                      type="button"
                      onClick={() =>
                        setSelected({
                          ...stall,
                          status: "flash",
                          note: `⚡ Flash · ${formatRemainingMs(remaining)} left`,
                        })
                      }
                      className="mb-2 flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--raised)]/50 px-3 py-2 text-left transition-all hover:border-yellow-400/30"
                    >
                      <span className="text-lg">⚡</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[var(--text)]">{stall.vendor}</p>
                        <p className="text-[10px] text-[var(--muted)]">
                          Stall #{stall.id} · {stall.category}
                        </p>
                        <p className="text-[10px] font-bold text-yellow-400">
                          {priceStr} ({sale.discount_percentage}% off)
                        </p>
                        <p className="mt-1 text-[10px] font-mono font-bold text-yellow-400">{timeStr} left</p>
                      </div>
                    </button>
                  );
                })
            ) : (
              <p className="text-center text-xs text-[var(--muted)]">No flash sales active nearby.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
