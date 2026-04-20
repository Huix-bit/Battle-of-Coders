import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  vendor: string;
  emoji: string;
}

export async function POST(req: NextRequest) {
  try {
    const { items, useDrive, pickupLabel } = await req.json() as {
      items: CartItem[];
      useDrive: boolean;
      pickupLabel: string;
    };

    const line_items = items.map((item) => ({
      price_data: {
        currency: "myr",
        product_data: {
          name: `${item.emoji} ${item.name}`,
          description: `from ${item.vendor}`,
        },
        unit_amount: Math.round(item.price * 100), // convert RM to sen
      },
      quantity: item.qty,
    }));

    if (useDrive) {
      line_items.push({
        price_data: {
          currency: "myr",
          product_data: {
            name: "🚗 Pasar-Drive Pickup",
            description: pickupLabel,
          },
          unit_amount: 150, // RM 1.50
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/user/cart/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/user/cart`,
      metadata: {
        pasar_drive: useDrive ? "true" : "false",
        pickup_label: pickupLabel ?? "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
