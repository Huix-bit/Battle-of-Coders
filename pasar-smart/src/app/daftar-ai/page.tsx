import { AIRegistrationChat } from "@/components/ai-registration-chat";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Pendaftaran Penjaja via AI — PASAR-SMART",
  description: "Daftar sebagai penjaja menggunakan AI chatbot yang interaktif",
};

export default async function DaftarAIPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("user-role")?.value;

  if (role !== "vendor") {
    redirect("/vendor");
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <AIRegistrationChat />
    </div>
  );
}
