"use client";

export function FormMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-[#E8342A]/40 bg-[#E8342A]/10 px-3 py-2 text-sm text-[#E8342A]">
      {message}
    </p>
  );
}
