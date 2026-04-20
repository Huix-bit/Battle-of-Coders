"use server";

import Groq from "groq-sdk";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Admin client for writes (bypasses RLS). Falls back to anon client if not configured.
const db = supabaseAdmin ?? supabase;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Shared types ─────────────────────────────────────────────────────────────
export interface MenuItem { name: string; price: number }

export interface CollectedData {
  namaPerniagaan: string | null;
  namaPanggilan:  string | null;
  noTelefon:      string | null;
  email:          string | null;
  jenisJualan:    string | null;
  description:    string | null;
  priceRange:     string | null;
  menuItems:      MenuItem[];
}

export interface RegistrationState {
  step:             number;          // 1–8
  collected:        CollectedData;
  validationErrors: string[];        // errors for the CURRENT turn
  missingFields:    string[];        // field names still missing
  isComplete:       boolean;         // true when steps 1–7 all valid & confirmed
}

interface ChatMessage { role: "user" | "assistant"; content: string }

export interface ChatResponse {
  message:    string;
  state?:     RegistrationState;
  isComplete: boolean;
  error?:     string;
}


// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are PasarBot, a strict but warm AI registration assistant for Pasar Smart — a Malaysian night-market management system.

YOUR GOAL: Collect 7 required pieces of information from the vendor ONE step at a time, validating EVERY input before proceeding.

══════════════════════════════════════════════════════
REGISTRATION STEPS (follow this exact order):
══════════════════════════════════════════════════════
Step 1 — Nama Perniagaan (Business Name)
  Rules: 3–50 characters. No special symbols (@#$%^&*). Must be meaningful.
  Example: "Mee Goreng Haji Ali", "Ayam Percik Siti"

Step 2 — Jenis Jualan (Business Category)
  Rules: MUST be EXACTLY one of these words (case-insensitive):
  Noodles | Rice | Grilled | Drinks | Kuih | Fruits | Seafood | Snacks | Clothing | Others
  If unclear, show the full list and ask to pick one.

Step 3 — Nama Panggilan (Vendor Nickname)
  Rules: 2–30 characters. What customers call you.
  Example: "Pak Ali", "Kak Siti", "Along"

Step 4 — No. Telefon (Phone Number)
  Rules: Malaysian mobile format ONLY.
    - Must start with 01
    - 01X-XXXXXXX  (10 digits total, e.g. 012-3456789)
    - 01X-XXXXXXXX (11 digits total, e.g. 011-12345678)
  Reject anything not matching. Show this example: "012-3456789 atau 011-12345678"

Step 5 — Email
  Rules: Must contain @ and a valid domain with a dot (e.g. .com, .my).
  Example: "kedai@gmail.com", "penjaja@yahoo.com"
  Reject: "none", "tiada", "no email", or anything without @ and a domain.

Step 6 — Huraian Perniagaan (Business Description)
  Rules: 20–200 characters. Must describe WHAT they sell specifically.
  Tell the vendor their exact character count if they are under/over.
  Reject vague answers like "jual makanan" (too short/vague).

Step 7 — Julat Harga (Price Range) — REQUIRED
  Rules: Must mention RM and specific numbers.
  Example: "RM 5 – RM 20", "from RM 3", "RM 8 per portion"
  Reject: "murah", "cheap", "berpatutan", or any vague answer.

Step 8 — Menu Items (OPTIONAL)
  Rules: Up to 5 items. Each must have a name AND a price in RM.
  If vendor says "skip", "no", "takde", or "langkau" — that is acceptable.

══════════════════════════════════════════════════════
STRICT VALIDATION RULES:
══════════════════════════════════════════════════════
- NEVER accept and move forward if the input fails validation.
- When rejecting: say WHY it failed and show a CORRECT EXAMPLE.
- When accepting: briefly praise the input, then ask for the NEXT field.
- Ask ONLY ONE question per response.
- After all 7 required steps are collected and user confirms, set isComplete: true.

══════════════════════════════════════════════════════
MANDATORY RESPONSE FORMAT:
══════════════════════════════════════════════════════
After EVERY response (no exceptions), append this JSON block EXACTLY:

[JSON_DATA]
{
  "step": <integer 1–8>,
  "collected": {
    "namaPerniagaan": <string or null>,
    "namaPanggilan":  <string or null>,
    "noTelefon":      <string or null>,
    "email":          <string or null>,
    "jenisJualan":    <string or null>,
    "description":    <string or null>,
    "priceRange":     <string or null>,
    "menuItems":      []
  },
  "validationErrors": [],
  "missingFields": ["list", "of", "field", "names", "not", "yet", "collected"],
  "isComplete": false
}
[/JSON_DATA]

Rules for the JSON:
- Always include ALL fields; use null for not-yet-collected.
- validationErrors: list reasons the CURRENT input was rejected (empty if valid).
- missingFields: list field keys that are still null/uncollected.
- isComplete: set true ONLY when steps 1–7 are all valid AND user has confirmed.
- Keep the JSON minimal and valid — no comments, no trailing commas.

══════════════════════════════════════════════════════
LANGUAGE & TONE:
══════════════════════════════════════════════════════
- Natural mix of Bahasa Malaysia and English.
- Friendly and encouraging, but FIRM and precise on validation.
- Use **bold** for field names and examples.
- Keep conversational replies short (2–4 sentences max before asking the question).`;

// ── JSON extraction ───────────────────────────────────────────────────────────
function extractJsonBlock(raw: string): { cleanMessage: string; state: RegistrationState | null } {
  const match = raw.match(/\[JSON_DATA\]([\s\S]*?)\[\/JSON_DATA\]/);
  const cleanMessage = raw.replace(/\[JSON_DATA\][\s\S]*?\[\/JSON_DATA\]/g, "").trim();
  if (!match) return { cleanMessage, state: null };
  try {
    const parsed = JSON.parse(match[1].trim());
    // Ensure menuItems is always an array
    if (parsed.collected && !Array.isArray(parsed.collected.menuItems)) {
      parsed.collected.menuItems = [];
    }
    return { cleanMessage, state: parsed as RegistrationState };
  } catch {
    return { cleanMessage, state: null };
  }
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function saveChatMessages(sessionId: string, userMsg: string, assistantMsg: string) {
  if (!db) return;
  try {
    await db.from("chat_message").insert([
      { id: `${sessionId}-u-${Date.now()}`,  session_id: sessionId, role: "USER",      content: userMsg      },
      { id: `${sessionId}-a-${Date.now()+1}`,session_id: sessionId, role: "ASSISTANT", content: assistantMsg },
    ]);
  } catch (e) {
    console.error("saveChatMessages error:", e);
  }
}

// ── Main server action ────────────────────────────────────────────────────────
export async function processVendorRegistrationChat(
  sessionId: string,
  userMessage: string,
  previousMessages: ChatMessage[] = [],
): Promise<ChatResponse> {
  try {
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...previousMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: userMessage },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 800,
      temperature: 0.45, // lower = more consistent JSON formatting
    });

    const raw = completion.choices[0]?.message?.content ?? "Maaf, tiada respons.";
    const { cleanMessage, state } = extractJsonBlock(raw);

    // Persist full raw (including JSON block) so history stays intact
    await saveChatMessages(sessionId, userMessage, raw);

    return {
      message:    cleanMessage,
      state:      state ?? undefined,
      isComplete: state?.isComplete ?? false,
    };
  } catch (error) {
    console.error("Groq error:", error);
    return {
      message:    "Maaf, ada ralat teknikal. Sila cuba lagi.",
      isComplete: false,
      error:      error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ── Complete registration (write to Supabase) ─────────────────────────────────
export async function completeVendorRegistration(
  sessionId: string,
  collected: CollectedData,
): Promise<{ vendorId: string; mock?: boolean; error?: string }> {
  const vendorId = `vendor-${Date.now()}`;

  // If no DB client is available, return a mock success so the demo still works
  if (!db) {
    console.warn("completeVendorRegistration: no DB client — returning mock success");
    return { vendorId, mock: true };
  }

  try {
    const { data, error } = await db
      .from("vendor")
      .insert({
        id:               vendorId,
        nama_perniagaan:  collected.namaPerniagaan ?? "Unnamed",
        nama_panggilan:   collected.namaPanggilan,
        no_telefon:       collected.noTelefon,
        email:            collected.email,
        jenis_jualan:     collected.jenisJualan ?? "General",
        status:           "DRAFT",
        updated_at:       new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // RLS or permission error — fall back to mock so the UI flow completes
      const isRls = error.message?.toLowerCase().includes("row-level security") ||
                    error.message?.toLowerCase().includes("policy");
      if (isRls) {
        console.warn("completeVendorRegistration: RLS blocked insert — returning mock success. " +
          "Fix: add SUPABASE_SERVICE_ROLE_KEY to .env.local");
        return { vendorId, mock: true };
      }
      throw new Error(error.message);
    }

    if (!data) throw new Error("No data returned after insert");

    // Best-effort update on registration_state (non-fatal if it fails)
    await db
      .from("registration_state")
      .update({ vendor_id: data.id, stage: "COMPLETE", is_completed: true, extracted_data: collected })
      .eq("session_id", sessionId)
      .then(({ error: e }) => { if (e) console.warn("registration_state update:", e.message); });

    return { vendorId: data.id };
  } catch (error) {
    console.error("completeVendorRegistration error:", error);
    return { vendorId: "", error: error instanceof Error ? error.message : "Registration failed" };
  }
}

// ── Fetch chat history ────────────────────────────────────────────────────────
export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  if (!db) return [];
  try {
    const { data, error } = await db
      .from("chat_message")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((msg) => ({
      role:    msg.role.toLowerCase() as "user" | "assistant",
      // Strip JSON blocks from history so the UI shows clean messages
      content: msg.content.replace(/\[JSON_DATA\][\s\S]*?\[\/JSON_DATA\]/g, "").trim(),
    }));
  } catch {
    return [];
  }
}
