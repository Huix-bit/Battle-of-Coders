"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface NavItem { href: string; label: string }

export function NavClient({ items, role }: { items: NavItem[]; role?: string | null }) {
  const pathname  = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef   = useRef<HTMLDivElement>(null);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  function isActive(href: string) {
    // Exact match for root-level role home (e.g. "/user", "/admin")
    const isRoleHome = href === "/" || href === `/${role}`;
    if (isRoleHome) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="relative flex items-center" ref={wrapRef}>

      {/* ── Desktop nav ── */}
      <nav className="hidden items-center gap-0.5 sm:flex">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-[var(--raised)] text-[var(--accent)]"
                  : "text-[var(--secondary)] hover:bg-[var(--raised)]/70 hover:text-[var(--text)]"
              }`}
            >
              {item.label}
              {/* Active underline dot */}
              {active && (
                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--lifted)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:bg-[var(--raised)] hover:text-[var(--text)] transition-all"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* ── Mobile dropdown drawer ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div
            className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-2xl border border-[var(--border)] bg-[var(--abyss)] p-2 shadow-2xl shadow-black/60 sm:hidden"
            style={{ animation: "fade-up 0.18s ease-out both" }}
          >
            <nav className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm transition-all ${
                      active
                        ? "bg-[var(--raised)] font-semibold text-[var(--accent)]"
                        : "text-[var(--secondary)] hover:bg-[var(--raised)]/60 hover:text-[var(--text)]"
                    }`}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
