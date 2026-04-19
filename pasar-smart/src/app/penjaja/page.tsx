import { VendorsPanel, type VendorRow } from "@/components/vendors-panel";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function PenjajaPage() {
  const { data: rows } = await supabase
    .from("vendor")
    .select("*")
    .order("created_at", { ascending: false });

  const vendors: VendorRow[] = (rows ?? []).map((v) => ({
    id: v.id,
    namaPerniagaan: v.nama_perniagaan,
    namaPanggilan: v.nama_panggilan,
    noTelefon: v.no_telefon,
    email: v.email,
    jenisJualan: v.jenis_jualan,
    yuranHarianSen: v.yuran_harian_sen,
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
