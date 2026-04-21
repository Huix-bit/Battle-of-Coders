"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { SellingToolsPanel } from "@/components/selling-tools-panel";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

export default function VendorToolsPage() {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setVendorId(getCookie("vendor-id"));
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!vendorId) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-4xl">🔒</p>
        <p className="text-lg font-semibold text-[var(--text)]">Vendor session not found</p>
        <p className="text-sm text-[var(--muted)]">Please sign out and sign back in as a Vendor.</p>
        <Link href="/login" className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--abyss)] hover:opacity-90">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/vendor" className="hover:text-[var(--text)]">
          Vendor Portal
        </Link>
        <span>/</span>
        <span className="text-[var(--text)]">Selling Tools</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">🛠️ Dynamic Selling Tools</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Launch flash deals, join Pasar-Drive orders, and log every transaction.
        </p>
      </div>

      <SellingToolsPanel vendorId={vendorId} marketId="demo-market-1" />
    </div>
  );
}
