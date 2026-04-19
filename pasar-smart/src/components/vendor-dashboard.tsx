"use client";

import { useState, useEffect } from "react";
import { toggleStallPresence, getVendorStallStatus, getActiveStalls } from "@/actions/stallStatus";
import { getDailySalesSummary, getWeeklyAnalytics, generateAIRecommendations, getRecommendations } from "@/actions/analytics";
import { createFlashSale, getActiveFlashSales, recordSale } from "@/actions/sellingTools";

interface DashboardStats {
  totalSales: number;
  transactionCount: number;
  peakHour: number | null;
  avgTransactionValue: number;
}

export function VendorDashboard({ vendorId, marketId }: { vendorId: string; marketId: string }) {
  const [isPresent, setIsPresent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeFlashSales, setActiveFlashSales] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get stall status
        const status = await getVendorStallStatus(vendorId, marketId);
        if (status) {
          setIsPresent(status.isPresent);
        }

        // Get daily stats
        const dailyStats = await getDailySalesSummary(vendorId, marketId);
        setStats({
          totalSales: dailyStats.totalSales,
          transactionCount: dailyStats.transactionCount,
          peakHour: dailyStats.peakHour ? parseInt(dailyStats.peakHour) : null,
          avgTransactionValue: dailyStats.avgTransactionValue,
        });

        // Get recommendations
        const recs = await getRecommendations(vendorId);
        setRecommendations(recs.slice(0, 3));

        // Get active flash sales
        const flashSales = await getActiveFlashSales(vendorId);
        setActiveFlashSales(flashSales);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [vendorId, marketId]);

  async function handleTogglePresence(shouldBePresent: boolean) {
    setLoading(true);
    try {
      const result = await toggleStallPresence(
        vendorId,
        marketId,
        `assign-${vendorId}-${marketId}`,
        shouldBePresent
      );

      if (result.success) {
        setIsPresent(shouldBePresent);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Pasar Smart - Vendor Hub</h1>
        <div className="text-sm text-slate-400">
          Vendor ID: <span className="font-mono text-white">{vendorId}</span>
        </div>
      </div>

      {/* "I'm Here" Toggle */}
      <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Status Petak</h2>
            <p className="text-sm text-slate-400">Bagitahu pelanggan jika anda sedang berjualan</p>
          </div>
          <button
            onClick={() => handleTogglePresence(!isPresent)}
            disabled={loading}
            className={`rounded-full px-8 py-3 text-lg font-bold transition-all ${
              isPresent
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            } disabled:opacity-50`}
          >
            {loading ? "Updating..." : isPresent ? "✓ AKTIF" : "TUTUP"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="💰"
            label="Total Penjualan"
            value={`RM ${stats.totalSales.toFixed(2)}`}
          />
          <StatCard
            icon="🛍️"
            label="Transaksi"
            value={stats.transactionCount}
          />
          <StatCard
            icon="⏰"
            label="Jam Puncak"
            value={stats.peakHour ? `${stats.peakHour}:00` : "N/A"}
          />
          <StatCard
            icon="📊"
            label="Purata Transaksi"
            value={`RM ${stats.avgTransactionValue.toFixed(2)}`}
          />
        </div>
      )}

      {/* Active Flash Sales */}
      {activeFlashSales.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-xl font-semibold text-white">⚡ Flash Sales Aktif</h3>
          <div className="space-y-3">
            {activeFlashSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between rounded-lg bg-slate-700/50 p-4"
              >
                <div>
                  <p className="font-semibold text-white">{sale.itemName || "Item"}</p>
                  <p className="text-sm text-slate-400">
                    Diskaun: {sale.discountPercentage}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">
                    RM {sale.discountedPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Tersold: {sale.quantitySold}/{sale.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-xl font-semibold text-white">🤖 Cadangan AI</h3>
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-600 bg-slate-700/30 p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-semibold text-white">{rec.title}</h4>
                  <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">
                    {rec.type}
                  </span>
                </div>
                <p className="mb-2 text-sm text-slate-300">{rec.description}</p>
                <p className="text-xs text-slate-500">{rec.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
      <div className="mb-2 text-3xl">{icon}</div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
