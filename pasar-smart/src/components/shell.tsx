import Link from "next/link";
import { UserNav } from "@/components/user-nav";
import type { UserRole } from "@/lib/authClient";

const NAV_BY_ROLE: Record<UserRole, { href: string; label: string }[]> = {
  admin: [
    { href: "/admin", label: "Home" },
    { href: "/penjaja", label: "Vendor Management" },
    { href: "/jadual", label: "Market Schedule" },
    { href: "/laporan", label: "Reports" },
  ],
  vendor: [
    { href: "/vendor", label: "My Dashboard" },
    { href: "/jadual", label: "Market Schedule" },
  ],
  user: [
    { href: "/user", label: "Home" },
    { href: "/jadual", label: "Market Schedule" },
  ],
};

const PUBLIC_NAV = [{ href: "/", label: "Home" }];

interface ShellProps {
  children: React.ReactNode;
  role?: UserRole | null;
}

export function Shell({ children, role }: ShellProps) {
  const nav = role ? NAV_BY_ROLE[role] : PUBLIC_NAV;

  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={role ? `/${role}` : "/"} className="text-lg font-semibold tracking-tight text-[var(--accent-strong)]">
              PASAR-SMART
            </Link>
            <p className="text-sm text-[var(--muted)]">Melaka Night Market Guide — schedules &amp; vendors in one place</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            {role && <UserNav role={role} />}

            {!role && (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--card)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        Night markets, vendors &amp; stalls — local community of Melaka
      </footer>
    </div>
  );
}
