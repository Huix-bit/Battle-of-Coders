import Link from "next/link";

const nav = [
  { href: "/", label: "Utama" },
  { href: "/penjaja", label: "Pengurusan penjaja" },
  { href: "/jadual", label: "Jadual pasar & tapak" },
  { href: "/laporan", label: "Laporan perniagaan" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--accent-strong)]">
              PASAR-SMART
            </Link>
            <p className="text-sm text-[var(--muted)]">Pemandu pasar malam Melaka — jadual & penjaja di satu tempat</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-transparent px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--border)] hover:bg-[var(--card)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        Pasar malam, penjaja & tapak — istilah tempatan untuk komuniti Melaka
      </footer>
    </div>
  );
}
