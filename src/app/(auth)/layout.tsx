export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mx-4 -my-8 flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-16">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 left-1/3 h-[480px] w-[480px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 h-[360px] w-[360px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(115,92,200,0.09) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(var(--lavender) 1px, transparent 1px), linear-gradient(90deg, var(--lavender) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md" style={{ animation: "fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
        {children}
      </div>
    </div>
  );
}
