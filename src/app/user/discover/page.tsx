"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { upsertItem, cartCount, getCart } from "@/lib/cartStore";

const CATEGORIES = ["All", "Noodles", "Rice", "Grilled", "Drinks", "Kuih", "Fruits", "Seafood", "Snacks"];

const STALLS = [
  { id: 1, name: "Mee Goreng Haji Ali",  category: "Noodles",  rating: 4.8, reviews: 312, crowd: "high",   price: "RM 6–8",   tags: ["Trending 🔥", "Bestseller"], open: true, flash: false, desc: "Legendary mamak-style fried noodles with the original secret sauce.", emoji: "🍜", wait: "20 min" },
  { id: 2, name: "Ayam Percik Siti",     category: "Grilled",  rating: 4.7, reviews: 198, crowd: "medium", price: "RM 10–15", tags: ["Flash ⚡ 20% off"],           open: true, flash: true,  desc: "Charcoal-grilled chicken marinated overnight in coconut spices.",  emoji: "🍗", wait: "10 min" },
  { id: 3, name: "Cendol Pak Din",       category: "Drinks",   rating: 4.9, reviews: 445, crowd: "high",   price: "RM 3–5",   tags: ["Top Rated ⭐", "Trending 🔥"],  open: true, flash: false, desc: "Iconic Melaka cendol with freshly pressed coconut milk and gula melaka.", emoji: "🧊", wait: "5 min" },
  { id: 4, name: "Nasi Lemak Wangi",     category: "Rice",     rating: 4.6, reviews: 267, crowd: "low",    price: "RM 5–12",  tags: ["Open Now ✓"],               open: true, flash: false, desc: "Fragrant coconut rice with crispy ikan bilis, egg, and sambal.",   emoji: "🍚", wait: "3 min" },
  { id: 5, name: "Kuih Muih Puan Ros",   category: "Kuih",     rating: 4.5, reviews: 134, crowd: "low",    price: "RM 1–3",   tags: ["Traditional"],              open: true, flash: false, desc: "Handmade traditional Malay kuih — over 15 varieties every night.", emoji: "🧁", wait: "2 min" },
  { id: 6, name: "Rojak Buah Pak Zaini", category: "Fruits",   rating: 4.7, reviews: 221, crowd: "medium", price: "RM 5–8",   tags: ["Flash ⚡ 15% off"],          open: true, flash: true,  desc: "Fresh tropical fruits tossed in prawn paste sauce with peanuts.",  emoji: "🥭", wait: "8 min" },
  { id: 7, name: "Satay Jamilah",        category: "Grilled",  rating: 4.8, reviews: 389, crowd: "high",   price: "RM 8–20",  tags: ["Trending 🔥", "Bestseller"], open: true, flash: false, desc: "Marinated beef and chicken skewers grilled over charcoal. Min 10 sticks.", emoji: "🍢", wait: "15 min" },
  { id: 8, name: "Keropok Lekor Azri",   category: "Snacks",   rating: 4.4, reviews: 88,  crowd: "low",    price: "RM 3–6",   tags: ["Closing soon ⚠️"],          open: true, flash: false, desc: "Terengganu-style fish sausage — deep fried or grilled to order.",  emoji: "🐟", wait: "5 min" },
  { id: 9, name: "Ikan Bakar Hamidah",   category: "Seafood",  rating: 4.9, reviews: 501, crowd: "high",   price: "RM 15–35", tags: ["Top Rated ⭐", "Must Try"],   open: true, flash: false, desc: "Whole fish grilled on banana leaf with 6 sambal variants. Order early!", emoji: "🐠", wait: "25 min" },
];

const STALL_MENUS: Record<number, { id: string; name: string; price: number; emoji: string }[]> = {
  1: [{ id: "1-1", name: "Mee Goreng Special", price: 7.00, emoji: "🍜" }, { id: "1-2", name: "Teh Tarik", price: 2.50, emoji: "🧉" }],
  2: [{ id: "2-1", name: "Ayam Percik (1/2)", price: 12.00, emoji: "🍗" }, { id: "2-2", name: "Nasi Putih", price: 1.50, emoji: "🍚" }],
  3: [{ id: "3-1", name: "Cendol Besar", price: 4.50, emoji: "🧊" }, { id: "3-2", name: "Cendol Kecil", price: 3.00, emoji: "🧊" }],
  4: [{ id: "4-1", name: "Nasi Lemak Ayam", price: 10.00, emoji: "🍚" }, { id: "4-2", name: "Nasi Lemak Basic", price: 5.00, emoji: "🍚" }],
  5: [{ id: "5-1", name: "Mixed Kuih (5 pcs)", price: 5.00, emoji: "🧁" }, { id: "5-2", name: "Kuih à la carte", price: 1.00, emoji: "🧁" }],
  6: [{ id: "6-1", name: "Rojak Besar", price: 7.00, emoji: "🥭" }, { id: "6-2", name: "Rojak Kecil", price: 5.00, emoji: "🥭" }],
  7: [{ id: "7-1", name: "Satay 10 pcs Mixed", price: 13.00, emoji: "🍢" }, { id: "7-2", name: "Satay 20 pcs", price: 25.00, emoji: "🍢" }],
  8: [{ id: "8-1", name: "Keropok Lekor", price: 5.00, emoji: "🐟" }, { id: "8-2", name: "Keropok Goreng", price: 4.00, emoji: "🐟" }],
  9: [{ id: "9-1", name: "Ikan Bakar Siakap", price: 30.00, emoji: "🐠" }, { id: "9-2", name: "Sambal Extra", price: 3.00, emoji: "🌶️" }],
};

const FOOD_TRAILS = [
  { title: "Budget Bites Trail", budget: "Under RM 20", stops: 4, desc: "Cendol → Kuih Muih → Keropok Lekor → Nasi Lemak", icon: "💚", color: "from-emerald-500/15 to-teal-500/15", border: "border-emerald-500/30" },
  { title: "Seafood Lover's Route", budget: "RM 40–60", stops: 3, desc: "Ikan Bakar → Keropok Lekor → Rojak Buah (dessert)", icon: "🐠", color: "from-blue-500/15 to-cyan-500/15", border: "border-blue-500/30" },
  { title: "Street Food Classic", budget: "RM 25–35", stops: 5, desc: "Mee Goreng → Ayam Percik → Satay → Cendol → Kuih", icon: "🔥", color: "from-amber-500/15 to-orange-500/15", border: "border-amber-500/30" },
];

const CROWD_COLOR: Record<string, string> = { high: "text-red-400 bg-red-400/10", medium: "text-amber-400 bg-amber-400/10", low: "text-emerald-400 bg-emerald-400/10" };
const CROWD_LABEL: Record<string, string> = { high: "Busy", medium: "Moderate", low: "Quiet" };

export default function DiscoverPage() {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [flashOnly, setFlashOnly] = useState(false);

  // which stall's menu is open
  const [activeStall, setActiveStall] = useState<number | null>(null);
  // local qty selection inside the picker (keyed by item id)
  const [pickerQty, setPickerQty] = useState<Record<string, number>>({});
  // cart item count for the badge
  const [totalInCart, setTotalInCart] = useState(0);
  // toast message
  const [toast, setToast] = useState<string | null>(null);

  // Read initial cart count from localStorage on mount
  useEffect(() => {
    setTotalInCart(cartCount());
  }, []);

  const filtered = STALLS.filter((s) => {
    if (cat !== "All" && s.category !== cat) return false;
    if (openOnly && !s.open) return false;
    if (flashOnly && !s.flash) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openPicker(stallId: number) {
    if (activeStall === stallId) {
      setActiveStall(null);
      setPickerQty({});
      return;
    }
    setActiveStall(stallId);
    // Pre-fill with existing cart quantities for this stall
    const existing = getCart();
    const pre: Record<string, number> = {};
    STALL_MENUS[stallId]?.forEach((item) => {
      const found = existing.find((c) => c.id === item.id);
      if (found) pre[item.id] = found.qty;
    });
    setPickerQty(pre);
  }

  function changeQty(itemId: string, delta: number) {
    setPickerQty((prev) => {
      const next = Math.max(0, (prev[itemId] ?? 0) + delta);
      return { ...prev, [itemId]: next };
    });
  }

  function confirmAdd(stall: typeof STALLS[0]) {
    const menu = STALL_MENUS[stall.id] ?? [];
    let added = 0;
    for (const item of menu) {
      const qty = pickerQty[item.id] ?? 0;
      if (qty > 0) {
        upsertItem(
          { id: item.id, name: item.name, price: item.price, emoji: item.emoji, vendor: stall.name, vendorEmoji: stall.emoji },
          qty - (getCart().find((c) => c.id === item.id)?.qty ?? 0),
        );
        added += qty;
      }
    }
    // also remove items set to 0
    for (const item of menu) {
      if ((pickerQty[item.id] ?? 0) === 0) {
        upsertItem(
          { id: item.id, name: item.name, price: item.price, emoji: item.emoji, vendor: stall.name, vendorEmoji: stall.emoji },
          -(getCart().find((c) => c.id === item.id)?.qty ?? 0),
        );
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
      {/* Breadcrumb + cart badge row */}
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stalls, dishes, categories…" className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none" />
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
            {cat === "All" ? "All Stalls" : cat} <span className="text-sm font-normal text-[var(--muted)]">({filtered.length} found)</span>
          </h2>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--lifted)] py-16 text-center text-sm text-[var(--muted)]">No stalls match your filters.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const isOpen = activeStall === s.id;
              const menu = STALL_MENUS[s.id] ?? [];
              const pickerTotal = menu.reduce((sum, item) => sum + (pickerQty[item.id] ?? 0), 0);
              return (
                <div key={s.id} className={`flex flex-col rounded-2xl border bg-[var(--lifted)] transition-all hover:shadow-lg ${s.flash ? "border-amber-500/40 bg-amber-500/5" : isOpen ? "border-emerald-500/50" : "border-[var(--border)] hover:border-emerald-500/30"}`}>
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span className="text-3xl">{s.emoji}</span>
                      <div className="flex flex-wrap gap-1">
                        {s.tags.map((t) => (
                          <span key={t} className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${t.includes("Flash") ? "bg-amber-400/20 text-amber-400" : t.includes("Trending") ? "bg-red-400/20 text-red-400" : t.includes("Top") ? "bg-yellow-400/20 text-yellow-400" : "bg-[var(--raised)] text-[var(--muted)]"}`}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <h3 className="font-semibold text-[var(--text)]">{s.name}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">{s.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${CROWD_COLOR[s.crowd]}`}>{CROWD_LABEL[s.crowd]}</span>
                      <span className="text-[var(--muted)]">⏱ {s.wait}</span>
                      <span className="text-[var(--muted)]">💰 {s.price}</span>
                      <span className="text-amber-400">⭐ {s.rating} ({s.reviews})</span>
                    </div>
                    <button
                      onClick={() => openPicker(s.id)}
                      className={`mt-4 w-full rounded-xl border py-2 text-center text-xs font-semibold transition-all ${isOpen ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400" : "border-[var(--border)] text-[var(--text)] hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"}`}
                    >
                      {isOpen ? "▲ Close menu" : "+ Add to Cart"}
                    </button>
                  </div>

                  {/* Inline item picker */}
                  {isOpen && (
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
