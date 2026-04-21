"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { addItems } from "@/lib/cartStore";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";

const TABS = ["Overview", "History", "AI Trails"];

const ORDER_HISTORY = [
  { stallId: "s1", stallName: "Mee Goreng Haji Ali" },
  { stallId: "s2", stallName: "Cendol Pak Din" },
  { stallId: "s3", stallName: "Ayam Percik Siti" },
  { stallId: "s4", stallName: "Nasi Lemak Wangi" },
  { stallId: "s5", stallName: "Satay Jamilah" },
  { stallId: "s1", stallName: "Mee Goreng Haji Ali" },
  { stallId: "s6", stallName: "Ikan Bakar Hamidah" },
  { stallId: "s2", stallName: "Cendol Pak Din" },
  { stallId: "s7", stallName: "Kuih Muih Puan Ros" },
];

const USER_REVIEWS = [
  { stallId: "s1", rating: 4, comment: "Really good mee goreng!" },
  { stallId: "s2", rating: 5, comment: "Best cendol in town." },
];

const HISTORY = [
  { id: "ORD-001", date: "20 Apr 2026", vendors: ["Mee Goreng Haji Ali", "Cendol Pak Din"], total: 21.5, items: 4, status: "Completed", drive: false },
  { id: "ORD-002", date: "18 Apr 2026", vendors: ["Ayam Percik Siti", "Nasi Lemak Wangi"], total: 35.0, items: 3, status: "Completed", drive: true },
  { id: "ORD-003", date: "15 Apr 2026", vendors: ["Satay Jamilah"], total: 24.0, items: 1, status: "Completed", drive: false },
  { id: "ORD-004", date: "13 Apr 2026", vendors: ["Ikan Bakar Hamidah", "Cendol Pak Din", "Kuih Muih Puan Ros"], total: 52.0, items: 6, status: "Completed", drive: true },
];


const TRAILS = [
  {
    title: "Budget Foodie Trail",
    desc: "Your go-to combo under RM 20",
    budget: "RM 18",
    stops: ["Cendol Pak Din → Kuih Muih → Nasi Lemak Wangi → Keropok Lekor"],
    icon: "💚",
    color: "from-emerald-500/15 to-teal-500/15",
    border: "border-emerald-500/30",
    based: "Based on 12 orders",
  },
  {
    title: "Saturday Night Special",
    desc: "Best for weekends - all your top stalls",
    budget: "RM 45",
    stops: ["Mee Goreng → Satay Jamilah → Ikan Bakar → Cendol"],
    icon: "🌙",
    color: "from-violet-500/15 to-purple-500/15",
    border: "border-violet-500/30",
    based: "Based on weekend patterns",
  },
  {
    title: "Seafood Lover's Pick",
    desc: "AI sees you love seafood",
    budget: "RM 55",
    stops: ["Ikan Bakar Hamidah → Keropok Lekor → Rojak Buah (dessert)"],
    icon: "🐠",
    color: "from-blue-500/15 to-cyan-500/15",
    border: "border-blue-500/30",
    based: "Based on order history",
  },
];

const TRAIL_CART_ITEMS = {
  "Budget Foodie Trail": {
    stallNames: ["Cendol Pak Din", "Kuih Muih Puan Ros", "Nasi Lemak Wangi", "Keropok Lekor Azri"],
    items: [
      { id: "3-2", name: "Cendol Kecil", price: 3.0, emoji: "🥤", vendor: "Cendol Pak Din", vendorEmoji: "🥤" },
      { id: "5-1", name: "Mixed Kuih (5 pcs)", price: 5.0, emoji: "🧁", vendor: "Kuih Muih Puan Ros", vendorEmoji: "🧁" },
      { id: "4-2", name: "Nasi Lemak Basic", price: 5.0, emoji: "🍚", vendor: "Nasi Lemak Wangi", vendorEmoji: "🍚" },
      { id: "8-2", name: "Keropok Goreng", price: 4.0, emoji: "🐟", vendor: "Keropok Lekor Azri", vendorEmoji: "🐟" },
    ],
  },
  "Saturday Night Special": {
    stallNames: ["Mee Goreng Haji Ali", "Satay Jamilah", "Ikan Bakar Hamidah", "Cendol Pak Din"],
    items: [
      { id: "1-1", name: "Mee Goreng Special", price: 7.0, emoji: "🍜", vendor: "Mee Goreng Haji Ali", vendorEmoji: "🍜" },
      { id: "7-1", name: "Satay 10 pcs Mixed", price: 13.0, emoji: "🍢", vendor: "Satay Jamilah", vendorEmoji: "🍢" },
      { id: "9-1", name: "Ikan Bakar Siakap", price: 30.0, emoji: "🐠", vendor: "Ikan Bakar Hamidah", vendorEmoji: "🐠" },
      { id: "3-1", name: "Cendol Besar", price: 4.5, emoji: "🥤", vendor: "Cendol Pak Din", vendorEmoji: "🥤" },
    ],
  },
  "Seafood Lover's Pick": {
    stallNames: ["Ikan Bakar Hamidah", "Keropok Lekor Azri", "Rojak Buah Pak Zaini"],
    items: [
      { id: "9-1", name: "Ikan Bakar Siakap", price: 30.0, emoji: "🐠", vendor: "Ikan Bakar Hamidah", vendorEmoji: "🐠" },
      { id: "8-1", name: "Keropok Lekor", price: 5.0, emoji: "🐟", vendor: "Keropok Lekor Azri", vendorEmoji: "🐟" },
      { id: "6-1", name: "Rojak Besar", price: 7.0, emoji: "🥭", vendor: "Rojak Buah Pak Zaini", vendorEmoji: "🥭" },
    ],
  },
} as const;

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState("Overview");

  // Logged-in user info
  const [userName, setUserName]   = useState("Loading…");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      // Demo mode — use the mock account values
      setUserName("Razif Pelanggan");
      setUserEmail("user@pasar.smart");
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (!user) return;
      // Prefer profile row, fall back to metadata / email
      supabase
        .from("profiles")
        .select("name, email, full_name")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }) => {
          setUserName(
            profile?.full_name || profile?.name ||
            user.user_metadata?.name || user.email?.split("@")[0] || "User"
          );
          setUserEmail(profile?.email || user.email || "");
        });
    });
  }, []);

  // New review states
  const [selectedStallId, setSelectedStallId] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [starRating, setStarRating] = useState(5);
  const [isEditing, setIsEditing] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  // Extract unique stalls purchased from
  const purchasedStalls = useMemo(() => {
    const unique = new Map();
    ORDER_HISTORY.forEach((order) => {
      if (!unique.has(order.stallId)) {
        unique.set(order.stallId, order.stallName);
      }
    });
    return Array.from(unique.entries()).map(([stallId, stallName]) => ({ stallId, stallName }));
  }, []);

  // Handle Edit Mode Logic
  useEffect(() => {
    if (!selectedStallId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEditing(false);
      setStarRating(5);
      setReviewText("");
      return;
    }

    const existingReview = USER_REVIEWS.find((r) => r.stallId === selectedStallId);
    if (existingReview) {
      setIsEditing(true);
      setStarRating(existingReview.rating);
      setReviewText(existingReview.comment);
    } else {
      setIsEditing(false);
      setStarRating(5);
      setReviewText("");
    }
  }, [selectedStallId]);

  const totalSpent = HISTORY.reduce((sum, order) => sum + order.total, 0);

  function startTrail(title: keyof typeof TRAIL_CART_ITEMS) {
    addItems(TRAIL_CART_ITEMS[title].items.map((item) => ({ ...item })), 1);
    router.push("/user/cart");
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/user" className="hover:text-[var(--text)]">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text)]">Profile</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#0f3d2e_0%,_transparent_60%)]" />
        <Link
          href="/profile/edit"
          className="flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors p-2 -m-2 rounded-lg"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-3xl">
            👤
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">{userName}</h1>
            <p className="text-sm text-[var(--muted)]">{userEmail}</p>
          </div>
        </Link>
      </div>

      <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--abyss)] p-1">
        {TABS.map((tabName) => (
          <button
            key={tabName}
            type="button"
            onClick={() => setTab(tabName)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
              tab === tabName ? "bg-[var(--raised)] text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {tabName}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Orders", value: HISTORY.length, icon: "🛍️", accent: "text-emerald-400" },
              { label: "Total Spent", value: `RM ${totalSpent.toFixed(0)}`, icon: "💰", accent: "text-amber-400" },

              { label: "Reviews Given", value: "7", icon: "⭐", accent: "text-yellow-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4 text-center">
                <span className="text-2xl">{stat.icon}</span>
                <p className={`mt-1 text-xl font-bold ${stat.accent}`}>{stat.value}</p>
                <p className="text-xs text-[var(--muted)]">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5">
            <h3 className="mb-3 font-semibold text-[var(--accent-strong)]">🤖 Your Taste Profile</h3>
            <div className="space-y-2.5">
              {[
                { cat: "Drinks", pct: 85 },
                { cat: "Noodles", pct: 72 },
                { cat: "Grilled", pct: 60 },
                { cat: "Seafood", pct: 48 },
                { cat: "Kuih", pct: 30 },
              ].map((category) => (
                <div key={category.cat} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-[var(--muted)]">{category.cat}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--raised)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${category.pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-[var(--muted)]">{category.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5">
            <h3 className="mb-3 font-semibold text-[var(--accent-strong)]">
              {isEditing ? "⭐ Edit Your Review" : "⭐ Leave a Review"}
            </h3>
            {reviewDone ? (
              <p className="text-sm text-emerald-400">✓ Thank you! Your review helps other buyers.</p>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedStallId}
                  onChange={(event) => setSelectedStallId(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--abyss)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="">Select a stall you&apos;ve purchased from...</option>
                  {purchasedStalls.map((stall) => (
                    <option key={stall.stallId} value={stall.stallId}>
                      {stall.stallName}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setStarRating(stars)}
                      className={`text-2xl transition-all ${stars <= starRating ? "text-amber-400" : "text-[var(--raised)]"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="Share your experience..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--abyss)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setReviewDone(true)}
                  disabled={!selectedStallId}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--abyss)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? "Update Review" : "Submit Review"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "History" && (
        <div className="space-y-3">
          {HISTORY.map((order) => (
            <div key={order.id} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--text)]">{order.id}</p>
                    {order.drive && (
                      <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                        🚗 Pasar-Drive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {order.date} · {order.items} items
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{order.vendors.join(", ")}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-[var(--accent)]">RM {order.total.toFixed(2)}</p>
                  <span className="text-xs text-emerald-400">{order.status}</span>
                </div>
              </div>
              <Link
                href={`/user/discover?stalls=${encodeURIComponent(order.vendors.join(","))}`}
                className="mt-3 inline-block rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-all hover:bg-[var(--raised)] hover:text-[var(--text)]"
              >
                Reorder →
              </Link>
            </div>
          ))}
        </div>
      )}


      {tab === "AI Trails" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">✨ AI-generated food trails based on your order history and taste profile</p>
          {TRAILS.map((trail) => (
            <div key={trail.title} className={`rounded-2xl border bg-gradient-to-br ${trail.color} ${trail.border} p-6`}>
              <div className="flex items-start gap-4">
                <span className="text-4xl">{trail.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-[var(--text)]">{trail.title}</h3>
                  <p className="text-xs text-[var(--muted)]">
                    {trail.desc} · Budget: {trail.budget}
                  </p>
                  <p className="mt-2 text-sm text-[var(--secondary)]">{trail.stops[0]}</p>
                  <p className="mt-2 text-[11px] text-[var(--muted)]">
                    Stalls: {TRAIL_CART_ITEMS[trail.title as keyof typeof TRAIL_CART_ITEMS].stallNames.join(", ")}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">{trail.based}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => startTrail(trail.title as keyof typeof TRAIL_CART_ITEMS)}
                className="mt-4 inline-block rounded-lg bg-[var(--abyss)]/60 px-4 py-2 text-xs font-bold text-[var(--text)] transition-all hover:bg-[var(--raised)]"
              >
                🗺️ Start This Trail →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
