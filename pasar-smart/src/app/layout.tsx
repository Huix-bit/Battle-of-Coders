import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Shell } from "@/components/shell";
import { getSessionProfile } from "@/lib/auth";
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
  title: "PASAR-SMART | Pemandu pasar malam Melaka",
  description:
    "Pengurusan penjaja, jadual tapak pasar mengikut daerah, dan laporan agregat untuk komuniti Melaka.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionProfile();
  return (
    <html lang="ms" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <Shell user={user}>{children}</Shell>
      </body>
    </html>
  );
}
