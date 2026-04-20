"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCart, saveCart, clearCart, CartItem } from "@/lib/cartStore";

const PICKUP_POINTS = [
  { id: "P1", label: "Gate A — Entrance",  desc: "Near main road, best for Grab/car", icon: "🚗" },
  { id: "P2", label: "Gate B — Side Lane", desc: "Motorcycle & bicycle friendly",     icon: "🏍️" },
  { id: "P3", label: "Gate C — Car Park",  desc: "Closest to parking bay 12-30",      icon: "🅿️" },
];

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [useDrive, setUseDrive] = useState(true);   // default ON — mandatory for online orders
  const [pickup, setPickup] = useState("P1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cart from localStorage once mounted
  useEffect(() => {
    setCart(getCart());
    setHydrated(true);
  }, []);

  // Sync cart changes back to localStorage
  useEffect(() => {
    if (hydrated) saveCart(cart);
  }, [cart, hydrated]);

  // Reset loading state if browser restores page from bfcache (Back from Stripe)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  function update(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0),
    );
  }

  const vendors = [...new Set(cart.map((i) => i.vendor))];
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const driveCharge = useDrive ? 1.50 : 0;
  const total = subtotal + driveCharge;
  const pickupLabel = PICKUP_POINTS.find((p) => p.id === pickup)?.label ?? "";

  async function handleCheckout() {
    // Pickup is mandatory when Pasar-Drive is on
    if (useDrive && !pickup) {
      setError("Please select a pickup point before proceeding.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, useDrive, pickupLabel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session");
      // Clear cart before redirect — payment is confirmed on the success page
      clearCart();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // Show skeleton while waiting for localStorage hydration
  if (!hydrated) {
    return (
      <div className="space-y-4 pb-10">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[var(--raised)]" />
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--raised)]" />
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--raised)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/user" className="hover:text-[var(--text)]">Home</Link><span>/</span>
        <Link href="/user/discover" className="hover:text-[var(--text)]">Discover</Link><span>/</span>
        <span className="text-[var(--text)]">Cart</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">🛒 My Cart</h1>
          <p className="text-sm text-[var(--muted)]">
            {cart.length > 0 ? `${cart.reduce((s, i) => s + i.qty, 0)} items from ${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}` : "Your cart is empty"}
          </p>
        </div>
        <Link href="/user/discover" className="text-sm text-[var(--accent)] hover:underline">+ Add more</Link>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-24 text-center">
          <p className="text-5xl">🛒</p>
          <p className="mt-4 text-lg font-semibold text-[var(--text)]">Your cart is empty</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Head to Discover, pick items from stalls, and they&apos;ll appear here.</p>
          <Link href="/user/discover" className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-400">
            Browse Stalls
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {/* Items grouped by vendor */}
            {vendors.map((vendor) => {
              const items = cart.filter((i) => i.vendor === vendor);
              const ve = items[0].vendorEmoji;
              return (
                <div key={vendor} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--lifted)]">
                  <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--abyss)]/50 px-5 py-3">
                    <span className="text-xl">{ve}</span>
                    <p className="font-semibold text-[var(--text)]">{vendor}</p>
                  </div>
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="text-xl">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text)]">{item.name}</p>
                          <p className="text-xs text-[var(--muted)]">RM {item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => update(item.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-sm font-bold text-[var(--text)] hover:border-red-400/40 hover:bg-[var(--raised)] hover:text-red-400">
                            {item.qty === 1 ? "🗑" : "−"}
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-[var(--text)]">{item.qty}</span>
                          <button onClick={() => update(item.id, +1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-sm font-bold text-[var(--text)] hover:border-emerald-400/40 hover:bg-[var(--raised)] hover:text-emerald-400">+</button>
                        </div>
                        <p className="w-20 text-right text-sm font-bold text-[var(--accent)]">RM {(item.price * item.qty).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Pasar-Drive — mandatory for online orders */}
            <div className={`rounded-2xl border p-5 transition-all ${useDrive ? "border-cyan-500/40 bg-cyan-500/5" : "border-[var(--border)] bg-[var(--lifted)]"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚗</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[var(--text)]">Pasar-Drive Pickup</p>
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-400">Recommended</span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">Collect your order at the market edge — no queuing (+ RM 1.50)</p>
                  </div>
                </div>
                <button
                  onClick={() => setUseDrive(!useDrive)}
                  className={`relative h-6 w-11 rounded-full transition-all ${useDrive ? "bg-cyan-500" : "bg-[var(--raised)]"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${useDrive ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              {/* Pickup point — required when Drive is on */}
              {useDrive && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Select Pickup Point <span className="text-red-400">*</span>
                  </p>
                  {PICKUP_POINTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPickup(p.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${pickup === p.id ? "border-cyan-500/50 bg-cyan-500/10" : "border-[var(--border)] hover:border-cyan-500/30"}`}
                    >
                      <span className="text-xl">{p.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">{p.label}</p>
                        <p className="text-xs text-[var(--muted)]">{p.desc}</p>
                      </div>
                      {pickup === p.id && <span className="ml-auto text-cyan-400 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}

              {!useDrive && (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  ℹ️ You&apos;ll collect directly from each stall. Enable Pasar-Drive to get everything at one pickup point.
                </p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="sticky top-24 self-start space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5 space-y-3">
              <h3 className="font-bold text-[var(--accent-strong)]">Order Summary</h3>
              <div className="space-y-1.5 text-sm">
                {vendors.map((v) => {
                  const items = cart.filter((i) => i.vendor === v);
                  const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
                  return (
                    <div key={v} className="flex justify-between text-[var(--muted)]">
                      <span className="truncate pr-2">{v}</span><span>RM {sub.toFixed(2)}</span>
                    </div>
                  );
                })}
                {useDrive && (
                  <div className="flex justify-between text-cyan-400">
                    <span>🚗 Pasar-Drive</span><span>RM 1.50</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[var(--border)] pt-2 font-bold text-[var(--text)]">
                  <span>Total</span>
                  <span className="text-[var(--accent)]">RM {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Pickup reminder when Drive is on */}
              {useDrive && (
                <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/8 px-3 py-2 text-xs text-cyan-300">
                  📍 Pickup at: <span className="font-semibold">{pickupLabel}</span>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:scale-100"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Redirecting to payment…
                  </>
                ) : (
                  "💳 Pay with Card"
                )}
              </button>

              {/* Stripe trust badge */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted)]">
                <svg viewBox="0 0 60 25" className="h-4 fill-current opacity-60" aria-label="Stripe">
                  <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.23c0-1.85-1.07-2.58-2.06-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V6.27h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.9-5.65 7.9zm-.97-11.45c-.83 0-1.34.31-1.9.8l.01 6.04c.52.44 1.05.7 1.9.7 1.81 0 2.74-2.01 2.74-3.78 0-1.92-.93-3.76-2.75-3.76zM28.24 5.07c1.3 0 2.1-1.01 2.1-2.25C30.34.82 29.57 0 28.27 0c-1.31 0-2.1 1.01-2.1 2.25 0 1.24.79 2.07 2.07 2.07v-.25zM26.17 20V6.27h4.1V20h-4.1zm-2.6 0H19.7l-.09-1.07c-.76.73-1.93 1.3-3.3 1.3-2.51 0-3.61-1.8-3.61-3.94V6.27h4.1v9.67c0 1.16.45 1.68 1.39 1.68.79 0 1.35-.39 1.73-.79V6.27h4.1V20h-.85zm-14.5 0H5.03V0l4.04-.87V20zM4.43 10.52a3.8 3.8 0 0 0-2.7-1.14C.72 9.38 0 10.14 0 11.05c0 .91.68 1.47 2.12 2.02 2.04.77 3.47 1.77 3.47 3.84 0 2.41-1.87 3.4-4.18 3.4A7.41 7.41 0 0 1 0 20V16.7c.68.43 1.73.88 2.63.88.87 0 1.44-.4 1.44-1.16 0-.73-.61-1.13-2.02-1.72C.62 14.03 0 13.01 0 11.5 0 9.32 1.78 8 3.9 8c1.2 0 2.3.4 3.07 1.03l-.54 1.49z" />
                </svg>
                <span>Secure payment by Stripe</span>
              </div>

              <Link href="/user/discover" className="block text-center text-xs text-[var(--muted)] hover:text-[var(--text)]">
                Continue browsing
              </Link>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--lifted)] px-4 py-3 text-xs text-[var(--muted)]">
              <p className="mb-1 font-semibold text-[var(--text)]">💡 Tip</p>
              <p>Items from {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} in one checkout — no need to pay separately!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
