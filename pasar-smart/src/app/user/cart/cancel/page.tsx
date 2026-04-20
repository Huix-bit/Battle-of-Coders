import Link from "next/link";

export default function CartCancelPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-5 text-center px-4">
      <div className="h-24 w-24 rounded-full bg-red-500/10 flex items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center text-4xl">
          ✕
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--text)]">Payment Cancelled</h1>
        <p className="text-[var(--muted)] max-w-xs">
          No worries — your cart is still saved. You can return and complete your order anytime.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/user/cart"
          className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 transition-all"
        >
          Return to Cart
        </Link>
        <Link
          href="/user/discover"
          className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-bold text-[var(--text)] hover:bg-[var(--surface)] transition-all"
        >
          Keep Browsing
        </Link>
      </div>
    </div>
  );
}
