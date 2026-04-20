"use client";

import { useState } from "react";
import {
  createFlashSale,
  createPasarDriveOrder,
  addItemToPasarDriveOrder,
  requestSmallChange,
  recordSale,
} from "@/actions/sellingTools";

type Tab = "flash" | "drive" | "change" | "sales";

const TABS: { id: Tab; icon: string; label: string; accent: string }[] = [
  { id: "flash",  icon: "⚡", label: "Flash Sale",   accent: "text-amber-400"  },
  { id: "drive",  icon: "🚗", label: "Pasar-Drive",  accent: "text-cyan-400"   },
  { id: "change", icon: "💰", label: "Duit Pecah",   accent: "text-emerald-400"},
  { id: "sales",  icon: "📊", label: "Record Sale",  accent: "text-pink-400"   },
];

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
      ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
         : "border-[#E8342A]/40 bg-[#E8342A]/10 text-[#E8342A]"
    }`}>
      <span>{ok ? "✓" : "✕"}</span>
      {msg}
    </div>
  );
}

function InputField({ label, type = "number", value, onChange, placeholder }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--abyss)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
    </div>
  );
}

export function SellingToolsPanel({ vendorId, marketId }: { vendorId: string; marketId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("flash");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Flash Sale ──────────────────────────────────────────────────────────────
  const [flash, setFlash] = useState({ price: "", pct: "", mins: "30", item: "" });
  const flashDiscounted = flash.price && flash.pct
    ? (parseFloat(flash.price) * (1 - parseFloat(flash.pct) / 100)).toFixed(2)
    : null;

  async function handleFlash() {
    if (!flash.price || !flash.pct) { showToast("Please fill price and discount.", false); return; }
    setLoading(true);
    try {
      const r = await createFlashSale(vendorId, marketId, null, parseFloat(flash.price), parseFloat(flash.pct), parseInt(flash.mins));
      if (r.success) { showToast("Flash sale launched successfully!"); setFlash({ price: "", pct: "", mins: "30", item: "" }); }
      else showToast(r.error ?? "Failed to create flash sale.", false);
    } finally { setLoading(false); }
  }

  // ── Pasar-Drive ─────────────────────────────────────────────────────────────
  const [orderId, setOrderId] = useState<string | null>(null);
  const [driveItems, setDriveItems] = useState<{ qty: string; price: string }[]>([]);
  const [driveForm, setDriveForm] = useState({ qty: "", price: "" });

  async function handleCreateDrive() {
    setLoading(true);
    try {
      const r = await createPasarDriveOrder(marketId, undefined, 30);
      if (r.success && r.orderId) { setOrderId(r.orderId); setDriveItems([]); showToast("Pasar-Drive order created!"); }
      else showToast(r.error ?? "Failed to create order.", false);
    } finally { setLoading(false); }
  }

  async function handleAddDriveItem() {
    if (!orderId || !driveForm.qty || !driveForm.price) { showToast("Fill in qty and price.", false); return; }
    setLoading(true);
    try {
      const r = await addItemToPasarDriveOrder(orderId, vendorId, `item-${Date.now()}`, parseInt(driveForm.qty), parseFloat(driveForm.price));
      if (r.success) { setDriveItems([...driveItems, driveForm]); setDriveForm({ qty: "", price: "" }); showToast("Item added to order!"); }
    } finally { setLoading(false); }
  }

  // ── Duit Pecah ──────────────────────────────────────────────────────────────
  const [changeAmt, setChangeAmt] = useState("");
  const PRESET_AMOUNTS = ["10", "20", "50", "100"];

  async function handleChange() {
    if (!changeAmt) { showToast("Enter an amount.", false); return; }
    setLoading(true);
    try {
      const r = await requestSmallChange(vendorId, marketId, parseFloat(changeAmt));
      if (r.success) { showToast("Change request sent to nearby vendors!"); setChangeAmt(""); }
      else showToast(r.error ?? "Failed.", false);
    } finally { setLoading(false); }
  }

  // ── Record Sale ─────────────────────────────────────────────────────────────
  const [sale, setSale] = useState({ qty: "", price: "", desc: "" });
  const saleTotal = sale.qty && sale.price ? (parseInt(sale.qty) * parseFloat(sale.price)).toFixed(2) : null;

  async function handleSale() {
    if (!sale.qty || !sale.price) { showToast("Fill in quantity and price.", false); return; }
    setLoading(true);
    try {
      const r = await recordSale(vendorId, marketId, [{ quantity: parseInt(sale.qty), pricePerUnit: parseFloat(sale.price) }]);
      if (r.success) { showToast("Sale recorded!"); setSale({ qty: "", price: "", desc: "" }); }
      else showToast(r.error ?? "Failed.", false);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Tab nav */}
      <div className="flex overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--abyss)] p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === t.id
                ? "bg-[var(--raised)] text-[var(--text)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Flash Sale panel ── */}
      {activeTab === "flash" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">⚡ Launch Flash Sale</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Broadcast a limited-time discount to attract customers during low demand.</p>
          </div>

          <InputField label="Item name (optional)" type="text" value={flash.item} onChange={(v) => setFlash({ ...flash, item: v })} placeholder="e.g. Mee Goreng" />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Original Price (RM)" value={flash.price} onChange={(v) => setFlash({ ...flash, price: v })} placeholder="8.00" />
            <InputField label="Discount (%)" value={flash.pct} onChange={(v) => setFlash({ ...flash, pct: v })} placeholder="20" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Duration</label>
            <div className="flex gap-2">
              {["15", "30", "60", "120"].map((m) => (
                <button
                  key={m}
                  onClick={() => setFlash({ ...flash, mins: m })}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-all ${
                    flash.mins === m
                      ? "border-amber-400/60 bg-amber-400/20 text-amber-400"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-amber-400/30"
                  }`}
                >
                  {m === "60" ? "1h" : m === "120" ? "2h" : `${m}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          {flashDiscounted && (
            <div className="rounded-xl border border-amber-400/30 bg-[var(--abyss)] p-4">
              <p className="text-xs text-[var(--muted)] mb-2">Preview</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[var(--text)]">{flash.item || "Your item"}</p>
                  <p className="text-xs text-[var(--muted)] line-through">RM {parseFloat(flash.price).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-400">RM {flashDiscounted}</p>
                  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-400">
                    -{flash.pct}% for {flash.mins === "60" ? "1h" : flash.mins === "120" ? "2h" : `${flash.mins}m`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleFlash} disabled={loading} className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-[var(--abyss)] transition-all hover:bg-amber-400 disabled:opacity-50">
            {loading ? "Launching…" : "🚀 Launch Flash Sale Now"}
          </button>
        </div>
      )}

      {/* ── Pasar-Drive panel ── */}
      {activeTab === "drive" && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">🚗 Pasar-Drive</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Join multi-stall curbside pickup orders. Buyers order from you without parking.</p>
          </div>

          {!orderId ? (
            <button onClick={handleCreateDrive} disabled={loading} className="w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white transition-all hover:bg-cyan-400 disabled:opacity-50">
              {loading ? "Creating…" : "📦 Create Pasar-Drive Order"}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--abyss)] px-4 py-3">
                <p className="text-xs text-[var(--muted)]">Order ID</p>
                <p className="font-mono text-sm text-cyan-400">{orderId}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Quantity" value={driveForm.qty} onChange={(v) => setDriveForm({ ...driveForm, qty: v })} placeholder="2" />
                <InputField label="Price per unit (RM)" value={driveForm.price} onChange={(v) => setDriveForm({ ...driveForm, price: v })} placeholder="8.00" />
              </div>

              <button onClick={handleAddDriveItem} disabled={loading} className="w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-2.5 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50">
                {loading ? "Adding…" : "+ Add Item to Order"}
              </button>

              {driveItems.length > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--abyss)] divide-y divide-[var(--border)]">
                  {driveItems.map((item, i) => (
                    <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-[var(--secondary)]">Item #{i + 1} × {item.qty}</span>
                      <span className="font-semibold text-cyan-400">RM {(parseInt(item.qty) * parseFloat(item.price)).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-2.5 text-sm font-bold">
                    <span className="text-[var(--text)]">Total</span>
                    <span className="text-cyan-400">
                      RM {driveItems.reduce((acc, i) => acc + parseInt(i.qty) * parseFloat(i.price), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Duit Pecah panel ── */}
      {activeTab === "change" && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">💰 Duit Pecah</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Request small change from nearby vendors. A co-op network among stall owners.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Quick Amount</label>
            <div className="flex gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setChangeAmt(a)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                    changeAmt === a
                      ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-400"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-emerald-400/30"
                  }`}
                >
                  RM {a}
                </button>
              ))}
            </div>
          </div>

          <InputField label="Or enter custom amount (RM)" value={changeAmt} onChange={setChangeAmt} placeholder="25.00" />

          {changeAmt && (
            <div className="rounded-xl border border-emerald-500/30 bg-[var(--abyss)] p-4 text-center">
              <p className="text-xs text-[var(--muted)]">Requesting change of</p>
              <p className="text-3xl font-bold text-emerald-400">RM {parseFloat(changeAmt || "0").toFixed(2)}</p>
              <p className="text-xs text-[var(--muted)] mt-1">Request will be broadcast to all vendors within 50m</p>
            </div>
          )}

          <button onClick={handleChange} disabled={loading} className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-400 disabled:opacity-50">
            {loading ? "Sending…" : "🤝 Broadcast Request"}
          </button>
        </div>
      )}

      {/* ── Record Sale panel ── */}
      {activeTab === "sales" && (
        <div className="rounded-2xl border border-pink-500/30 bg-pink-500/5 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">📊 Record Sale</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Log every transaction to power your analytics and AI recommendations.</p>
          </div>

          <InputField label="Item / Description (optional)" type="text" value={sale.desc} onChange={(v) => setSale({ ...sale, desc: v })} placeholder="e.g. Mee Goreng Special" />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Quantity sold" value={sale.qty} onChange={(v) => setSale({ ...sale, qty: v })} placeholder="3" />
            <InputField label="Price per unit (RM)" value={sale.price} onChange={(v) => setSale({ ...sale, price: v })} placeholder="7.50" />
          </div>

          {saleTotal && (
            <div className="rounded-xl border border-pink-500/30 bg-[var(--abyss)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--muted)]">Sale total</p>
                  <p className="text-sm text-[var(--secondary)]">{sale.qty} × RM {parseFloat(sale.price).toFixed(2)}</p>
                </div>
                <p className="text-3xl font-bold text-pink-400">RM {saleTotal}</p>
              </div>
            </div>
          )}

          <button onClick={handleSale} disabled={loading} className="w-full rounded-xl bg-pink-500 py-3 text-sm font-bold text-white transition-all hover:bg-pink-400 disabled:opacity-50">
            {loading ? "Saving…" : "✓ Record This Sale"}
          </button>
        </div>
      )}
    </div>
  );
}
