import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const [vendorResult, marketResult, assignmentResult] = await Promise.all([
    supabase.from("vendor").select("id", { count: "exact", head: true }),
    supabase.from("market").select("id", { count: "exact", head: true }),
    supabase.from("assignment").select("id", { count: "exact", head: true }),
  ]);

  const bilPenjaja = vendorResult.count ?? 0;
  const bilTapak = marketResult.count ?? 0;
  const bilPenugasan = assignmentResult.count ?? 0;

  const cards = [
    { label: "Penjaja berdaftar", value: bilPenjaja, href: "/penjaja" },
    { label: "Tapak pasar", value: bilTapak, href: "/jadual" },
    { label: "Penugasan aktif / dijadual", value: bilPenugasan, href: "/jadual" },
  ];

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Pasar malam Melaka</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--accent-strong)]">Selamat datang ke PASAR-SMART</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Satu skrin untuk pentadbir: urus penjaja, jadualkan tapak di daerah seperti Bukit Beruang atau Melaka Tengah,
          dan muat turun ringkasan perniagaan berdasarkan data sebenar di pangkalan data.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/penjaja"
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-95"
          >
            Pengurusan penjaja
          </Link>
          <Link
            href="/jadual"
            className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface)]"
          >
            Jadual pasar & tapak
          </Link>
          <Link
            href="/laporan"
            className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface)]"
          >
            Laporan perniagaan
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--accent-strong)]">Ringkasan pantas</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)]"
            >
              <p className="text-sm text-[var(--muted)]">{c.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--accent-strong)]">{c.value}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
