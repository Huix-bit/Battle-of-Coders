import { NextResponse } from "next/server";
import { getAgregasiMengikutDaerah, getAgregasiMengikutDaerahByDate } from "@/lib/reports";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  try {
    const data = date ? await getAgregasiMengikutDaerahByDate(date) : await getAgregasiMengikutDaerah();
    return NextResponse.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
