"use client";

import { VendorDashboard } from "@/components/vendor-dashboard";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const vendorId = searchParams.get("vendorId") || "demo-vendor-1";
  const marketId = searchParams.get("marketId") || "demo-market-1";

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📊 Papan Pemantau Penjaja</h1>
          <p className="text-slate-400">
            Pantau penjualan, status toko, dan dapatkan cadangan AI secara real-time
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Vendor: <span className="text-indigo-400">{vendorId}</span> | Pasar:{" "}
            <span className="text-indigo-400">{marketId}</span>
          </p>
        </div>

        <VendorDashboard vendorId={vendorId} marketId={marketId} />

        <div className="mt-8 text-slate-400 text-sm">
          <p>
            💡 Tip: Ubah vendorId dan marketId dalam URL untuk menguji dengan data berbeza
          </p>
          <p className="mt-2">
            Contoh: ?vendorId=v-123&marketId=m-456
          </p>
        </div>
      </div>
    </div>
  );
}
