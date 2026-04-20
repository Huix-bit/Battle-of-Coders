import Link from "next/link";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export default async function CartSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  // Guard: no session_id means someone navigated here directly — send them back.
  if (!session_id) redirect("/user/cart");

  let amountTotal = 0;
  let currency = "myr";
  let isPasarDrive = false;
  let pickupLabel = "";

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Guard: payment must be confirmed paid — catches incomplete/cancelled sessions.
    if (session.payment_status !== "paid") redirect("/user/cart");

    amountTotal = session.amount_total ?? 0;
    currency = session.currency ?? "myr";
    isPasarDrive = session.metadata?.pasar_drive === "true";
    pickupLabel = session.metadata?.pickup_label ?? "";
  } catch {
    // Invalid or unknown session_id — send back to cart.
    redirect("/user/cart");
  }

  const formattedAmount =
    amountTotal > 0
      ? `RM ${(amountTotal / 100).toFixed(2)}`
      : null;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-6 text-center px-4">
      {/* Animated checkmark */}
      <div className="relative flex items-center justify-center">
        <div className="h-28 w-28 rounded-full bg-emerald-500/10 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
          <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg viewBox="0 0 52 52" className="h-12 w-12" fill="none">
              <circle cx="26" cy="26" r="25" className="stroke-emerald-500" strokeWidth="2" fill="none" />
              <path d="M14 27l8 8 16-16" className="stroke-emerald-400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 text-2xl animate-bounce">🎉</div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[var(--text)]">Payment Successful!</h1>
        <p className="text-[var(--muted)] max-w-sm">
          Your order has been confirmed and the vendors have been notified.
        </p>
        {formattedAmount && (
          <p className="text-lg font-semibold text-emerald-400">
            {formattedAmount} <span className="text-sm font-normal text-[var(--muted)] uppercase">{currency}</span>
          </p>
        )}
      </div>

      {/* Pasar-Drive notice */}
      {isPasarDrive && pickupLabel && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-4 max-w-sm">
          <p className="text-sm font-bold text-cyan-300 mb-1">🚗 Pasar-Drive Active</p>
          <p className="text-xs text-cyan-200/80">
            Your order will be ready for pickup at <span className="font-semibold">{pickupLabel}</span> in approximately 20 minutes.
          </p>
        </div>
      )}

      {/* Order steps */}
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-base">✓</div>
          <span>Paid</span>
        </div>
        <div className="h-px w-8 bg-[var(--border)]" />
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-base">🍳</div>
          <span>Preparing</span>
        </div>
        <div className="h-px w-8 bg-[var(--border)]" />
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-8 rounded-full bg-[var(--raised)] flex items-center justify-center text-[var(--muted)] text-base">
            {isPasarDrive ? "🚗" : "🛍️"}
          </div>
          <span>{isPasarDrive ? "Pickup" : "Collect"}</span>
        </div>
      </div>

      {/* Stripe confirmation note */}
      {session_id && (
        <p className="text-[10px] text-[var(--muted)] font-mono opacity-60">
          ref: {session_id.slice(0, 24)}…
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Link
          href="/user/discover"
          className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 transition-all"
        >
          Browse More Stalls
        </Link>
        <Link
          href="/user/profile"
          className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-bold text-[var(--text)] hover:bg-[var(--surface)] transition-all"
        >
          View Order History
        </Link>
      </div>
    </div>
  );
}
