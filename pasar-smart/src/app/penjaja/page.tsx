import { VendorsPanel, type VendorRow } from "@/components/vendors-panel";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabaseClient";
import { MOCK_VENDORS } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export default async function PenjajaPage() {
  let vendors: VendorRow[] = MOCK_VENDORS;

  if (SUPABASE_CONFIGURED) {
    const { data: rows } = await supabase
      .from("vendor")
      .select("*")
      .order("created_at", { ascending: false });

    vendors = (rows ?? []).map((v) => ({
      id: v.id,
      namaPerniagaan: v.nama_perniagaan,
      namaPanggilan:  v.nama_panggilan,
      noTelefon:      v.no_telefon,
      email:          v.email,
      jenisJualan:    v.jenis_jualan,
      yuranHarianSen: v.yuran_harian_sen,
      status:         v.status,
    }));
  }

  return (
    <div className="space-y-6">
      {!SUPABASE_CONFIGURED && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
          <span className="text-lg">⚡</span>
          <span>
            <strong>Demo mode</strong> — changes will not be saved. Connect Supabase to enable full CRUD.
          </span>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Vendor Management</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Register night market traders — track stall fees (RM) and operating status with controlled transitions.
        </p>
      </div>
      <VendorsPanel vendors={vendors} />
    </div>
  );
}
