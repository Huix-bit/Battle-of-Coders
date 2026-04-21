import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabaseClient";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const db = supabaseAdmin ?? supabase;

// Build a live context string from the database
async function buildMarketContext(): Promise<string> {
  try {
    const [
      { data: markets },
      { data: vendors },
      { data: statuses },
      { data: flashSales },
    ] = await Promise.all([
      db.from("market").select("nama_pasar, daerah, alamat, hari_operasi, status"),
      db.from("vendor").select("id, nama_perniagaan, jenis_jualan, nama_panggilan, status").eq("status", "AKTIF"),
      db.from("stall_status").select("vendor_id, is_present").eq("is_present", true),
      db.from("flash_sale")
        .select("vendor_id, item_name, discounted_price, original_price, discount_percentage, end_time")
        .eq("is_active", true)
        .gt("end_time", new Date().toISOString()),
    ]);

    const openCount = statuses?.length ?? 0;
    const flashCount = flashSales?.length ?? 0;

    let ctx = "=== PASAR SMART LIVE DATA ===\n\n";

    // Markets
    ctx += "NIGHT MARKETS IN MELAKA:\n";
    for (const m of markets ?? []) {
      ctx += `• ${m.nama_pasar} — District: ${m.daerah}, Address: ${m.alamat ?? "N/A"}, Operating: ${m.hari_operasi ?? "N/A"}, Status: ${m.status}\n`;
    }

    // Live stall count
    ctx += `\nCURRENT LIVE STATUS:\n`;
    ctx += `• ${openCount} stall${openCount !== 1 ? "s" : ""} currently open right now\n`;
    ctx += `• ${flashCount} active flash sale${flashCount !== 1 ? "s" : ""} running\n`;

    // Active vendors
    ctx += `\nACTIVE REGISTERED VENDORS (${vendors?.length ?? 0} total):\n`;
    const catCounts: Record<string, number> = {};
    for (const v of vendors ?? []) {
      catCounts[v.jenis_jualan ?? "Others"] = (catCounts[v.jenis_jualan ?? "Others"] ?? 0) + 1;
    }
    for (const [cat, count] of Object.entries(catCounts)) {
      ctx += `• ${cat}: ${count} vendor${count !== 1 ? "s" : ""}\n`;
    }

    // Flash sales
    if (flashSales && flashSales.length > 0) {
      ctx += `\nONGOING FLASH SALES:\n`;
      for (const fs of flashSales) {
        const vendorName = vendors?.find((v: any) => v.id === fs.vendor_id)?.nama_perniagaan ?? "A vendor";
        const endsAt = new Date(fs.end_time).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
        ctx += `• ${fs.item_name ?? "Special item"} — RM ${Number(fs.discounted_price).toFixed(2)} (${fs.discount_percentage}% off) at ${vendorName}, ends ${endsAt}\n`;
      }
    }

    return ctx;
  } catch (e) {
    console.error("buildMarketContext error:", e);
    return "Live market data is temporarily unavailable.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json() as {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const marketContext = await buildMarketContext();

    const systemPrompt = `You are PasarGuide 🌙, a friendly AI assistant for PASAR SMART — a night market management platform in Melaka, Malaysia.

Your role is to help visitors find night markets, discover vendors, learn about flash sales, and understand how the platform works.

Use the live database data below to answer questions accurately. Always be helpful, warm, and concise (2-4 sentences max per response unless the user asks for details). Mix English and Bahasa Malaysia naturally.

${marketContext}

RULES:
- Only answer questions related to night markets, vendors, food, the Pasar Smart platform, or Melaka.
- If asked about something unrelated, politely redirect to market topics.
- For directions, mention the district (daerah) and suggest using Google Maps.
- If a market is not operating today, mention when it does operate.
- Never make up vendor names or prices not in the data above.
- Keep responses friendly and conversational.`;

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 300,
      temperature: 0.5,
    });

    const reply = completion.choices[0]?.message?.content ?? "Maaf, saya tidak dapat menjawab sekarang.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Public chat error:", error);
    return NextResponse.json(
      { reply: "Maaf, ada masalah teknikal. Sila cuba lagi sebentar." },
      { status: 200 }
    );
  }
}
