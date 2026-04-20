"use client";

import { useState, useRef, useEffect } from "react";
import {
  processVendorRegistrationChat,
  completeVendorRegistration,
  getChatHistory,
  type CollectedData,
  type RegistrationState,
} from "@/actions/aiRegistration";
import { BUSINESS_CATEGORIES } from "@/lib/vendorConstants";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string }

// ── Step metadata ──────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Name",     hint: 'Business name, 3–50 chars · e.g. "Mee Goreng Haji Ali"'     },
  { label: "Category", hint: `Pick one: ${BUSINESS_CATEGORIES.join(" · ")}`                },
  { label: "Nickname", hint: 'How customers call you · e.g. "Pak Ali", "Kak Siti"'         },
  { label: "Phone",    hint: "Malaysian format: 012-3456789 or 011-12345678"               },
  { label: "Email",    hint: "Valid email · e.g. kedai@gmail.com"                          },
  { label: "Desc",     hint: "20–200 chars describing what you sell (not just 'food')"     },
  { label: "Price",    hint: 'Specific RM amount · e.g. "RM 5 – RM 20"'                   },
  { label: "Menu",     hint: "Up to 5 items with name + RM price · or say 'Skip'"         },
];

// Clickable suggestion chips per step
function getSuggestions(step: number): string[] {
  switch (step) {
    case 2:  return [...BUSINESS_CATEGORIES];
    case 7:  return ["RM 5 – RM 15", "RM 10 – RM 30", "RM 3 – RM 8", "RM 15 – RM 50"];
    case 8:  return ["Skip / Langkau", "Ya, ada menu"];
    default: return [];
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DataField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 transition-all ${value ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/8 bg-white/4"}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`text-[10px] font-bold ${value ? "text-emerald-400" : "text-white/25"}`}>{value ? "✓" : "○"}</span>
        <span className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">{label}</span>
      </div>
      {value
        ? <p className="text-xs text-white font-medium truncate">{value}</p>
        : <p className="text-[10px] text-white/20 italic">Not collected yet</p>
      }
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 150, 300].map((delay, i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-purple-400 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AIRegistrationChat() {
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [messages,            setMessages]            = useState<Message[]>([]);
  const [input,               setInput]               = useState("");
  const [loading,             setLoading]             = useState(false);
  const [regState,            setRegState]            = useState<RegistrationState | null>(null);
  const [isComplete,          setIsComplete]          = useState(false);
  const [registrationDone,    setRegistrationDone]    = useState(false);
  const [showSuccess,         setShowSuccess]         = useState(false);
  const [charCount,           setCharCount]           = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentStep = regState?.step ?? 1;
  const collected   = regState?.collected ?? null;
  const hint        = STEPS[(currentStep - 1) % STEPS.length]?.hint ?? "";
  const suggestions = getSuggestions(currentStep);

  // Init
  useEffect(() => {
    (async () => {
      const history = await getChatHistory(sessionId);
      if (history.length === 0) {
        setMessages([{
          role: "assistant",
          content:
            "Selamat datang ke Pasar Smart! 🎉 Saya **PasarBot** — pembantu pendaftaran penjaja anda.\n\n" +
            "Saya akan tanya soalan satu persatu dan pastikan semua maklumat anda adalah tepat dan lengkap. " +
            "Jika input anda tidak betul formatnya, saya akan beritahu kenapa dan berikan contoh yang betul.\n\n" +
            "Mari mulakan! Apakah **Nama Perniagaan** anda?\n*(3–50 aksara · contoh: \"Mee Goreng Haji Ali\")*",
        }]);
      } else {
        setMessages(history);
      }
    })();
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Track char count for desc step
  useEffect(() => {
    setCharCount(input.length);
  }, [input]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading || registrationDone) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await processVendorRegistrationChat(sessionId, msg, [...messages, userMsg]);
      if (res.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, ada ralat teknikal. Sila cuba lagi." }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: res.message }]);
        if (res.state)      setRegState(res.state);
        if (res.isComplete) setIsComplete(true);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Ralat teknikal. Sila cuba lagi." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    if (!collected) return;
    setLoading(true);
    try {
      const result = await completeVendorRegistration(sessionId, collected);
      if (result.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: `Ralat semasa mendaftar: ${result.error}` }]);
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content:
            `🎉 **Tahniah!** Pendaftaran anda berjaya!\n\nID Penjaja: \`${result.vendorId}\`\n\n` +
            (result.mock
              ? "Maklumat anda telah direkodkan. Sila hubungi pentadbir untuk pengesahan."
              : "Sila tunggu pengesahan dari pentadbir. Anda boleh mengurus gerai anda melalui portal vendor."),
        }]);
        setRegistrationDone(true);
        setShowSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  }

  // Filled-field count for progress (out of 7 required)
  const filledCount = collected
    ? [collected.namaPerniagaan, collected.jenisJualan, collected.namaPanggilan, collected.noTelefon, collected.email, collected.description, collected.priceRange]
        .filter(Boolean).length
    : 0;

  return (
    <div className="relative flex flex-col w-full h-full min-h-screen bg-gradient-to-br from-slate-950 via-[#1a0a2e] to-slate-950 overflow-hidden">

      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-600 opacity-[0.08] blur-3xl" />
        <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full bg-blue-600 opacity-[0.07] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-600 opacity-[0.07] blur-3xl" />
      </div>

      {/* ── Success overlay ── */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-slate-900 p-8 text-center shadow-2xl shadow-emerald-500/10">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">Pendaftaran Berjaya!</h2>
            <p className="mb-1 text-sm text-white/60">Bisnes anda telah didaftarkan dalam sistem Pasar Smart.</p>
            <p className="mb-6 text-xs text-purple-400">Sila tunggu pengesahan dari pentadbir.</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ── Layout ── */}
      <div className="relative z-10 flex h-full flex-col">

        {/* ── Header ── */}
        <div className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-xl shadow-lg shadow-purple-500/30">
                🤖
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-base font-bold text-transparent">
                  PasarBot
                </h1>
                <p className="text-[11px] text-purple-200/50">AI Vendor Registration · Powered by Llama 3.3</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/30">Step {currentStep}/8</p>
              <p className={`text-xs font-semibold ${registrationDone ? "text-emerald-400" : isComplete ? "text-green-400" : "text-amber-400"}`}>
                {registrationDone ? "✓ Selesai" : isComplete ? "⟳ Sila Sahkan" : `${filledCount}/7 collected`}
              </p>
            </div>
          </div>

          {/* Step progress bar */}
          <div className="flex items-end gap-1">
            {STEPS.map((s, i) => {
              const done   = i + 1 < currentStep;
              const active = i + 1 === currentStep;
              return (
                <div key={s.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`h-1 w-full rounded-full transition-all duration-500 ${done ? "bg-emerald-400" : active ? "bg-purple-400" : "bg-white/10"}`} />
                  <span className={`hidden text-[8px] font-bold sm:block transition-colors ${done ? "text-emerald-400" : active ? "text-purple-300" : "text-white/20"}`}>
                    {done ? "✓" : s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Body: Chat + Sidebar ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Chat area */}
          <div className="flex min-w-0 flex-1 flex-col">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 px-4 py-5" style={{ scrollbarWidth: "none" }}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {msg.role === "assistant" && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs">🤖</div>
                  )}
                  <div className={`max-w-[80%] lg:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20"
                      : "rounded-bl-sm border border-white/10 bg-white/8 text-purple-50 backdrop-blur-sm"
                  }`}>
                    {/* Render **bold** markers */}
                    {msg.content.split(/(\*\*[^*]+\*\*)/g).map((part, pi) =>
                      part.startsWith("**") && part.endsWith("**")
                        ? <strong key={pi} className="font-semibold">{part.slice(2, -2)}</strong>
                        : <span key={pi}>{part}</span>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs">👤</div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-end gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs">🤖</div>
                  <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="shrink-0 border-t border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl space-y-2">

              {/* Hint for current step */}
              {hint && !registrationDone && (
                <div className="flex items-start gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2">
                  <span className="mt-0.5 shrink-0 text-xs text-purple-400">💡</span>
                  <p className="text-[11px] text-purple-200/70 leading-relaxed">{hint}</p>
                </div>
              )}

              {/* Validation errors */}
              {regState?.validationErrors && regState.validationErrors.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
                  <span className="mt-0.5 shrink-0 text-xs text-red-400">⚠</span>
                  <div className="text-[11px] text-red-300/80 space-y-0.5">
                    {regState.validationErrors.map((e, i) => <p key={i}>{e}</p>)}
                  </div>
                </div>
              )}

              {/* Suggestion chips */}
              {!registrationDone && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      disabled={loading}
                      className="rounded-full border border-white/20 bg-white/8 px-3 py-1 text-xs text-purple-200 transition-all hover:border-purple-400/50 hover:bg-purple-500/20 hover:text-white disabled:opacity-30"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={registrationDone ? "Pendaftaran selesai ✓" : `Step ${currentStep}: ${STEPS[(currentStep-1) % STEPS.length]?.label}…`}
                    disabled={loading || registrationDone}
                    maxLength={currentStep === 6 ? 200 : undefined}
                    className="w-full rounded-xl border border-white/20 bg-white/8 px-4 py-2.5 text-sm text-white placeholder:text-purple-200/30 focus:border-purple-400/60 focus:outline-none focus:ring-1 focus:ring-purple-400/20 disabled:opacity-40 transition-all"
                  />
                  {/* Char counter for description step */}
                  {currentStep === 6 && input.length > 0 && (
                    <span className={`absolute right-3 bottom-2.5 text-[9px] font-semibold ${charCount < 20 ? "text-red-400" : charCount > 200 ? "text-red-400" : "text-emerald-400"}`}>
                      {charCount}/200
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim() || registrationDone}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:opacity-90 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {loading ? "⏳" : "→"}
                </button>
              </div>

              {/* Confirm registration button */}
              {isComplete && !registrationDone && (
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>✓</span>
                  <span>Sahkan &amp; Selesaikan Pendaftaran</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Live data panel (desktop) ── */}
          <div className="hidden w-72 shrink-0 flex-col gap-2 overflow-y-auto border-l border-white/10 bg-white/3 p-4 lg:flex">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-bold text-white/70">📋 Maklumat Terkumpul</p>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/40">{filledCount}/7</span>
            </div>

            {/* Progress ring */}
            <div className="mx-auto mb-1">
              <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="20" fill="none"
                  stroke={filledCount === 7 ? "#34d399" : "#a855f7"}
                  strokeWidth="4"
                  strokeDasharray={`${(filledCount / 7) * 125.6} 125.6`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
            </div>

            <DataField label="Nama Perniagaan" value={collected?.namaPerniagaan ?? null} />
            <DataField label="Jenis Jualan"    value={collected?.jenisJualan    ?? null} />
            <DataField label="Nama Panggilan"  value={collected?.namaPanggilan  ?? null} />
            <DataField label="No. Telefon"     value={collected?.noTelefon      ?? null} />
            <DataField label="Email"           value={collected?.email          ?? null} />
            <DataField label="Huraian"         value={collected?.description    ?? null} />
            <DataField label="Julat Harga"     value={collected?.priceRange     ?? null} />

            {collected?.menuItems && collected.menuItems.length > 0 && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold text-emerald-400">✓</span>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">Menu Items</span>
                </div>
                {collected.menuItems.map((m, i) => (
                  <p key={i} className="text-[11px] text-emerald-200">• {m.name} — RM {m.price}</p>
                ))}
              </div>
            )}

            {/* Missing fields */}
            {regState?.missingFields && regState.missingFields.length > 0 && !isComplete && (
              <div className="mt-1 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5">
                <p className="mb-1.5 text-[10px] font-bold text-amber-400">⏳ Masih diperlukan:</p>
                {regState.missingFields.map((f) => (
                  <p key={f} className="text-[10px] text-amber-300/60">· {f}</p>
                ))}
              </div>
            )}

            {isComplete && !registrationDone && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-center">
                <p className="text-xs font-bold text-emerald-400">✓ Semua maklumat lengkap!</p>
                <p className="text-[10px] text-emerald-300/70 mt-0.5">Klik butang sahkan di bawah</p>
              </div>
            )}

            {/* Guide */}
            <div className="mt-auto rounded-xl border border-white/8 bg-white/4 px-3 py-3 text-[10px] text-white/30 space-y-1 leading-relaxed">
              <p className="font-semibold text-white/40">📖 Format panduan:</p>
              <p>Phone: <span className="text-purple-300/60">012-3456789</span></p>
              <p>Email: <span className="text-purple-300/60">kedai@gmail.com</span></p>
              <p>Price: <span className="text-purple-300/60">RM 5 – RM 20</span></p>
              <p>Desc: <span className="text-purple-300/60">20–200 chars</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
