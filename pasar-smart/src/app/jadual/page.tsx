import { JadualPanel, type AssignmentRow, type MarketRow, type VendorOption } from "@/components/jadual-panel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JadualPage() {
  const [marketsRaw, vendorsRaw, assignmentsRaw] = await Promise.all([
    prisma.market.findMany({ orderBy: { namaPasar: "asc" } }),
    prisma.vendor.findMany({ orderBy: { namaPerniagaan: "asc" }, select: { id: true, namaPerniagaan: true } }),
    prisma.assignment.findMany({
      orderBy: { tarikhMula: "asc" },
      include: { vendor: true, market: true },
    }),
  ]);

  const markets: MarketRow[] = marketsRaw.map((m) => ({
    id: m.id,
    namaPasar: m.namaPasar,
    daerah: m.daerah,
    alamat: m.alamat,
    hariOperasi: m.hariOperasi,
    status: m.status,
  }));

  const vendors: VendorOption[] = vendorsRaw;

  const assignments: AssignmentRow[] = assignmentsRaw.map((a) => ({
    id: a.id,
    vendorId: a.vendorId,
    marketId: a.marketId,
    tarikhMula: a.tarikhMula.toISOString(),
    tarikhTamat: a.tarikhTamat?.toISOString() ?? null,
    petakStall: a.petakStall,
    catatan: a.catatan,
    status: a.status,
    vendorName: a.vendor.namaPerniagaan,
    marketName: a.market.namaPasar,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--accent-strong)]">Jadual pasar & tapak</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Urus lokasi pasar mengikut daerah Melaka dan jadualkan penjaja ke petak — tarikh tidak boleh lampau.
        </p>
      </div>
      <JadualPanel markets={markets} vendors={vendors} assignments={assignments} />
    </div>
  );
}
