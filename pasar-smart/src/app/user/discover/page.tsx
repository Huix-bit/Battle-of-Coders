"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { upsertItem, cartCount, getCart } from "@/lib/cartStore";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";

const CATEGORIES = ["All", "Noodles", "Rice", "Grilled", "Drinks", "Kuih", "Fruits", "Seafood", "Snacks"];

const FOOD_TRAILS = [
  { title: "Budget Bites Trail", budget: "Under RM 20", stops: 4, desc: "Cendol → Kuih Muih → Keropok Lekor → Nasi Lemak", icon: "💚", color: "from-emerald-500/15 to-teal-500/15", border: "border-emerald-500/30" },
  { title: "Seafood Lover's Route", budget: "RM 40–60", stops: 3, desc: "Ikan Bakar → Keropok Lekor → Rojak Buah (dessert)", icon: "🐠", color: "from-blue-500/15 to-cyan-500/15", border: "border-blue-500/30" },
  { title: "Street Food Classic", budget: "RM 25–35", stops: 5, desc: "Mee Goreng → Ayam Percik → Satay → Cendol → Kuih", icon: "🔥", color: "from-amber-500/15 to-orange-500/15", border: "border-amber-500/30" },
];

const CROWD_COLOR: Record<string, string> = { high: "text-red-400 bg-red-400/10", medium: "text-amber-400 bg-amber-400/10", low: "text-emerald-400 bg-emerald-400/10" };
const CROWD_LABEL: Record<string, string> = { high: "Busy", medium: "Moderate", low: "Quiet" };

function categoryEmoji(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes("noodle") || c.includes("mee") || c.includes("pasta")) return "🍜";
  if (c.includes("rice") || c.includes("nasi")) return "🍚";
  if (c.includes("grill") || c.includes("bakar") || c.includes("ayam") || c.includes("satay")) return "🍗";
  if (c.includes("drink") || c.includes("air") || c.includes("minum") || c.includes("beverage")) return "🥤";
  if (c.includes("kuih") || c.includes("dessert") || c.includes("sweet") || c.includes("cake")) return "🧁";
  if (c.includes("fruit") || c.includes("buah") || c.includes("rojak")) return "🥭";
  if (c.includes("snack") || c.includes("keropok") || c.includes("crispy")) return "🍿";
  if (c.includes("seafood") || c.includes("ikan") || c.includes("fish") || c.includes("prawn")) return "🐠";
  return "🍽️";
}

type MenuItem = { id: string; name: string; price: number; emoji: string };

type Stall = {
  id: string;
  name: string;
  category: string;
  open: boolean;
  flash: boolean;
  flashDiscount: number | null;
  rating: number;
  reviews: number;
  crowd: "high" | "medium" | "low";
  price: string;
  tags: string[];
  desc: string;
  emoji: string;
  wait: string;
  menu: MenuItem[];
};

export default function DiscoverPage() {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [flashOnly, setFlashOnly] = useState(false);

  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeStall, setActiveStall] = useState<string | null>(null);
  const [pickerQty, setPickerQty] = useState<Record<string, number>>({});
  const [totalInCart, setTotalInCart] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setTotalInCart(cartCount());
  }, []);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }

    async function fetchStalls() {
      setLoading(true);
      try {
        // 1. All active vendors
        const { data: vendors, error: vErr } = await supabase
          .from("vendor")
          .select("id, nama_perniagaan, jenis_jualan, email")
          .eq("status", "AKTIF");
        if (vErr) throw vErr;
        if (!vendors || vendors.length === 0) { setStalls([]); return; }

        const vendorIds = vendors.map((v: any) => v.id);

        // 2. Which vendors are currently open (stall toggled on)
        const { data: statuses } = await supabase
          .from("stall_status")
          .select("vendor_id, is_present")
          .in("vendor_id", vendorIds);
        const openSet = new Set(
          (statuses ?? []).filter((r: any) => r.is_present).map((r: any) => r.vendor_id)
        );

        // 3. Active flash sales
        const now = new Date().toISOString();
        const { data: flashSales } = await supabase
          .from("flash_sale")
          .select("id, vendor_id, discounted_price, original_price, discount_percentage, end_time, item_name")
          .in("vendor_id", vendorIds)
          .eq("is_active", true)
          .gt("end_time", now);

        // Best flash deal per vendor (for badge/price display)
        const flashMap = new Map<string, { discount: number; price: number }>();
        // All active flash sale items per vendor (for cart menu)
        const flashItemsMap = new Map<string, { id: string; name: string; price: number; origPrice: number; discount: number }[]>();
        for (const fs of (flashSales ?? [])) {
          const disc = Number(fs.discount_percentage ?? 0);
          const existing = flashMap.get(fs.vendor_id);
          if (!existing || disc > existing.discount) {
            flashMap.set(fs.vendor_id, { discount: disc, price: Number(fs.discounted_price) });
          }
          const list = flashItemsMap.get(fs.vendor_id) ?? [];
          list.push({
            id: fs.id,
            name: fs.item_name?.trim() || "Flash Deal",
            price: Number(fs.discounted_price),
            origPrice: Number(fs.original_price),
            discount: disc,
          });
          flashItemsMap.set(fs.vendor_id, list);
        }

        // 4. Menu items per vendor
        const { data: menuItems } = await supabase
          .from("vendor_menu")
          .select("id, vendor_id, item_name, price, category")
          .in("vendor_id", vendorIds)
          .eq("is_available", true);
        const menuMap = new Map<string, MenuItem[]>();
        for (const item of (menuItems ?? [])) {
          const list = menuMap.get(item.vendor_id) ?? [];
          list.push({
            id: item.id,
            name: item.item_name,
            price: Number(item.price),
            emoji: categoryEmoji(item.category ?? ""),
          });
          menuMap.set(item.vendor_id, list);
        }

        // 5. Build stall objects
        const built: Stall[] = vendors.map((v: any) => {
          const isOpen = openSet.has(v.id);
          const flashInfo = flashMap.get(v.id) ?? null;
          const tags: string[] = [];
          if (flashInfo) tags.push(`Flash ⚡ ${flashInfo.discount > 0 ? flashInfo.discount + "% off" : "Deal"}`);
          if (isOpen) tags.push("Open Now ✓");

          // Prefer vendor_menu; fall back to flash sale items as purchasable entries
          const vendorMenuItems = menuMap.get(v.id) ?? [];
          const flashItems = (flashItemsMap.get(v.id) ?? []).map((fs) => ({
            id: fs.id,
            name: `${fs.name} (Flash Sale)`,
            price: fs.price,
            emoji: categoryEmoji(v.jenis_jualan ?? ""),
          }));
          const menu: MenuItem[] = vendorMenuItems.length > 0 ? vendorMenuItems : flashItems;

          const priceRange = menu.length > 0
            ? `RM ${Math.min(...menu.map((m) => m.price)).toFixed(0)}–${Math.max(...menu.map((m) => m.price)).toFixed(0)}`
            : "—";

          return {
            id: v.id,
            name: v.nama_perniagaan,
            category: v.jenis_jualan ?? "General",
            open: isOpen,
            flash: !!flashInfo,
            flashDiscount: flashInfo?.discount ?? null,
            rating: 4.5,
            reviews: 0,
            crowd: "medium" as const,
            price: flashInfo
              ? `RM ${flashInfo.price.toFixed(2)} ⚡ (was RM ${(flashInfo.price / (1 - flashInfo.discount / 100)).toFixed(2)})`
              : priceRange,
            tags,
            desc: `${v.nama_perniagaan} — ${v.jenis_jualan ?? "Local stall"}`,
            emoji: categoryEmoji(v.jenis_jualan ?? ""),
            wait: "~10 min",
            menu,
          };
        });

        setStalls(built);
      } catch (e) {
        console.error("Failed to load stalls:", e);
        setStalls([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStalls();

    // Re-fetch when a flash sale is launched from another tab/vendor
    const onFlash = () => fetchStalls();
    window.addEventListener("pasar-smart-flash-sale", onFlash);
    return () => window.removeEventListener("pasar-smart-flash-sale", onFlash);
  }, []);

  const filtered = stalls.filter((s) => {
    if (cat !== "All" && s.category !== cat) return false;
    if (openOnly && !s.open) return false;
    if (flashOnly && !s.flash) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openPicker(stallId: string) {
    if (activeStall === stallId) {
      setActiveStall(null);
      setPickerQty({});
      return;
    }
    setActiveStall(stallId);
    const existing = getCart();
    const pre: Record<string, number> = {};
    const stall = stalls.find((s) => s.id === stallId);
    stall?.menu.forEach((item) => {
      const found = existing.find((c) => c.id === item.id);
      if (found) pre[item.id] = found.qty;
    });
    setPickerQty(pre);
  }

  function changeQty(itemId: string, delta: number) {
    setPickerQty((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta) }));
  }

  function confirmAdd(stall: Stall) {
    let added = 0;
    for (const item of stall.menu) {
      const qty = pickerQty[item.id] ?? 0;
      const cartQty = getCart().find((c) => c.id === item.id)?.qty ?? 0;
      if (qty !== cartQty) {
        upsertItem(
          { id: item.id, name: item.name, price: item.price, emoji: item.emoji, vendor: stall.name, vendorId: stall.id, vendorEmoji: stall.emoji },
          qty - cartQty,
        );
        if (qty > 0) added += qty;
      }
    }
    const newCount = cartCount();
    setTotalInCart(newCount);
    setActiveStall(null);
    setPickerQty({});
    if (added > 0) {
      setToast(`✓ Added to cart from ${stall.name}`);
      setTimeout(() => setToast(null), 2500);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Breadcrumb + cart badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link href="/user" className="hover:text-[var(--text)]">Home</Link><span>/</span>
          <span className="text-[var(--text)]">Discover</span>
        </div>
        <Link href="/user/cart" className="relative flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--lifted)] px-3.5 py-1.5 text-sm font-semibold text-[var(--text)] hover:border-emerald-500/40 transition-all">
          🛒 Cart
          {totalInCart > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {totalInCart > 9 ? "9+" : totalInCart}
            </span>
          )}
        </Link>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-6 py-2.5 text-sm font-semibold text-emerald-300 shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      {/* Hero search */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-10 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#0f3d2e_0%,_transparent_60%)]" />
        <h1 className="text-2xl font-bold text-[var(--text)]">🔍 Discover Tonight&apos;s Market</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Trending stalls, flash deals, and AI-curated picks — updated in real-time</p>
        <div className="mx-auto mt-5 flex max-w-lg items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--abyss)] px-4 py-2.5">
          <span className="text-[var(--muted)]">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stalls, dishes, categories…"
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none"
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button onClick={() => setOpenOnly(!openOnly)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${openOnly ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-400" : "border-[var(--border)] text-[var(--muted)] hover:border-emerald-400/30"}`}>✓ Open Now</button>
          <button onClick={() => setFlashOnly(!flashOnly)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${flashOnly ? "border-amber-400/60 bg-amber-400/20 text-amber-400" : "border-[var(--border)] text-[var(--muted)] hover:border-amber-400/30"}`}>⚡ Flash Deals</button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${cat === c ? "bg-emerald-500 text-white" : "border border-[var(--border)] text-[var(--muted)] hover:border-emerald-400/40 hover:text-[var(--text)]"}`}>{c}</button>
        ))}
      </div>

      {/* Stalls grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-[var(--accent-strong)]">
            {cat === "All" ? "All Stalls" : cat}{" "}
            <span className="text-sm font-normal text-[var(--muted)]">
              {loading ? "loading…" : `(${filtered.length} found)`}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--lifted)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--lifted)] py-16 text-center text-sm text-[var(--muted)]">
            {stalls.length === 0 ? "No vendors have registered yet. Check back soon!" : "No stalls match your filters."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const isPickerOpen = activeStall === s.id;
              const menu = s.menu;
              const pickerTotal = menu.reduce((sum, item) => sum + (pickerQty[item.id] ?? 0), 0);
              return (
                <div key={s.id} className={`flex flex-col rounded-2xl border bg-[var(--lifted)] transition-all hover:shadow-lg ${s.flash ? "border-amber-500/40 bg-amber-500/5" : isPickerOpen ? "border-emerald-500/50" : "border-[var(--border)] hover:border-emerald-500/30"}`}>
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span className="text-3xl">{s.emoji}</span>
                      <div className="flex flex-wrap gap-1">
                        {s.tags.map((t) => (
                          <span key={t} className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${t.includes("Flash") ? "bg-amber-400/20 text-amber-400" : t.includes("Open") ? "bg-emerald-400/20 text-emerald-400" : "bg-[var(--raised)] text-[var(--muted)]"}`}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--text)]">{s.name}</span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${s.open ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-600/20 text-slate-300"}`}>
                        {s.open ? "OPEN NOW" : "CLOSED"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{s.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${CROWD_COLOR[s.crowd]}`}>{CROWD_LABEL[s.crowd]}</span>
                      <span className="text-[var(--muted)]">⏱ {s.wait}</span>
                      <span className="text-[var(--muted)]">💰 {s.price}</span>
                      {s.reviews > 0 && <span className="text-amber-400">⭐ {s.rating} ({s.reviews})</span>}
                    </div>
                    <button
                      onClick={() => openPicker(s.id)}
                      disabled={menu.length === 0}
                      className={`mt-4 w-full rounded-xl border py-2 text-center text-xs font-semibold transition-all ${menu.length === 0 ? "cursor-not-allowed border-[var(--border)] opacity-40 text-[var(--muted)]" : isPickerOpen ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400" : "border-[var(--border)] text-[var(--text)] hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"}`}
                    >
                      {menu.length === 0 ? "Menu not available yet" : isPickerOpen ? "▲ Close menu" : "+ Add to Cart"}
                    </button>
                  </div>

                  {/* Inline item picker */}
                  {isPickerOpen && menu.length > 0 && (
                    <div className="border-t border-emerald-500/20 bg-[var(--abyss)]/40 px-5 pb-5 pt-4 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Select items</p>
                      {menu.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <span className="text-lg">{item.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-medium text-[var(--text)]">{item.name}</p>
                            <p className="text-[11px] text-emerald-400 font-semibold">RM {item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => changeQty(item.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:border-red-400/40 hover:text-red-400">−</button>
                            <span className="w-5 text-center text-xs font-bold text-[var(--text)]">{pickerQty[item.id] ?? 0}</span>
                            <button onClick={() => changeQty(item.id, +1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:border-emerald-400/40 hover:text-emerald-400">+</button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => confirmAdd(s)}
                        disabled={pickerTotal === 0}
                        className="mt-1 w-full rounded-xl bg-emerald-500 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {pickerTotal > 0 ? `✓ Add ${pickerTotal} item${pickerTotal > 1 ? "s" : ""} to Cart` : "Select at least 1 item"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* AI Food Trails */}
      <section>
        <h2 className="mb-1 font-semibold text-[var(--accent-strong)]">✨ AI Food Trails</h2>
        <p className="mb-4 text-xs text-[var(--muted)]">Curated routes generated from your preferences and tonight&apos;s live stall data</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {FOOD_TRAILS.map((t) => (
            <div key={t.title} className={`rounded-2xl border bg-gradient-to-br ${t.color} ${t.border} p-5 transition-all hover:shadow-lg`}>
              <span className="text-3xl">{t.icon}</span>
              <h3 className="mt-3 font-bold text-[var(--text)]">{t.title}</h3>
              <p className="text-xs text-[var(--muted)]">Budget: {t.budget} · {t.stops} stops</p>
              <p className="mt-2 text-xs text-[var(--secondary)]">{t.desc}</p>
              <Link href="/user/map" className="mt-4 inline-block rounded-lg bg-[var(--abyss)]/60 px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--raised)]">
                Navigate This Trail →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
