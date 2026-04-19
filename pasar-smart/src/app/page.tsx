import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
    <>
      {/* Hero Section */}
      <div className="relative mb-12 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-12 shadow-sm">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" style={{ animationName: "blob", animationDuration: "7s", animationIterationCount: "infinite", animationDelay: "2s" }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Pasar Smart
            </h1>
          </div>
          <p className="text-lg text-[var(--accent-strong)] mb-2">Platform Malam Pasar Pintar</p>
          <p className="max-w-2xl text-[var(--muted)] mb-6">
            Daftarkan bisnes anda dengan mudah menggunakan AI. Tingkatkan penjualan dengan alat-alat pintar, flash sales, dan analitik real-time.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/daftar-ai"
              className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
              <span>🤖</span>
              <span>Daftar via AI</span>
            </Link>
            <Link
              href="/penjaja"
              className="rounded-lg border border-[var(--border)] px-6 py-3 font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition-all duration-200"
            >
              Kelola Penjaja
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
    </>
  );
}
