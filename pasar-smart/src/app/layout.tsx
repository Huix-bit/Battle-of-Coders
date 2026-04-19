import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Shell } from "@/components/shell";
import type { UserRole } from "@/lib/authClient";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PASAR-SMART | Melaka Night Market Guide",
  description:
    "Manage vendors, schedule market sites by district, and download business reports for the Melaka community.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawRole = cookieStore.get("user-role")?.value;
  const validRoles: UserRole[] = ["admin", "vendor", "user"];
  const role: UserRole | null = validRoles.includes(rawRole as UserRole)
    ? (rawRole as UserRole)
    : null;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <Shell role={role}>{children}</Shell>
      </body>
    </html>
  );
}
