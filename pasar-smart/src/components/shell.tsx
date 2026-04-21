import Link from "next/link";
import { UserNav } from "@/components/user-nav";
import { NavClient } from "@/components/NavClient";
import type { UserRole } from "@/lib/authClient";

const NAV_BY_ROLE: Record<UserRole, { href: string; label: string }[]> = {
  admin: [
    { href: "/admin",            label: "Home"       },
    { href: "/admin/monitor",    label: "📡 Monitor"  },
    { href: "/admin/analytics",  label: "📊 Analytics"},
    { href: "/admin/layout",     label: "🗺️ Layout"   },
    { href: "/penjaja",          label: "Vendors"     },
    { href: "/laporan",          label: "Reports"     },
  ],
  vendor: [
    { href: "/vendor",           label: "Overview"    },
    { href: "/vendor/dashboard", label: "📊 Hub"      },
    { href: "/vendor/layout",    label: "🗺️ Market Map"},
    { href: "/vendor/tools",     label: "🛠️ Tools"    },
    { href: "/daftar-ai",        label: "🤖 AI Chat"  },
    { href: "/jadual",           label: "Schedule"    },
  ],
  user: [
    { href: "/user",             label: "Home"        },
    { href: "/user/discover",    label: "🔍 Discover" },
    { href: "/user/map",         label: "🗺️ Live Map" },
    { href: "/user/cart",        label: "🛒 Cart"     },
    { href: "/user/profile",     label: "👤 Profile"  },
  ],
};

const PUBLIC_NAV = [
  { href: "/",         label: "Home"     },
  { href: "/live-map", label: "Live Map" },
];

const FOOTER_FEATURES = [
  "🔍 Intelligent Stall Discovery",
  "🗺️ Live Crowd Heatmap",
  "🛒 Multi-vendor Cart",
  "🚗 Pasar-Drive Pickup",
  "🤖 AI Vendor Registration",
  "📊 Real-time Analytics",
];

interface ShellProps {
  children: React.ReactNode;
  role?: UserRole | null;
}

export function Shell({ children, role }: ShellProps) {
  const nav = role ? NAV_BY_ROLE[role] : PUBLIC_NAV;

  return (
    <div className="flex min-h-full flex-col bg-[var(--bg)] text-[var(--text)]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--abyss)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">

          {/* Logo */}
          <Link
            href={role ? `/${role}` : "/"}
            className="group flex shrink-0 flex-col leading-none"
          >
            <span className="bg-gradient-to-r from-[var(--accent)] to-[#F0C97A] bg-clip-text text-[15px] font-bold tracking-widest text-transparent transition-opacity group-hover:opacity-80">
              PASAR-SMART
            </span>
            <span className="mt-0.5 hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)] sm:block">
              Melaka Night Market
            </span>
          </Link>

          {/* Right side: nav + auth */}
          <div className="flex items-center gap-2">
            <NavClient items={nav} role={role} />

            {nav.length > 0 && (
              <span className="mx-1.5 hidden h-4 w-px bg-[var(--border)] sm:block" />
            )}

            {role && <UserNav role={role} />}

            {!role && (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--secondary)] transition-all hover:bg-[var(--raised)] hover:text-[var(--text)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-[var(--abyss)] transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[var(--accent)]/20"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 animate-fade-in">
        {children}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-[var(--border-subtle)] bg-[var(--abyss)]/60">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid gap-10 sm:grid-cols-3">

            {/* Brand column */}
            <div>
              <span className="bg-gradient-to-r from-[var(--accent)] to-[#F0C97A] bg-clip-text text-sm font-bold tracking-widest text-transparent">
                PASAR-SMART
              </span>
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                Intelligent night market management for the Melaka community — connecting vendors, buyers, and administrators in real time.
              </p>
              <div className="mt-4 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-400/80">Market open tonight · 6 PM – 12 AM</span>
              </div>
            </div>

            {/* Portal links */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Quick access</p>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/",        label: "Home"              },
                  { href: "/login",   label: "Sign In"           },
                  { href: "/signup",  label: "Create Account"    },
                  { href: "/user",    label: "Buyer Portal"      },
                  { href: "/vendor",  label: "Vendor Portal"     },
                  { href: "/admin",   label: "Admin Dashboard"   },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-xs text-[var(--secondary)] transition-colors hover:text-[var(--accent)]"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Features</p>
              <div className="flex flex-col gap-2">
                {FOOTER_FEATURES.map((f) => (
                  <p key={f} className="text-xs text-[var(--secondary)]">{f}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-6 sm:flex-row">
            <p className="text-[11px] text-[var(--muted)]">
              © 2025 Pasar Smart · Built for Melaka Night Market vendors &amp; community
            </p>
            <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
              <span>Powered by Groq · LLaMA 3.3</span>
              <span className="h-3 w-px bg-[var(--border)]" />
              <span>Stripe Payments</span>
              <span className="h-3 w-px bg-[var(--border)]" />
              <span>Supabase</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
