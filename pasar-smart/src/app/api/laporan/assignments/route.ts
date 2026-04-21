import { NextResponse } from "next/server";
import { getAgregasiPasarByDate } from "@/lib/reports";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  try {
    if (!date) return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
    const data = await getAgregasiPasarByDate(date);
    return NextResponse.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
