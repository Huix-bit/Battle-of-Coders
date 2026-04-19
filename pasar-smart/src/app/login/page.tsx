import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Log masuk | PASAR-SMART",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="sr-only">Log masuk</h1>
      </div>
      <Suspense fallback={<p className="text-center text-sm text-[var(--muted)]">Memuatkan…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
