import { NextRequest, NextResponse } from "next/server";

type UserRole = "admin" | "vendor" | "user";

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: "/admin",
  vendor: "/vendor",
  user: "/user",
};

// Routes that require a specific role to access
const PROTECTED_PREFIXES: { prefix: string; requiredRole: UserRole }[] = [
  { prefix: "/admin", requiredRole: "admin" },
  { prefix: "/vendor", requiredRole: "vendor" },
  { prefix: "/user", requiredRole: "user" },
  // Admin-only management pages
  { prefix: "/penjaja", requiredRole: "admin" },
  { prefix: "/laporan", requiredRole: "admin" },
];

// /jadual is accessible to all authenticated users
const AUTH_REQUIRED_PREFIXES = ["/jadual"];

// Public paths that do not require auth (including the landing page)
const PUBLIC_PATHS = ["/", "/login", "/signup", "/api"];

function getRole(req: NextRequest): UserRole | null {
  const raw = req.cookies.get("user-role")?.value;
  if (raw === "admin" || raw === "vendor" || raw === "user") return raw;
  return null;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const role = getRole(req);

  // Redirect authenticated users away from /login, /signup, and / to their dashboard
  if ((pathname === "/login" || pathname === "/signup" || pathname === "/") && role) {
    return NextResponse.redirect(new URL(ROLE_ROUTES[role], req.url));
  }

  // Role-specific protected routes
  for (const { prefix, requiredRole } of PROTECTED_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      if (!role) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (role !== requiredRole) {
        return NextResponse.redirect(new URL(ROLE_ROUTES[role], req.url));
      }
      return NextResponse.next();
    }
  }

  // Auth-required routes (all roles)
  for (const prefix of AUTH_REQUIRED_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      if (!role) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
