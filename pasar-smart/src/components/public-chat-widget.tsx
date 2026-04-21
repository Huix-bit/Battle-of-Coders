"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "Where are the night markets?",
  "Any flash sales now?",
  "What food is available?",
  "Is the market open tonight?",
];

export function PublicChatWidget() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Selamat datang! 🌙 Saya **PasarGuide** — tanya saya tentang pasar malam di Melaka, vendor, flash sale, atau apa-apa sahaja tentang Pasar Smart!",
    },
  ]);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!open && messages.length > 1) setUnread((n) => n + 1);
  }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: next.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "Maaf, cuba lagi." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Ralat teknikal. Sila cuba lagi." }]);
    } finally {
      setLoading(false);
    }
  }

  function renderContent(content: string) {
    return content.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );
  }

  return (
    <>
      {/* ── Floating button ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        aria-label="Open market assistant"
      >
        {open ? (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">🌙</span>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat panel ── */}
      <div
        className={`fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40 transition-all duration-300 ${
          open ? "w-80 opacity-100 translate-y-0 sm:w-96" : "w-0 opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{ height: "480px", background: "linear-gradient(160deg, #0f172a 0%, #1a0a2e 100%)" }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg shadow-lg">
            🌙
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">PasarGuide</p>
            <p className="text-[10px] text-amber-300/70">Live market assistant · Powered by AI</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 px-3 py-4" style={{ scrollbarWidth: "none" }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="mt-0.5 h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm">
                  🌙
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                  : "rounded-bl-sm border border-white/10 bg-white/8 text-white/90"
              }`}>
                {renderContent(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="mt-0.5 h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm">🌙</div>
              <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/8 px-4 py-3">
                <div className="flex gap-1">
                  {[0, 150, 300].map((d, i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions (shown when only welcome message) */}
        {messages.length === 1 && !loading && (
          <div className="shrink-0 flex flex-wrap gap-1.5 px-3 pb-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-300 transition-all hover:bg-amber-500/20"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-white/10 bg-white/5 px-3 py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about markets, food, flash sales…"
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-500/50 focus:bg-white/12 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
