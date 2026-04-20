"use client";

import { SellingToolsPanel } from "@/components/selling-tools-panel";
import Link from "next/link";

export default function VendorToolsPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/vendor" className="hover:text-[var(--text)]">Vendor Portal</Link>
        <span>/</span>
        <span className="text-[var(--text)]">Selling Tools</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">🛠️ Dynamic Selling Tools</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Launch flash deals, join Pasar-Drive orders, request duit pecah, and log every transaction.
        </p>
      </div>

      <SellingToolsPanel vendorId="demo-vendor-1" marketId="demo-market-1" />
    </div>
  );
}
