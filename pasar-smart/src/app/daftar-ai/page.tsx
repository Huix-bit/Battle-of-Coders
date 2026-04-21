import { AIRegistrationChat } from "@/components/ai-registration-chat";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Pendaftaran Penjaja via AI — PASAR-SMART",
  description: "Daftar sebagai penjaja menggunakan AI chatbot yang interaktif",
};

export default async function DaftarAIPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("user-role")?.value;

  // Redirect non-vendors to login so they can authenticate first
  if (!role) {
    redirect("/login");
  }

  if (role !== "vendor") {
    redirect("/vendor");
  }

  return (
    /*
     * Pull the chat out of the shell's px-4 py-8 padding and fill the space
     * between the sticky header (~60px) and the bottom of the viewport.
     * The negative margins cancel the shell's padding so the chat reaches edge-to-edge.
     */
    <div className="-mx-4 -my-8 flex flex-col" style={{ height: "calc(100vh - 60px)" }}>
      {/* Slim back-link bar */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[var(--abyss)]/80 border-b border-[var(--border-subtle)]">
        <Link
          href="/vendor"
          className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Back to Vendor Portal
        </Link>
      </div>
      {/* Chat fills the remaining space */}
      <div className="flex-1 overflow-hidden">
        <AIRegistrationChat />
      </div>
    </div>
  );
}
