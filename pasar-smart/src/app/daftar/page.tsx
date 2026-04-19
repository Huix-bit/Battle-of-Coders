import { RegisterForm } from "@/components/register-form";

export const metadata = {
  title: "Daftar | PASAR-SMART",
};

export default function DaftarPage() {
  return (
    <div className="space-y-6">
      <RegisterForm />
    </div>
  );
}
