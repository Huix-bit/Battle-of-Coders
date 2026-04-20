"use client";

import { VendorDashboard } from "@/components/vendor-dashboard";
import Link from "next/link";

export default function VendorDashboardPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/vendor" className="hover:text-[var(--text)]">Vendor Portal</Link>
        <span>/</span>
        <span className="text-[var(--text)]">Vendor Hub</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">📊 Vendor Hub</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Toggle your stall status, track performance, and act on AI recommendations in real-time.
        </p>
      </div>

      <VendorDashboard vendorId="demo-vendor-1" marketId="demo-market-1" />
    </div>
  );
}
