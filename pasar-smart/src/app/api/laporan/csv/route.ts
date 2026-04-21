import { NextResponse } from "next/server";
import { labelDaerah } from "@/lib/melaka";
import { senToRmLabel } from "@/lib/money";
import { getAgregasiMengikutDaerah, getButiranPenugasan, getButiranPenugasanByDate, getAgregasiMengikutDaerahByDate } from "@/lib/reports";
import { ASSIGNMENT_STATUS_LABEL, type AssignmentStatus } from "@/lib/status";

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  return lines.join("\n") + "\n";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jenis = searchParams.get("jenis") ?? "daerah";

  try {
    if (jenis === "daerah") {
      const date = searchParams.get("date");
      const data = date ? await getAgregasiMengikutDaerahByDate(date) : await getAgregasiMengikutDaerah();
      const headers = [
        "Daerah",
        "Bilangan penugasan",
        "Bilangan tapak (petak pasar)",
        "Anggaran jumlah yuran harian (RM)",
      ];
      const rows = data.map((r) => [
        labelDaerah(r.daerah),
        String(r.bil_penugasan),
        String(r.bil_tapak),
        senToRmLabel(r.anggaran_yuran_sen),
      ]);
      const body = toCsv(headers, rows);
      const filename = date ? `pasar-smart_ringkasan-daerah_${date}.csv` : `pasar-smart_ringkasan-daerah.csv`;
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (jenis === "butiran") {
      const date = searchParams.get("date");
      const data = date ? await getButiranPenugasanByDate(date) : await getButiranPenugasan();
      const headers = [
        "Penjaja",
        "Jenis jualan",
        "Pasar malam",
        "Daerah",
        "Tarikh mula (UTC)",
        "Status penugasan",
        "Petak",
      ];
      const rows = data.map((r) => [
        r.nama_penjaja,
        r.jenis_jualan,
        r.nama_pasar,
        labelDaerah(r.daerah),
        r.tarikh_mula,
        ASSIGNMENT_STATUS_LABEL[r.status_penugasan as AssignmentStatus] ?? r.status_penugasan,
        r.petak ?? "",
      ]);
      const body = toCsv(headers, rows);
      const filename = date
        ? `pasar-smart_butiran-penugasan_${date}.csv`
        : `pasar-smart_butiran-penugasan.csv`;
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: "Parameter jenis tidak dikenali" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ralat tidak diketahui";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
