"use client";

import { useState } from "react";
import {
  createFlashSale,
  createPasarDriveOrder,
  addItemToPasarDriveOrder,
  requestSmallChange,
  recordSale,
} from "@/actions/sellingTools";

export function SellingToolsPanel({ vendorId, marketId }: { vendorId: string; marketId: string }) {
  const [activeTab, setActiveTab] = useState<"flash" | "drive" | "change" | "sales">("flash");
  const [loading, setLoading] = useState(false);

  // Flash Sale State
  const [flashSaleForm, setFlashSaleForm] = useState({
    originalPrice: "",
    discountPercentage: "",
    durationMinutes: "30",
  });

  // Pasar Drive State
  const [driveOrderId, setDriveOrderId] = useState<string | null>(null);
  const [driveItems, setDriveItems] = useState<any[]>([]);

  // Duit Pecah State
  const [changeRequest, setChangeRequest] = useState({
    amount: "",
  });

  // Sales Recording State
  const [saleRecord, setSaleRecord] = useState({
    quantity: "",
    pricePerUnit: "",
  });

  // ========== FLASH SALE HANDLERS ==========
  async function handleCreateFlashSale() {
    if (!flashSaleForm.originalPrice || !flashSaleForm.discountPercentage) {
      alert("Sila isi semua ruangan");
      return;
    }

    setLoading(true);
    try {
      const result = await createFlashSale(
        vendorId,
        marketId,
        null,
        parseFloat(flashSaleForm.originalPrice),
        parseFloat(flashSaleForm.discountPercentage),
        parseInt(flashSaleForm.durationMinutes)
      );

      if (result.success) {
        alert("✓ Flash sale berjaya dimulakan!");
        setFlashSaleForm({
          originalPrice: "",
          discountPercentage: "",
          durationMinutes: "30",
        });
      } else {
        alert(`Ralat: ${result.error}`);
      }
    } finally {
      setLoading(false);
    }
  }

  // ========== PASAR DRIVE HANDLERS ==========
  async function handleCreatePasarDriveOrder() {
    setLoading(true);
    try {
      const result = await createPasarDriveOrder(marketId, undefined, 30);

      if (result.success && result.orderId) {
        setDriveOrderId(result.orderId);
        setDriveItems([]);
        alert("✓ Pesanan Pasar-Drive dibuat!");
      } else {
        alert(`Ralat: ${result.error}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItemToDrive() {
    if (!driveOrderId || !saleRecord.quantity || !saleRecord.pricePerUnit) {
      alert("Sila isi semua ruangan");
      return;
    }

    setLoading(true);
    try {
      const result = await addItemToPasarDriveOrder(
        driveOrderId,
        vendorId,
        `item-${Date.now()}`,
        parseInt(saleRecord.quantity),
        parseFloat(saleRecord.pricePerUnit)
      );

      if (result.success) {
        setDriveItems([
          ...driveItems,
          {
            quantity: saleRecord.quantity,
            pricePerUnit: saleRecord.pricePerUnit,
          },
        ]);
        setSaleRecord({ quantity: "", pricePerUnit: "" });
        alert("✓ Item ditambah ke pesanan");
      }
    } finally {
      setLoading(false);
    }
  }

  // ========== DUIT PECAH HANDLERS ==========
  async function handleRequestSmallChange() {
    if (!changeRequest.amount) {
      alert("Sila masukkan jumlah");
      return;
    }

    setLoading(true);
    try {
      const result = await requestSmallChange(
        vendorId,
        marketId,
        parseFloat(changeRequest.amount)
      );

      if (result.success) {
        alert("✓ Permintaan duit pecah dihantar!");
        setChangeRequest({ amount: "" });
      }
    } finally {
      setLoading(false);
    }
  }

  // ========== SALES RECORDING HANDLERS ==========
  async function handleRecordSale() {
    if (!saleRecord.quantity || !saleRecord.pricePerUnit) {
      alert("Sila isi semua ruangan");
      return;
    }

    setLoading(true);
    try {
      const result = await recordSale(vendorId, marketId, [
        {
          quantity: parseInt(saleRecord.quantity),
          pricePerUnit: parseFloat(saleRecord.pricePerUnit),
        },
      ]);

      if (result.success) {
        alert("✓ Jualan tercatat!");
        setSaleRecord({ quantity: "", pricePerUnit: "" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 to-violet-800 p-6">
      <h1 className="mb-8 text-3xl font-bold text-white">Alat Jualan Dinamik</h1>

      {/* Tab Navigation */}
      <div className="mb-8 flex gap-4 overflow-x-auto">
        {[
          { id: "flash", label: "⚡ Flash Sale", icon: "✨" },
          { id: "drive", label: "🚗 Pasar-Drive", icon: "📦" },
          { id: "change", label: "💰 Duit Pecah", icon: "🪙" },
          { id: "sales", label: "📊 Catat Jualan", icon: "💳" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`whitespace-nowrap rounded-lg px-6 py-3 font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-violet-900 shadow-lg"
                : "bg-violet-700/50 text-white hover:bg-violet-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="rounded-xl border border-violet-700/50 bg-violet-800/30 p-8 backdrop-blur-sm">
        {/* FLASH SALE */}
        {activeTab === "flash" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">⚡ Mulai Flash Sale</h2>
            <p className="text-violet-200">Tawarkan diskaun untuk menarik pelanggan dalam saat ini juga!</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white">Harga Asal (RM)</label>
                <input
                  type="number"
                  value={flashSaleForm.originalPrice}
                  onChange={(e) =>
                    setFlashSaleForm({ ...flashSaleForm, originalPrice: e.target.value })
                  }
                  placeholder="50.00"
                  className="w-full rounded-lg border border-violet-600 bg-violet-900/30 px-4 py-2 text-white placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Diskaun (%)</label>
                <input
                  type="number"
                  value={flashSaleForm.discountPercentage}
                  onChange={(e) =>
                    setFlashSaleForm({ ...flashSaleForm, discountPercentage: e.target.value })
                  }
                  placeholder="20"
                  className="w-full rounded-lg border border-violet-600 bg-violet-900/30 px-4 py-2 text-white placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Tempoh (Minit)</label>
                <select
                  value={flashSaleForm.durationMinutes}
                  onChange={(e) =>
                    setFlashSaleForm({ ...flashSaleForm, durationMinutes: e.target.value })
                  }
                  className="w-full rounded-lg border border-violet-600 bg-violet-900/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="15">15 minit</option>
                  <option value="30">30 minit</option>
                  <option value="60">1 jam</option>
                  <option value="120">2 jam</option>
                </select>
              </div>

              <button
                onClick={handleCreateFlashSale}
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-3 font-bold text-white hover:shadow-lg disabled:opacity-50"
              >
                {loading ? "Memproses..." : "🚀 Mula Flash Sale"}
              </button>
            </div>
          </div>
        )}

        {/* PASAR DRIVE */}
        {activeTab === "drive" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🚗 Pasar-Drive</h2>
            <p className="text-violet-200">Ambil bahagian dalam pesanan multi-petak. Pelanggan boleh order dari pelbagai vendor dalam satu tempat!</p>

            {!driveOrderId ? (
              <button
                onClick={handleCreatePasarDriveOrder}
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-bold text-white hover:shadow-lg disabled:opacity-50"
              >
                {loading ? "Membuat..." : "📦 Buat Pesanan Baru"}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-violet-700/50 p-4">
                  <p className="text-sm text-violet-200">Order ID:</p>
                  <p className="font-mono text-white">{driveOrderId}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-white">Kuantiti</label>
                    <input
                      type="number"
                      value={saleRecord.quantity}
                      onChange={(e) => setSaleRecord({ ...saleRecord, quantity: e.target.value })}
                      placeholder="5"
                      className="w-full rounded-lg border border-violet-600 bg-violet-900/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">Harga per Unit</label>
                    <input
                      type="number"
                      value={saleRecord.pricePerUnit}
                      onChange={(e) => setSaleRecord({ ...saleRecord, pricePerUnit: e.target.value })}
                      placeholder="10.00"
                      className="w-full rounded-lg border border-violet-600 bg-violet-900/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <button
                    onClick={handleAddItemToDrive}
                    disabled={loading}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Menambah..." : "+ Tambah Item"}
                  </button>
                </div>

                {driveItems.length > 0 && (
                  <div className="rounded-lg bg-violet-700/30 p-4">
                    <p className="text-sm text-violet-200">Item Ditambah:</p>
                    <p className="text-lg font-bold text-white">{driveItems.length} item</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DUIT PECAH */}
        {activeTab === "change" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">💰 Duit Pecah</h2>
            <p className="text-violet-200">Minta duit pecah dari vendor berdekatan. Wujudkan koperasi sesama penjaja!</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white">Jumlah (RM)</label>
                <input
                  type="number"
                  value={changeRequest.amount}
                  onChange={(e) => setChangeRequest({ amount: e.target.value })}
                  placeholder="50.00"
                  className="w-full rounded-lg border border-violet-600 bg-violet-900/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <button
                onClick={handleRequestSmallChange}
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-bold text-white hover:shadow-lg disabled:opacity-50"
              >
                {loading ? "Menghantar..." : "🤝 Hantar Permintaan"}
              </button>
            </div>
          </div>
        )}

        {/* SALES RECORDING */}
        {activeTab === "sales" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">📊 Catat Jualan</h2>
            <p className="text-violet-200">Rekodkan penjualan anda secara real-time untuk analitik yang tepat.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white">Kuantiti</label>
                <input
                  type="number"
                  value={saleRecord.quantity}
                  onChange={(e) => setSaleRecord({ ...saleRecord, quantity: e.target.value })}
                  placeholder="5"
                  className="w-full rounded-lg border border-violet-600 bg-violet-900/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Harga per Unit (RM)</label>
                <input
                  type="number"
                  value={saleRecord.pricePerUnit}
                  onChange={(e) => setSaleRecord({ ...saleRecord, pricePerUnit: e.target.value })}
                  placeholder="10.00"
                  className="w-full rounded-lg border border-violet-600 bg-violet-900/30 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {saleRecord.quantity && saleRecord.pricePerUnit && (
                <div className="rounded-lg bg-violet-700/50 p-4">
                  <p className="text-sm text-violet-200">Jumlah Jualan:</p>
                  <p className="text-2xl font-bold text-white">
                    RM {(parseInt(saleRecord.quantity) * parseFloat(saleRecord.pricePerUnit)).toFixed(2)}
                  </p>
                </div>
              )}

              <button
                onClick={handleRecordSale}
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 font-bold text-white hover:shadow-lg disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "✓ Catat Jualan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
