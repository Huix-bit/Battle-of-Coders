import Link from "next/link";
import type { SessionProfile } from "@/lib/sessionTypes";
import { LogoutButton } from "./logout-button";

const mainNav = [
  { href: "/", label: "Utama" },
  { href: "/penjaja", label: "Pengurusan penjaja" },
  { href: "/jadual", label: "Jadual pasar & tapak" },
  { href: "/laporan", label: "Laporan perniagaan" },
];

export function Shell({
  user,
  children,
}: {
  user: SessionProfile | null;
  children: React.ReactNode;
}) {
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
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {user ? (
                <>
                  <span className="text-xs text-[var(--muted)]">
                    {user.email} · {user.role}
                  </span>
                  {user.role === "ADMIN" ? (
                    <Link
                      href="/admin"
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--card)]"
                    >
                      Pentadbir
                    </Link>
                  ) : null}
                  {(user.role === "ADMIN" || user.role === "VENDOR") && (
                    <Link
                      href="/gerai"
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--card)]"
                    >
                      Gerai
                    </Link>
                  )}
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--card)]"
                  >
                    Log masuk
                  </Link>
                  <Link
                    href="/daftar"
                    className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-95"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
            <nav className="flex flex-wrap justify-end gap-2">
              {mainNav.map((item) => (
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        Pasar malam, penjaja & tapak — istilah tempatan untuk komuniti Melaka
      </footer>
    </div>
  );
}
