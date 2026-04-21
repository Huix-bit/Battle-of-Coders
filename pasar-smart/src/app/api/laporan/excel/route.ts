import { NextResponse } from "next/server";
import { getAgregasiMengikutDaerahByDate, getButiranPenugasanByDate } from "@/lib/reports";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const type = searchParams.get("type") ?? "comprehensive";
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  try {
    const XLSX = await import('xlsx');

    if (type === 'comprehensive') {
      // Comprehensive report: district summary + assignment details
      const summaryData = await getAgregasiMengikutDaerahByDate(date);
      const assignmentData = await getButiranPenugasanByDate(date);

      const summaryRows = (summaryData ?? []).map((r: any) => ({
        District: r.daerah,
        Assignments: r.bil_penugasan,
        Capacity: r.kapasiti_total ?? '',
        Sites: r.bil_tapak,
        EstimatedFees_RM: (r.anggaran_yuran_sen ?? 0) / 100,
        OccupancyRate_Percent: r.kapasiti_total > 0 ? Math.round((r.bil_penugasan / r.kapasiti_total) * 100) : Math.round((r.bil_penugasan / Math.max(1, r.bil_tapak)) * 100),
      }));

      const assignmentRows = (assignmentData ?? []).map((r: any) => ({
        Vendor: r.nama_penjaja,
        Type: r.jenis_jualan,
        Market: r.nama_pasar,
        District: r.daerah,
        StartUTC: r.tarikh_mula,
        Status: r.status_penugasan,
        Stall: r.petak ?? '',
      }));

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      const wsAssignments = XLSX.utils.json_to_sheet(assignmentRows);
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, 'District Summary');
      XLSX.utils.book_append_sheet(wb, wsAssignments, 'Assignments');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const uint8 = new Uint8Array(wbout as ArrayBuffer);
      return new NextResponse(uint8, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="market_report_${date}.xlsx"`,
        },
      });
    }

    if (type === 'district') {
      const data = await getAgregasiMengikutDaerahByDate(date);
      const rows = (data ?? []).map((r: any) => ({
        District: r.daerah,
        Assignments: r.bil_penugasan,
        Capacity: r.kapasiti_total ?? '',
        Sites: r.bil_tapak,
        EstimatedFees_RM: (r.anggaran_yuran_sen ?? 0) / 100,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Summary_${date}`);
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const uint8 = new Uint8Array(wbout as ArrayBuffer);
      return new NextResponse(uint8, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="report_summary_${date}.xlsx"`,
        },
      });
    }

    // assignments
    const data = await getButiranPenugasanByDate(date);
    const rows = (data ?? []).map((r: any) => ({
      Vendor: r.nama_penjaja,
      Type: r.jenis_jualan,
      Market: r.nama_pasar,
      District: r.daerah,
      StartUTC: r.tarikh_mula,
      Status: r.status_penugasan,
      Stall: r.petak ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Assignments_${date}`);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const uint8 = new Uint8Array(wbout as ArrayBuffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="assignments_${date}.xlsx"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
