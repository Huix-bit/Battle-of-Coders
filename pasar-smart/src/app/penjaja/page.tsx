import { VendorsPanel, type VendorRow } from "@/components/vendors-panel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PenjajaPage() {
  const rows = await prisma.vendor.findMany({ orderBy: { createdAt: "desc" } });
  const vendors: VendorRow[] = rows.map((v) => ({
    id: v.id,
    namaPerniagaan: v.namaPerniagaan,
    namaPanggilan: v.namaPanggilan,
    noTelefon: v.noTelefon,
    email: v.email,
    jenisJualan: v.jenisJualan,
    yuranHarianSen: v.yuranHarianSen,
    status: v.status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--accent-strong)]">Pengurusan penjaja</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Daftar peniaga pasar malam — pantau yuran petak (RM) dan status operasi dengan peralihan yang terkawal.
        </p>
      </div>
      <VendorsPanel vendors={vendors} />
    </div>
  );
}
