import { AIRegistrationChat } from "@/components/ai-registration-chat";

export const metadata = {
  title: "Pendaftaran Penjaja via AI - Pasar Smart",
  description: "Daftar sebagai penjaja menggunakan AI chatbot yang interaktif",
};

export default function DaftarAIPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <AIRegistrationChat />
    </div>
  );
}
