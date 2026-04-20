"use client";
import Link from "next/link";
import { useState } from "react";

const TABS = ["Overview", "History", "Favorites", "AI Trails"];

const HISTORY = [
  { id: "ORD-001", date: "20 Apr 2026", vendors: ["Mee Goreng Haji Ali", "Cendol Pak Din"], total: 21.50, items: 4, status: "Completed", drive: false },
  { id: "ORD-002", date: "18 Apr 2026", vendors: ["Ayam Percik Siti", "Nasi Lemak Wangi"], total: 35.00, items: 3, status: "Completed", drive: true },
  { id: "ORD-003", date: "15 Apr 2026", vendors: ["Satay Jamilah"], total: 24.00, items: 1, status: "Completed", drive: false },
  { id: "ORD-004", date: "13 Apr 2026", vendors: ["Ikan Bakar Hamidah", "Cendol Pak Din", "Kuih Muih Puan Ros"], total: 52.00, items: 6, status: "Completed", drive: true },
];

const FAVORITES = [
  { name: "Cendol Pak Din", cat: "Drinks", rating: 4.9, visits: 8, emoji: "🧊" },
  { name: "Mee Goreng Haji Ali", cat: "Noodles", rating: 4.8, visits: 6, emoji: "🍜" },
  { name: "Ikan Bakar Hamidah", cat: "Seafood", rating: 4.9, visits: 4, emoji: "🐠" },
  { name: "Satay Jamilah", cat: "Grilled", rating: 4.8, visits: 3, emoji: "🍢" },
];

const TRAILS = [
  { title: "Budget Foodie Trail", desc: "Your go-to combo under RM 20", budget: "RM 18", stops: ["Cendol Pak Din → Kuih Muih → Nasi Lemak Wangi → Keropok Lekor"], icon: "💚", color: "from-emerald-500/15 to-teal-500/15", border: "border-emerald-500/30", based: "Based on 12 orders" },
  { title: "Saturday Night Special", desc: "Best for weekends — all your top stalls", budget: "RM 45", stops: ["Mee Goreng → Satay Jamilah → Ikan Bakar → Cendol"], icon: "🌙", color: "from-violet-500/15 to-purple-500/15", border: "border-violet-500/30", based: "Based on weekend patterns" },
  { title: "Seafood Lover's Pick", desc: "AI sees you love seafood 🐠", budget: "RM 55", stops: ["Ikan Bakar Hamidah → Keropok Lekor → Rojak Buah (dessert)"], icon: "🐠", color: "from-blue-500/15 to-cyan-500/15", border: "border-blue-500/30", based: "Based on order history" },
];

export default function ProfilePage() {
  const [tab, setTab] = useState("Overview");
  const [review, setReview] = useState({ stall: "", text: "", stars: 5 });
  const [reviewDone, setReviewDone] = useState(false);

  const totalSpent = HISTORY.reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/user" className="hover:text-[var(--text)]">Home</Link><span>/</span>
        <span className="text-[var(--text)]">Profile</span>
      </div>

      {/* Profile header */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#0f3d2e_0%,_transparent_60%)]" />
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-3xl">👤</div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Razif Pelanggan</h1>
            <p className="text-sm text-[var(--muted)]">user@pasar.smart · Member since Apr 2026</p>
            <div className="mt-2 flex gap-2">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">Frequent Buyer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--abyss)] p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${tab === t ? "bg-[var(--raised)] text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Orders", value: HISTORY.length, icon: "🛍️", accent: "text-emerald-400" },
              { label: "Total Spent", value: `RM ${totalSpent.toFixed(0)}`, icon: "💰", accent: "text-amber-400" },
              { label: "Saved Stalls", value: FAVORITES.length, icon: "❤️", accent: "text-pink-400" },
              { label: "Reviews Given", value: "7", icon: "⭐", accent: "text-yellow-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4 text-center">
                <span className="text-2xl">{s.icon}</span>
                <p className={`mt-1 text-xl font-bold ${s.accent}`}>{s.value}</p>
                <p className="text-xs text-[var(--muted)]">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5">
            <h3 className="mb-3 font-semibold text-[var(--accent-strong)]">🤖 Your Taste Profile</h3>
            <div className="space-y-2.5">
              {[{ cat: "Drinks", pct: 85 }, { cat: "Noodles", pct: 72 }, { cat: "Grilled", pct: 60 }, { cat: "Seafood", pct: 48 }, { cat: "Kuih", pct: 30 }].map((c) => (
                <div key={c.cat} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-[var(--muted)]">{c.cat}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--raised)] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs text-[var(--muted)]">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leave a review */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5">
            <h3 className="mb-3 font-semibold text-[var(--accent-strong)]">⭐ Leave a Review</h3>
            {reviewDone ? (
              <p className="text-sm text-emerald-400">✓ Thank you! Your review helps other buyers.</p>
            ) : (
              <div className="space-y-3">
                <input value={review.stall} onChange={(e) => setReview({ ...review, stall: e.target.value })} placeholder="Stall name…" className="w-full rounded-xl border border-[var(--border)] bg-[var(--abyss)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none" />
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} onClick={() => setReview({ ...review, stars: n })} className={`text-2xl transition-all ${n <= review.stars ? "text-amber-400" : "text-[var(--raised)]"}`}>★</button>
                  ))}
                </div>
                <textarea value={review.text} onChange={(e) => setReview({ ...review, text: e.target.value })} placeholder="Share your experience…" rows={2} className="w-full rounded-xl border border-[var(--border)] bg-[var(--abyss)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none resize-none" />
                <button onClick={() => setReviewDone(true)} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--abyss)] hover:opacity-90">Submit Review</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {tab === "History" && (
        <div className="space-y-3">
          {HISTORY.map((o) => (
            <div key={o.id} className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--text)]">{o.id}</p>
                    {o.drive && <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">🚗 Pasar-Drive</span>}
                  </div>
                  <p className="text-xs text-[var(--muted)]">{o.date} · {o.items} items</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{o.vendors.join(", ")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-[var(--accent)]">RM {o.total.toFixed(2)}</p>
                  <span className="text-xs text-emerald-400">{o.status}</span>
                </div>
              </div>
              <button className="mt-3 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--raised)] hover:text-[var(--text)] transition-all">Reorder →</button>
            </div>
          ))}
        </div>
      )}

      {/* Favorites */}
      {tab === "Favorites" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {FAVORITES.map((f) => (
            <div key={f.name} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4">
              <span className="text-3xl">{f.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold text-[var(--text)]">{f.name}</p>
                <p className="text-xs text-[var(--muted)]">{f.cat} · Visited {f.visits}×</p>
                <p className="text-xs text-amber-400">⭐ {f.rating}</p>
              </div>
              <Link href="/user/map" className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400">Navigate →</Link>
            </div>
          ))}
        </div>
      )}

      {/* AI Trails */}
      {tab === "AI Trails" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">✨ AI-generated food trails based on your order history and taste profile</p>
          {TRAILS.map((t) => (
            <div key={t.title} className={`rounded-2xl border bg-gradient-to-br ${t.color} ${t.border} p-6`}>
              <div className="flex items-start gap-4">
                <span className="text-4xl">{t.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-[var(--text)]">{t.title}</h3>
                  <p className="text-xs text-[var(--muted)]">{t.desc} · Budget: {t.budget}</p>
                  <p className="mt-2 text-sm text-[var(--secondary)]">{t.stops[0]}</p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">{t.based}</p>
                </div>
              </div>
              <Link href="/user/map" className="mt-4 inline-block rounded-lg bg-[var(--abyss)]/60 px-4 py-2 text-xs font-bold text-[var(--text)] hover:bg-[var(--raised)]">
                🗺️ Start This Trail →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
