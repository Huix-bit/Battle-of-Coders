"use client";

import { SellingToolsPanel } from "@/components/selling-tools-panel";
import { useSearchParams } from "next/navigation";

export default function ToolsPage() {
  const searchParams = useSearchParams();
  const vendorId = searchParams.get("vendorId") || "demo-vendor-1";
  const marketId = searchParams.get("marketId") || "demo-market-1";

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🛠️ Alat Jualan Dinamik</h1>
          <p className="text-slate-400">
            Buat promosi kilat, pesanan Pasar-Drive, minta duit pecah, dan catat jualan
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Vendor: <span className="text-emerald-400">{vendorId}</span> | Pasar:{" "}
            <span className="text-emerald-400">{marketId}</span>
          </p>
        </div>

        <SellingToolsPanel vendorId={vendorId} marketId={marketId} />

        <div className="mt-8 p-4 bg-slate-800 rounded-lg text-slate-300 text-sm">
          <h3 className="font-semibold mb-2 text-white">📝 Panduan Penggunaan:</h3>
          <ul className="space-y-1 text-xs">
            <li>
              ⚡ <strong>Flash Sale:</strong> Buat promosi masa terbatas untuk produk tertentu
            </li>
            <li>
              🚗 <strong>Pasar-Drive:</strong> Langggan boleh pesan dari pelbagai penjaja sekali
            </li>
            <li>
              💰 <strong>Duit Pecah:</strong> Minta tukar duit kecil dari penjaja berdekatan
            </li>
            <li>
              📊 <strong>Catat Jualan:</strong> Log setiap transaksi untuk analitik
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
