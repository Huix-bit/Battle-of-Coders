"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import UserMapLiveGPS, { type UserMapRef } from "@/components/UserMapLiveGPS";
import { ALL_MARKETS, MELAKA_EVENT } from "@/lib/mockMarketEvents";
import type { Stall } from "@/lib/mockMarketEvents";

type StallInfo = Stall;

const MAP_VIEWS = [
  { id: "heatmap", label: "🔥 Crowd Heatmap", desc: "Real-time density" },
  { id: "layout", label: "🏪 Stall Layout", desc: "Zone directory" },
  { id: "access", label: "🚗 Parking & Gates", desc: "Entrances & pickup" },
  { id: "deals", label: "⚡ Live Deals", desc: "Flash & active offers" },
] as const;

const DENSITY: number[][] = [
  [10, 20, 40, 85, 90, 75, 35, 15],
  [15, 30, 65, 95, 100, 80, 45, 20],
  [25, 50, 70, 80, 85, 70, 40, 18],
  [20, 45, 60, 65, 70, 55, 30, 12],
  [10, 25, 35, 45, 50, 40, 20, 10],
  [5, 15, 20, 25, 30, 20, 12, 8],
];

const ROW_LABELS = ["A", "B", "C", "D", "E", "F"];
const COL_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const AI_ROUTES = [
  {
    label: "⚡ Minimize Wait",
    path: ["F2", "E5", "D3", "C2"],
    desc: "Quieter stalls first - avg wait under 5 min",
  },
  {
    label: "🌟 Maximize Variety",
    path: ["A4", "D3", "C2", "E5", "F2"],
    desc: "5 stalls, 5 categories, full experience",
  },
  {
    label: "🔥 Popular Picks",
    path: ["B4", "B5", "A4", "C4"],
    desc: "Highest-rated stalls - expect queues",
  },
] as const;

const CAT_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Noodles: { bg: "bg-green-900/60", text: "text-green-300", border: "border-green-500/40" },
  Grilled: { bg: "bg-orange-900/60", text: "text-orange-300", border: "border-orange-500/40" },
  Seafood: { bg: "bg-cyan-900/60", text: "text-cyan-300", border: "border-cyan-500/40" },
  Drinks: { bg: "bg-blue-900/60", text: "text-blue-300", border: "border-blue-500/40" },
  Rice: { bg: "bg-yellow-900/60", text: "text-yellow-300", border: "border-yellow-500/40" },
  Fruits: { bg: "bg-lime-900/60", text: "text-lime-300", border: "border-lime-500/40" },
  Kuih: { bg: "bg-pink-900/60", text: "text-pink-300", border: "border-pink-500/40" },
  Snacks: { bg: "bg-purple-900/60", text: "text-purple-300", border: "border-purple-500/40" },
  Toilet: { bg: "bg-[var(--raised)]", text: "text-[var(--muted)]", border: "border-[var(--border)]" },
  Path: { bg: "bg-transparent", text: "text-transparent", border: "border-transparent" },
  Desserts: { bg: "bg-pink-900/60", text: "text-pink-300", border: "border-pink-500/40" },
  Bread: { bg: "bg-amber-900/60", text: "text-amber-300", border: "border-amber-500/40" },
  Goods: { bg: "bg-slate-800/60", text: "text-slate-300", border: "border-slate-500/40" },
};

type AccessType = "road" | "carpark" | "mkt" | "gate-a" | "gate-b" | "gate-c" | "green" | "wall" | "path" | "pickup";

type AccessCell = {
  type: AccessType;
  label?: string;
  sub?: string;
  icon?: string;
};

const ACCESS_GRID: AccessCell[][] = [
  [{ type: "road" }, { type: "road" }, { type: "road" }, { type: "road" }, { type: "road" }, { type: "gate-a", label: "Gate A", sub: "Main Entrance", icon: "🚪" }, { type: "road" }, { type: "road" }, { type: "road" }, { type: "road" }],
  [{ type: "road" }, { type: "green", label: "🌿" }, { type: "wall" }, { type: "wall" }, { type: "wall" }, { type: "wall" }, { type: "wall" }, { type: "wall" }, { type: "green", label: "🌿" }, { type: "road" }],
  [{ type: "gate-b", label: "Gate B", sub: "Side Lane", icon: "🏍️" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "road" }],
  [{ type: "road" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "road" }],
  [{ type: "road" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "path", label: "🚶 Path" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "road" }],
  [{ type: "road" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "mkt" }, { type: "road" }],
  [{ type: "road" }, { type: "green", label: "🌿" }, { type: "wall" }, { type: "wall" }, { type: "gate-c", label: "Gate C", sub: "Car Park", icon: "🅿️" }, { type: "wall" }, { type: "wall" }, { type: "green", label: "🌿" }, { type: "road" }, { type: "road" }],
  [{ type: "road" }, { type: "carpark", label: "P" }, { type: "carpark", label: "P" }, { type: "carpark", label: "P" }, { type: "pickup", label: "Pickup", sub: "P3", icon: "🚗" }, { type: "carpark", label: "P" }, { type: "carpark", label: "P" }, { type: "carpark", label: "P" }, { type: "road" }, { type: "road" }],
];

const ACCESS_STYLE: Record<AccessType, { bg: string; text: string; border: string }> = {
  road: { bg: "bg-zinc-800/80", text: "text-zinc-500", border: "border-zinc-700/30" },
  carpark: { bg: "bg-slate-800/80", text: "text-slate-400", border: "border-slate-700/30" },
  mkt: { bg: "bg-emerald-900/40", text: "text-emerald-400", border: "border-emerald-700/30" },
  "gate-a": { bg: "bg-violet-600/80", text: "text-white", border: "border-violet-400/60" },
  "gate-b": { bg: "bg-cyan-600/80", text: "text-white", border: "border-cyan-400/60" },
  "gate-c": { bg: "bg-amber-600/80", text: "text-white", border: "border-amber-400/60" },
  green: { bg: "bg-green-900/60", text: "text-green-400", border: "border-green-800/30" },
  wall: { bg: "bg-[var(--abyss)]/80", text: "text-[var(--muted)]", border: "border-[var(--border)]" },
  path: { bg: "bg-zinc-700/60", text: "text-zinc-300", border: "border-zinc-600/30" },
  pickup: { bg: "bg-emerald-500/80", text: "text-white", border: "border-emerald-300/60" },
};

const PICKUP_LEGEND = [
  { id: "P1", gate: "Gate A", desc: "Main Entrance", color: "bg-violet-500" },
  { id: "P2", gate: "Gate B", desc: "Side Lane", color: "bg-cyan-500" },
  { id: "P3", gate: "Gate C", desc: "Car Park", color: "bg-emerald-500" },
];

type DealCell = {
  deal: "flash" | "open" | "busy" | "closed";
  discount?: string;
  wait: string;
  emoji: string;
  name: string;
};

function heatColor(density: number) {
  if (density >= 80) return "bg-red-500";
  if (density >= 60) return "bg-orange-500";
  if (density >= 40) return "bg-amber-400";
  if (density >= 20) return "bg-emerald-500";
  return "bg-[var(--raised)]";
}

function heatOpacity(density: number) {
  return 0.2 + (density / 100) * 0.75;
}

function dealStyle(deal?: DealCell["deal"]) {
  if (deal === "flash") return "bg-amber-500/80 ring-1 ring-amber-300/60 animate-pulse";
  if (deal === "busy") return "bg-orange-500/60 ring-1 ring-orange-400/40";
  if (deal === "open") return "bg-emerald-500/60 ring-1 ring-emerald-400/40";
  if (deal === "closed") return "bg-zinc-700/60";
  return "bg-[var(--raised)]/40";
}

function isEventUpcoming(dateString: string) {
  try {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate > today;
  } catch {
    return false;
  }
}

function GuardedCartButton({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl bg-emerald-500 px-6 py-2.5 text-center text-sm font-bold text-white transition-all hover:bg-emerald-400 ${className}`}
    >
      {label}
    </button>
  );
}

function StallDetailPanel({
  selected,
  onClose,
  onGuardCart,
}: {
  selected: StallInfo;
  onClose: () => void;
  onGuardCart: () => void;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{selected.emoji}</span>
          <div>
            <p className="font-bold text-[var(--text)]">{selected.name}</p>
            <p className="text-xs text-[var(--muted)]">Zone {selected.id} · {selected.cat}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">
          ✕
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            selected.crowd >= 80
              ? "bg-red-400/20 text-red-400"
              : selected.crowd >= 50
                ? "bg-amber-400/20 text-amber-400"
                : "bg-emerald-400/20 text-emerald-400"
          }`}
        >
          {selected.crowd}% busy
        </span>
        <span className="text-sm text-[var(--muted)]">⏱ Wait: {selected.wait}</span>
        {selected.flash && (
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-400">
            ⚡ Flash Deal
          </span>
        )}
      </div>
      <GuardedCartButton label="Add to Cart →" onClick={onGuardCart} className="mt-4 inline-block px-4 py-2 text-xs" />
    </div>
  );
}

function ActiveStallsGrid({
  stalls,
  selected,
  onSelect,
  onGuardCart,
}: {
  stalls: StallInfo[];
  selected: StallInfo | null;
  onSelect: (stall: StallInfo) => void;
  onGuardCart: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-[var(--accent-strong)]">Active Stalls Tonight</h3>
        <p className="text-xs text-[var(--muted)]">Sorted by crowd level</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...stalls].sort((a, b) => b.crowd - a.crowd).map((stall) => (
          <button
            key={stall.id}
            type="button"
            onClick={() => onSelect(stall)}
            className={`rounded-xl border p-4 text-left transition-all hover:border-emerald-500/30 hover:bg-[var(--raised)] ${
              selected?.id === stall.id
                ? "border-emerald-500/50 bg-emerald-500/10"
                : stall.flash
                  ? "border-amber-500/30 bg-[var(--lifted)]"
                  : "border-[var(--border)] bg-[var(--lifted)]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{stall.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text)]">{stall.name}</p>
                <p className="text-[10px] text-[var(--muted)]">Zone {stall.id} · {stall.cat}</p>
                {stall.flash && (
                  <span className="mt-2 inline-block rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                    ⚡ Flash Deal Active
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--raised)]">
                <div
                  className={`h-full rounded-full ${
                    stall.crowd >= 80 ? "bg-red-500" : stall.crowd >= 50 ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                  style={{ width: `${stall.crowd}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-[var(--muted)]">{stall.crowd}%</span>
            </div>

            <p className="mt-2 text-[10px] text-[var(--muted)]">⏱ Wait: {stall.wait}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <GuardedCartButton label="🛒 Go to Cart" onClick={onGuardCart} />
      </div>
    </div>
  );
}

export default function PublicMap() {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState("melaka");
  const [mapView, setMapView] = useState<(typeof MAP_VIEWS)[number]["id"]>("heatmap");
  const [activeRoute, setActiveRoute] = useState<number | null>(null);
  const [selected, setSelected] = useState<StallInfo | null>(null);
  const [dealSel, setDealSel] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentDistance, setCurrentDistance] = useState(0);
  const mapRef = useRef<UserMapRef>(null);

  const selectedEvent = useMemo(
    () => ALL_MARKETS.find((market) => market.id === selectedEventId) ?? MELAKA_EVENT,
    [selectedEventId]
  );

  const MARKET_EVENT = selectedEvent;
  const ACTIVE_STALLS = selectedEvent.stalls;
  const LAYOUT_GRID = selectedEvent.layoutGrid;
  const NAVIGATION_DIRECTIONS = selectedEvent.navigationDirections;
  const routePath: readonly string[] = activeRoute !== null ? AI_ROUTES[activeRoute].path : [];

  const DEAL_STALLS = useMemo(() => {
    const deals: Record<string, DealCell> = {};

    ACTIVE_STALLS.forEach((stall) => {
      let deal: DealCell["deal"] = "closed";
      if (!stall.open) {
        deal = "closed";
      } else if (stall.flash) {
        deal = "flash";
      } else if (stall.crowd >= 80) {
        deal = "busy";
      } else {
        deal = "open";
      }

      deals[stall.id] = {
        deal,
        discount: stall.flash ? (stall.crowd > 70 ? "20% off" : "15% off") : undefined,
        wait: stall.wait,
        emoji: stall.emoji,
        name: stall.name,
      };
    });

    return deals;
  }, [ACTIVE_STALLS]);

  const promptSignInForCart = () => {
    window.alert("Please sign in to add items to your cart.");
    router.push("/sign-in");
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setMapView("heatmap");
    setSelected(null);
    setDealSel(null);
    setActiveRoute(null);
    setIsNavigating(false);
    setCurrentStep(0);
    setCurrentDistance(0);
    setIsDropdownOpen(false);
  };

  const currentNavStep = NAVIGATION_DIRECTIONS[currentStep];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--text)]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--text)]">Live Map</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-semibold text-emerald-300">
            Public Preview
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Live · updates every 30s
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--text)]">📌 Select a Night Market</label>
        <div className="w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--lifted)] transition-all duration-300">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((open) => !open)}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-[var(--text)] transition-all hover:bg-[var(--raised)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
          >
            <div className="flex-1">
              <p className="text-[var(--text)]">{MARKET_EVENT.name}</p>
              <p className="text-xs text-[var(--muted)]">📅 {MARKET_EVENT.date}</p>
            </div>
            <span
              className={`ml-3 font-bold text-[var(--muted)] transition-transform duration-300 ${
                isDropdownOpen ? "rotate-180 text-[var(--accent)]" : ""
              }`}
            >
              ▼
            </span>
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDropdownOpen ? "max-h-96" : "max-h-0"}`}>
            {ALL_MARKETS.map((market, index) => (
              <button
                key={market.id}
                type="button"
                onClick={() => handleEventChange(market.id)}
                className={`w-full border-t border-[var(--border)] px-4 py-3 text-left transition-all hover:bg-[var(--raised)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 ${
                  selectedEventId === market.id
                    ? "border-l-4 border-l-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--text)]"
                } ${index === ALL_MARKETS.length - 1 ? "last:rounded-b-lg" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{market.name}</p>
                      {isEventUpcoming(market.date) && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)]">📅 {market.date} · {market.operatingHours}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">📍 {market.address}</p>
                  </div>
                  {selectedEventId === market.id && <span className="ml-2 text-lg">✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">📍 {MARKET_EVENT.name}</h2>
          <Link
            href="/calendar"
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-[var(--muted)] transition-colors hover:text-emerald-400 hover:underline mt-1"
          >
            📅 {MARKET_EVENT.date} · {MARKET_EVENT.operatingHours}
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            <UserMapLiveGPS
              ref={mapRef}
              targetLat={MARKET_EVENT.latitude}
              targetLng={MARKET_EVENT.longitude}
              marketName={MARKET_EVENT.name}
              onStepChange={(stepIndex) => setCurrentStep(stepIndex)}
              onLocationUpdate={(_lat, _lng, distance) => setCurrentDistance(distance)}
            />
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setIsNavigating((navigating) => {
                  const nextState = !navigating;
                  if (nextState) {
                    setCurrentStep(0);
                    mapRef.current?.startNavigation();
                  } else {
                    mapRef.current?.stopNavigation();
                  }
                  return nextState;
                });
              }}
              className={`w-full rounded-xl px-4 py-3 font-bold text-white transition-all ${
                isNavigating ? "bg-red-500 hover:bg-red-400" : "bg-emerald-500 hover:bg-emerald-400"
              }`}
            >
              {isNavigating ? "🛑 Stop Navigation" : "▶️ Start Navigation"}
            </button>

            {isNavigating ? (
              <div className="space-y-4">
                <div className="space-y-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{currentNavStep?.icon}</span>
                    <span className="rounded-full bg-emerald-500/30 px-2 py-1 text-xs font-bold text-emerald-300">
                      Step {currentStep + 1} / {NAVIGATION_DIRECTIONS.length}
                    </span>
                  </div>
                  <p className="font-semibold text-[var(--text)]">{currentNavStep?.instruction}</p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-emerald-300">📏 {currentNavStep?.distance}</p>
                    <p className="text-xs text-emerald-400">🎯 {currentDistance.toFixed(0)} m to destination</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">Upcoming</p>
                  <div className="max-h-32 space-y-1.5 overflow-y-auto">
                    {NAVIGATION_DIRECTIONS.map((direction, index) => (
                      <button
                        key={direction.step}
                        type="button"
                        onClick={() => setCurrentStep(index)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-all ${
                          index === currentStep
                            ? "bg-emerald-500/20 text-emerald-300"
                            : index < currentStep
                              ? "bg-[var(--raised)] text-[var(--muted)] line-through opacity-60"
                              : "bg-[var(--lifted)] text-[var(--text)] hover:border-emerald-500/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{direction.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate">{direction.instruction}</p>
                            <p className="text-[10px] text-[var(--muted)]">{direction.distance}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                    disabled={currentStep === 0}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--lifted)] py-2 text-xs font-semibold text-[var(--text)] transition-all hover:border-slate-400/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ⬅️ Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep((step) => Math.min(NAVIGATION_DIRECTIONS.length - 1, step + 1))}
                    disabled={currentStep === NAVIGATION_DIRECTIONS.length - 1}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--lifted)] py-2 text-xs font-semibold text-[var(--text)] transition-all hover:border-slate-400/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next ➡️
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--lifted)] p-4">
                <p className="text-sm font-semibold text-[var(--text)]">🗺️ Market Details</p>
                <div className="space-y-2 text-xs text-[var(--muted)]">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="font-semibold text-[var(--text)]">Location</p>
                      <p>{MARKET_EVENT.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🕐</span>
                    <div>
                      <p className="font-semibold text-[var(--text)]">Operating Hours</p>
                      <p>{MARKET_EVENT.operatingHours}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📏</span>
                    <div>
                      <p className="font-semibold text-[var(--text)]">Distance</p>
                      <p>~1.2 km from your location</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">⏱️</span>
                    <div>
                      <p className="font-semibold text-[var(--text)]">Walk Time</p>
                      <p>~15 minutes on foot</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[var(--muted)]">Click &quot;Start Navigation&quot; to begin turn-by-turn directions.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">🗺️ Live Market Map</h1>
        <p className="text-sm text-[var(--muted)]">Choose a map view to explore the night market</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MAP_VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => {
              setMapView(view.id);
              setSelected(null);
              setDealSel(null);
            }}
            className={`flex flex-col items-start gap-0.5 rounded-2xl border px-4 py-3 text-left transition-all ${
              mapView === view.id
                ? "border-[var(--accent)]/60 bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--lifted)] text-[var(--text)] hover:border-[var(--accent)]/30 hover:bg-[var(--raised)]"
            }`}
          >
            <span className="text-sm font-bold">{view.label}</span>
            <span className={`text-[11px] ${mapView === view.id ? "text-[var(--accent)]/70" : "text-[var(--muted)]"}`}>
              {view.desc}
            </span>
          </button>
        ))}
      </div>

      {mapView === "heatmap" && (
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {AI_ROUTES.map((route, index) => (
                <button
                  key={route.label}
                  type="button"
                  onClick={() => setActiveRoute((current) => (current === index ? null : index))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeRoute === index
                      ? "border-[var(--accent)]/60 bg-[var(--accent)]/20 text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/30"
                  }`}
                >
                  {route.label}
                </button>
              ))}
              {activeRoute !== null && (
                <span className="rounded-full border border-[var(--border)] bg-[var(--lifted)] px-3 py-1.5 text-xs text-[var(--muted)]">
                  {AI_ROUTES[activeRoute].desc}
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)]/80 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted)]">← Entrance</span>
                <div className="h-px flex-1 border-t border-dashed border-[var(--border)]" />
                <span className="text-xs font-semibold text-[var(--muted)]">Exit →</span>
              </div>
              <div className="space-y-1">
                {DENSITY.map((row, rowIndex) => (
                  <div key={ROW_LABELS[rowIndex]} className="flex items-center gap-1">
                    <span className="w-4 shrink-0 text-center text-[10px] font-bold text-[var(--muted)]">{ROW_LABELS[rowIndex]}</span>
                    {row.map((density, colIndex) => {
                      const cellId = `${ROW_LABELS[rowIndex]}${COL_LABELS[colIndex]}`;
                      const stall = ACTIVE_STALLS.find((activeStall) => activeStall.id === cellId);
                      const inRoute = routePath.includes(cellId);

                      return (
                        <button
                          key={cellId}
                          type="button"
                          onClick={() => setSelected(stall ?? null)}
                          style={{ opacity: heatOpacity(density) }}
                          title={stall ? stall.name : `Zone ${cellId} - ${density}% density`}
                          className={`relative h-10 flex-1 rounded-lg transition-all hover:z-10 hover:scale-105 ${heatColor(density)} ${
                            stall ? "ring-1 ring-white/40" : ""
                          } ${inRoute ? "z-10 scale-110 ring-2 ring-[var(--accent)]" : ""}`}
                        >
                          {stall && <span className="absolute inset-0 flex items-center justify-center text-base">{stall.emoji}</span>}
                          {inRoute && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[var(--accent)]" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
                <div className="mt-1 flex gap-1 pl-5">
                  {COL_LABELS.map((column) => (
                    <span key={column} className="flex-1 text-center text-[10px] text-[var(--muted)]">
                      {column}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-[var(--muted)]">
                <span className="font-semibold">Crowd:</span>
                {[
                  { color: "bg-emerald-500", label: "Low" },
                  { color: "bg-amber-400", label: "Moderate" },
                  { color: "bg-orange-500", label: "High" },
                  { color: "bg-red-500", label: "Very High" },
                ].map((legend) => (
                  <div key={legend.label} className="flex items-center gap-1">
                    <span className={`h-2.5 w-4 rounded-sm opacity-80 ${legend.color}`} />
                    {legend.label}
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-4 rounded-sm bg-white/30 ring-1 ring-white/40" />
                  Has stall
                </div>
              </div>
            </div>

            {selected && <StallDetailPanel selected={selected} onClose={() => setSelected(null)} onGuardCart={promptSignInForCart} />}
          </div>

          <ActiveStallsGrid
            stalls={ACTIVE_STALLS}
            selected={selected}
            onSelect={setSelected}
            onGuardCart={promptSignInForCart}
          />
        </div>
      )}

      {mapView === "layout" && (
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)]/80 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted)]">← North (Entrance)</span>
                <div className="h-px flex-1 border-t border-dashed border-[var(--border)]" />
                <span className="text-xs font-semibold text-[var(--muted)]">South →</span>
              </div>
              <div className="space-y-1.5">
                {LAYOUT_GRID.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-stretch gap-1.5">
                    <span className="flex w-4 shrink-0 items-center justify-center text-[10px] font-bold text-[var(--muted)]">
                      {ROW_LABELS[rowIndex]}
                    </span>
                    {row.map((cell, colIndex) => {
                      const cellId = `${ROW_LABELS[rowIndex]}${colIndex + 1}`;
                      const style = cell ? CAT_STYLE[cell.cat] : null;
                      const stallData = ACTIVE_STALLS.find((stall) => stall.id === cellId);

                      return (
                        <div
                          key={cellId}
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
                  {COL_LABELS.map((column) => (
                    <span key={column} className="flex-1 text-center text-[10px] text-[var(--muted)]">
                      {column}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(CAT_STYLE)
                  .filter(([category]) => category !== "Path")
                  .map(([category, styles]) => (
                    <div
                      key={category}
                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles.bg} ${styles.border} ${styles.text}`}
                    >
                      {category}
                    </div>
                  ))}
              </div>
            </div>

            {selected && <StallDetailPanel selected={selected} onClose={() => setSelected(null)} onGuardCart={promptSignInForCart} />}
          </div>

          <ActiveStallsGrid
            stalls={ACTIVE_STALLS}
            selected={selected}
            onSelect={setSelected}
            onGuardCart={promptSignInForCart}
          />
        </div>
      )}

      {mapView === "access" && (
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)]/80 p-4">
              <p className="mb-3 text-xs font-semibold text-[var(--muted)]">
                Market perimeter, gates, and Pasar-Drive pickup points
              </p>
              <div className="space-y-1">
                {ACCESS_GRID.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1">
                    {row.map((cell, colIndex) => {
                      const styles = ACCESS_STYLE[cell.type];
                      const isGate = cell.type === "gate-a" || cell.type === "gate-b" || cell.type === "gate-c";
                      const isPickup = cell.type === "pickup";

                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`relative flex h-12 flex-1 flex-col items-center justify-center rounded-lg border text-center ${styles.bg} ${styles.border} ${
                            isGate || isPickup ? "ring-1 ring-white/30" : ""
                          }`}
                        >
                          {cell.icon && <span className="text-sm leading-none">{cell.icon}</span>}
                          {cell.label && <span className={`text-[8px] font-bold leading-tight ${styles.text}`}>{cell.label}</span>}
                          {cell.sub && <span className={`text-[7px] leading-none opacity-75 ${styles.text}`}>{cell.sub}</span>}
                          {cell.type === "mkt" && !cell.label && <span className="text-[8px] text-emerald-700/50">·</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                {[
                  { color: "bg-violet-600", label: "Gate A (Main Entrance)" },
                  { color: "bg-cyan-600", label: "Gate B (Side Lane)" },
                  { color: "bg-amber-600", label: "Gate C (Car Park)" },
                  { color: "bg-emerald-500", label: "Pasar-Drive Pickup" },
                  { color: "bg-emerald-900/60", label: "Market Area" },
                  { color: "bg-slate-800", label: "Car Park" },
                ].map((legend) => (
                  <div key={legend.label} className="flex items-center gap-1 text-[var(--muted)]">
                    <span className={`h-2.5 w-4 rounded-sm ${legend.color}`} />
                    {legend.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--accent-strong)]">🚗 Pasar-Drive Pickup Points</h3>
              <p className="text-xs text-[var(--muted)]">
                Enable Pasar-Drive in your cart and choose one of these points to collect all your orders in one go.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PICKUP_LEGEND.map((pickup) => (
                <div key={pickup.id} className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] p-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${pickup.color}`} />
                    <p className="font-semibold text-[var(--text)]">{pickup.gate}</p>
                    <span className="ml-auto rounded-full bg-[var(--raised)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                      {pickup.id}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">{pickup.desc}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--lifted)] p-4 text-xs text-[var(--muted)]">
              <p className="font-semibold text-[var(--text)]">ℹ️ How it works</p>
              <p>1. Add items from stalls to your cart</p>
              <p>2. Enable Pasar-Drive and choose a pickup point</p>
              <p>3. Pay via Stripe</p>
              <p>4. Vendors prepare and deliver to your gate (≈ 20 min)</p>
            </div>

            <div className="flex justify-center pt-2">
              <GuardedCartButton label="🛒 Enable Pasar-Drive in Cart" onClick={promptSignInForCart} />
            </div>
          </div>
        </div>
      )}

      {mapView === "deals" && (
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {ACTIVE_STALLS.filter((stall) => stall.flash).map((stall) => (
                <div
                  key={stall.id}
                  className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  {stall.emoji} {stall.name.split(" ").slice(0, 2).join(" ")} - {DEAL_STALLS[stall.id]?.discount}
                </div>
              ))}
            </div>

            <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)]/80 p-4">
              <p className="mb-3 text-xs font-semibold text-[var(--muted)]">Tap a stall to see deal details</p>
              <div className="space-y-1">
                {ROW_LABELS.map((row) => (
                  <div key={row} className="flex items-center gap-1">
                    <span className="w-4 shrink-0 text-center text-[10px] font-bold text-[var(--muted)]">{row}</span>
                    {COL_LABELS.map((column) => {
                      const cellId = `${row}${column}`;
                      const deal = DEAL_STALLS[cellId];

                      return (
                        <button
                          key={cellId}
                          type="button"
                          onClick={() => setDealSel(deal ? cellId : null)}
                          title={deal ? `${deal.emoji} ${deal.name}` : `Zone ${cellId}`}
                          className={`relative h-10 flex-1 rounded-lg border border-transparent transition-all hover:z-10 hover:scale-105 ${dealStyle(
                            deal?.deal
                          )} ${dealSel === cellId ? "z-10 scale-110 ring-2 ring-white/60" : ""}`}
                        >
                          {deal && <span className="absolute inset-0 flex items-center justify-center text-base">{deal.emoji}</span>}
                          {deal?.deal === "flash" && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
                <div className="mt-1 flex gap-1 pl-5">
                  {COL_LABELS.map((column) => (
                    <span key={column} className="flex-1 text-center text-[10px] text-[var(--muted)]">
                      {column}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-[var(--muted)]">
                {[
                  { color: "bg-amber-500", label: "Flash Deal ⚡" },
                  { color: "bg-orange-500", label: "Busy" },
                  { color: "bg-emerald-500", label: "Open & Quiet" },
                  { color: "bg-zinc-700", label: "Closed" },
                ].map((legend) => (
                  <div key={legend.label} className="flex items-center gap-1">
                    <span className={`h-2.5 w-4 rounded-sm opacity-80 ${legend.color}`} />
                    {legend.label}
                  </div>
                ))}
              </div>
            </div>

            {dealSel && DEAL_STALLS[dealSel] && (
              <div
                className={`rounded-2xl border p-5 ${
                  DEAL_STALLS[dealSel].deal === "flash"
                    ? "border-amber-500/40 bg-amber-500/8"
                    : "border-[var(--border)] bg-[var(--lifted)]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{DEAL_STALLS[dealSel].emoji}</span>
                    <div>
                      <p className="font-bold text-[var(--text)]">{DEAL_STALLS[dealSel].name}</p>
                      <p className="text-xs text-[var(--muted)]">Zone {dealSel} · ⏱ Wait: {DEAL_STALLS[dealSel].wait}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setDealSel(null)} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">
                    ✕
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DEAL_STALLS[dealSel].deal === "flash" && (
                    <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-400">
                      ⚡ Flash: {DEAL_STALLS[dealSel].discount}
                    </span>
                  )}
                  {DEAL_STALLS[dealSel].deal === "busy" && (
                    <span className="rounded-full bg-orange-400/20 px-2 py-0.5 text-xs font-semibold text-orange-400">
                      🔥 High demand
                    </span>
                  )}
                  {DEAL_STALLS[dealSel].deal === "open" && (
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                      ✓ Open & quiet
                    </span>
                  )}
                  {DEAL_STALLS[dealSel].deal === "closed" && (
                    <span className="rounded-full bg-zinc-600/40 px-2 py-0.5 text-xs font-semibold text-zinc-400">
                      ✕ Closed tonight
                    </span>
                  )}
                </div>
                {DEAL_STALLS[dealSel].deal !== "closed" && (
                  <GuardedCartButton
                    label={DEAL_STALLS[dealSel].deal === "flash" ? "⚡ Grab the Deal →" : "Add to Cart →"}
                    onClick={promptSignInForCart}
                    className="mt-4 inline-block px-4 py-2 text-xs"
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--accent-strong)]">Tonight&apos;s Offers</h3>
              <p className="text-xs text-[var(--muted)]">Flash deals & active stalls</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ACTIVE_STALLS.filter((stall) => stall.flash).map((stall) => (
                <button
                  key={stall.id}
                  type="button"
                  onClick={() => setDealSel(stall.id)}
                  className={`rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-left transition-all hover:bg-amber-500/15 ${
                    dealSel === stall.id ? "ring-1 ring-amber-400/60" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{stall.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-amber-300">{stall.name}</p>
                      <p className="text-[10px] text-amber-400/70">Zone {stall.id} · {DEAL_STALLS[stall.id]?.discount}</p>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                        ⚡ Flash Deal Active
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--raised)]">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${stall.crowd}%` }} />
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-[var(--muted)]">{stall.crowd}%</span>
                  </div>
                  <p className="mt-2 text-[10px] text-[var(--muted)]">⏱ Wait: {stall.wait}</p>
                </button>
              ))}

              {ACTIVE_STALLS.filter((stall) => !stall.flash && stall.open).map((stall) => (
                <button
                  key={stall.id}
                  type="button"
                  onClick={() => setDealSel(stall.id)}
                  className={`rounded-xl border p-4 text-left transition-all hover:border-emerald-500/30 hover:bg-[var(--raised)] ${
                    dealSel === stall.id
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-[var(--border)] bg-[var(--lifted)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{stall.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text)]">{stall.name}</p>
                      <p className="text-[10px] text-[var(--muted)]">Zone {stall.id} · {stall.cat}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        stall.crowd >= 80
                          ? "bg-red-400/20 text-red-400"
                          : stall.crowd >= 50
                            ? "bg-amber-400/20 text-amber-400"
                            : "bg-emerald-400/20 text-emerald-400"
                      }`}
                    >
                      {stall.crowd}%
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--raised)]">
                      <div
                        className={`h-full rounded-full ${
                          stall.crowd >= 80 ? "bg-red-500" : stall.crowd >= 50 ? "bg-amber-400" : "bg-emerald-500"
                        }`}
                        style={{ width: `${stall.crowd}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-[var(--muted)]">⏱ Wait: {stall.wait}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <GuardedCartButton label="🛒 Go to Cart" onClick={promptSignInForCart} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
