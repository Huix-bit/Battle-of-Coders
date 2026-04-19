"use client";

import { useState, useRef, useEffect } from "react";
import {
  processVendorRegistrationChat,
  completeVendorRegistration,
  getChatHistory,
} from "@/actions/aiRegistration";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ExtractedData {
  namaPerniagaan?: string;
  namaPanggilan?: string;
  noTelefon?: string;
  email?: string;
  jenisJualan?: string;
  description?: string;
  menuItems?: Array<{ name: string; price: number; description: string }>;
}

export function AIRegistrationChat() {
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [isComplete, setIsComplete] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const initChat = async () => {
      const history = await getChatHistory(sessionId);
      if (history.length === 0) {
        const welcomeMessage = {
          role: "assistant" as const,
          content:
            "Selamat datang ke Pasar Smart! 🎉 Saya adalah pemandu daftar untuk penjaja. Mari kita mulai dengan menceritakan tentang bisnes anda. Apakah nama perniagaan anda?",
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages(history);
      }
    };

    initChat();
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage() {
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Get AI response
      const response = await processVendorRegistrationChat(sessionId, input, [
        ...messages,
        userMessage,
      ]);

      if (response.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Maaf, ada ralat. Sila cuba lagi.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.message },
        ]);

        if (response.extractedData) {
          setExtractedData(response.extractedData);
        }

        if (response.isComplete) {
          setIsComplete(true);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ralat teknikal. Sila cuba lagi." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteRegistration() {
    setLoading(true);
    try {
      const result = await completeVendorRegistration(sessionId, extractedData);

      if (result.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Ralat: ${result.error}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `🎉 Tahniah! Pendaftaran anda berjaya. ID Penjaja: ${result.vendorId}. Sila tunggu untuk pengesahan.`,
          },
        ]);
        setRegistrationComplete(true);
        setShowSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 text-center transform transition-all duration-500 animate-scaleIn">
            <div className="mb-4 flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-4xl">✓</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Berjaya!</h2>
            <p className="text-gray-600 mb-4">Bisnes anda telah didaftarkan dalam sistem</p>
            <p className="text-sm text-purple-600 font-semibold mb-6">Terima kasih telah memilih Pasar Smart</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/10 border-b border-white/10 px-6 py-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-200">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Pasar Smart
                </h1>
                <p className="text-purple-200 text-sm">Pendaftaran via AI</p>
              </div>
            </div>
            <div className="text-right text-xs text-purple-300">
              <div className="font-semibold">Status</div>
              <div className={registrationComplete ? "text-green-400" : "text-yellow-400"}>
                {registrationComplete ? "✓ Selesai" : "⚙ Proses"}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="mb-4 text-6xl animate-bounce">👋</div>
              <h2 className="text-2xl font-bold text-white mb-2">Selamat Datang!</h2>
              <p className="text-purple-200 max-w-md mb-6">
                Ceritakan tentang bisnes anda secara semula jadi. AI saya akan membantu mengumpul maklumat yang diperlukan.
              </p>
              <div className="flex gap-2 text-xs text-purple-300">
                <span>💡 Petua: Gunakan Bahasa Malaysia atau Inggeris</span>
              </div>
            </div>
          ) : (
            messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-slideIn`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-2xl px-5 py-3 backdrop-blur-lg transition-all duration-300 hover:shadow-lg ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 rounded-br-none"
                      : "bg-white/10 text-purple-50 border border-white/20 rounded-bl-none hover:bg-white/20"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start animate-slideIn">
              <div className="bg-white/10 border border-white/20 backdrop-blur-lg rounded-2xl rounded-bl-none px-5 py-4 text-purple-100">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                  <span className="text-xs">Sedang mengetik...</span>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Data Display */}
          {Object.keys(extractedData).length > 0 && (
            <div className="mt-8 animate-slideIn">
              <div className="backdrop-blur-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">✓</span>
                  <p className="text-sm font-semibold text-green-300">Maklumat Dikumpul</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extractedData.namaPerniagaan && (
                    <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors duration-200">
                      <span className="text-xs text-green-300 uppercase tracking-wider">Nama Perniagaan</span>
                      <p className="font-semibold text-white mt-1">{extractedData.namaPerniagaan}</p>
                    </div>
                  )}
                  {extractedData.jenisJualan && (
                    <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors duration-200">
                      <span className="text-xs text-green-300 uppercase tracking-wider">Jenis Jualan</span>
                      <p className="font-semibold text-white mt-1">{extractedData.jenisJualan}</p>
                    </div>
                  )}
                  {extractedData.noTelefon && (
                    <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors duration-200">
                      <span className="text-xs text-green-300 uppercase tracking-wider">No. Telefon</span>
                      <p className="font-semibold text-white mt-1">{extractedData.noTelefon}</p>
                    </div>
                  )}
                  {extractedData.email && (
                    <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors duration-200">
                      <span className="text-xs text-green-300 uppercase tracking-wider">Email</span>
                      <p className="font-semibold text-white mt-1">{extractedData.email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="backdrop-blur-xl bg-white/10 border-t border-white/10 px-6 py-6 shadow-2xl">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={registrationComplete ? "Pendaftaran selesai" : "Ceritakan tentang bisnes anda..."}
                disabled={loading || registrationComplete}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-white placeholder:text-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"></div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim() || registrationComplete}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 backdrop-blur-lg"
            >
              {loading ? "⏳" : "Hantar"}
            </button>
          </div>

          {isComplete && !registrationComplete && (
            <button
              onClick={handleCompleteRegistration}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/50 disabled:opacity-50 transform hover:scale-105 transition-all duration-200 backdrop-blur-lg flex items-center justify-center gap-2"
            >
              <span>✓</span>
              <span>Selesaikan Pendaftaran</span>
            </button>
          )}

          {registrationComplete && (
            <div className="text-center text-green-300 text-sm font-semibold">
              ✓ Pendaftaran berjaya! Terima kasih telah memilih Pasar Smart.
            </div>
          )}
        </div>
      </div>

      {/* Add custom animations in global CSS */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
