"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabaseClient";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ExtractedVendorData {
  namaPerniagaan?: string;
  namaPanggilan?: string;
  noTelefon?: string;
  email?: string;
  jenisJualan?: string;
  description?: string;
  menuItems?: Array<{ name: string; price: number; description: string }>;
}

interface ChatResponse {
  message: string;
  extractedData?: ExtractedVendorData;
  isComplete?: boolean;
  error?: string;
}

// System prompt for vendor registration assistant
const VENDOR_REGISTRATION_SYSTEM_PROMPT = `You are a friendly and helpful AI assistant for a night market (pasar malam) vendor registration system called Pasar Smart.

Your role is to help vendors register by collecting information about their business through natural conversation. Be conversational, friendly, and use Malay/English naturally.

Key information to collect:
1. Business name (Nama Perniagaan)
2. Vendor nickname (Nama Panggilan)
3. Phone number (No. Telefon)
4. Email
5. Type of business/products (Jenis Jualan) - e.g., "kuih", "minuman", "pakaian"
6. Description of their products
7. Sample menu items with prices (optional but helpful)

Guidelines:
- Ask ONE or TWO questions at a time, not all at once
- Be encouraging and positive
- If the vendor provides multiple pieces of information, acknowledge them
- When you have enough information, summarize it and confirm
- Extract structured data in your responses using the pattern: [EXTRACT: fieldname=value]
- Use a mix of Malay and English naturally
- If the user provides incomplete info, politely ask for clarification

Example conversation flow:
1. Greet and introduce the registration process
2. Ask about business name
3. Ask about type of business
4. Ask for contact details
5. Ask for a brief description
6. Ask if they want to add menu items
7. Summarize everything and confirm
8. Congratulate them on completion`;

export async function processVendorRegistrationChat(
  sessionId: string,
  userMessage: string,
  previousMessages: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Build full conversation history with system prompt
    const fullHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [
      {
        role: "user",
        parts: [{ text: VENDOR_REGISTRATION_SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: "Selamat datang ke Pasar Smart! 🎉 Saya adalah pemandu daftar untuk penjaja. Mari kita mulai dengan menceritakan tentang bisnes anda. Apakah nama perniagaan anda?" }],
      },
    ];

    // Add previous messages to history
    for (const msg of previousMessages) {
      fullHistory.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    // Add current user message
    fullHistory.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    // Send to Gemini
    const result = await model.generateContent({
      contents: fullHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const assistantMessage = result.response.text();

    // Extract structured data from the response
    const extractedData = extractVendorData(assistantMessage);

    // Save chat messages to database
    await saveChatMessages(sessionId, userMessage, assistantMessage);

    // Check if registration seems complete
    const isComplete = checkRegistrationComplete(extractedData, messages);

    return {
      message: assistantMessage,
      extractedData,
      isComplete,
    };
  } catch (error) {
    console.error("Error processing vendor chat:", error);
    return {
      message: "Maaf, ada ralat. Sila cuba lagi.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function extractVendorData(message: string): ExtractedVendorData {
  const data: ExtractedVendorData = {};

  // Simple pattern matching for extracted data
  const patterns = {
    namaPerniagaan: /nama perniagaan[:\s]+([^\n,]+)/i,
    noTelefon: /no\.?\s*telef[o0]n[:\s]+([0-9\-\s]+)/i,
    email: /email[:\s]+([^\s]+@[^\s]+)/i,
    jenisJualan: /jenis jualan[:\s]+([^\n,]+)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = message.match(pattern);
    if (match?.[1]) {
      data[key as keyof ExtractedVendorData] = match[1].trim();
    }
  }

  return data;
}

function checkRegistrationComplete(
  extractedData: ExtractedVendorData,
  messages: ChatMessage[]
): boolean {
  // Check if we have minimum required info
  const hasMinimumInfo =
    extractedData.namaPerniagaan &&
    extractedData.noTelefon &&
    extractedData.jenisJualan;

  // Check if conversation indicates completion
  const lastMessage = messages[messages.length - 1]?.content || "";
  const completionIndicators = [
    /complete/i,
    /selesai/i,
    /done/i,
    /sudah/i,
    /confirm/i,
    /setuju/i,
  ];

  const hasCompletionSignal = completionIndicators.some((pattern) =>
    pattern.test(lastMessage)
  );

  return hasMinimumInfo && (messages.length > 6 || hasCompletionSignal);
}

async function saveChatMessages(
  sessionId: string,
  userMessage: string,
  assistantMessage: string
): Promise<void> {
  try {
    // Save user message
    await supabase.from("chat_message").insert({
      id: `${sessionId}-user-${Date.now()}`,
      session_id: sessionId,
      role: "USER",
      content: userMessage,
    });

    // Save assistant message
    await supabase.from("chat_message").insert({
      id: `${sessionId}-assistant-${Date.now()}`,
      session_id: sessionId,
      role: "ASSISTANT",
      content: assistantMessage,
    });
  } catch (error) {
    console.error("Error saving chat messages:", error);
    // Don't throw - chat should continue even if saving fails
  }
}

export async function completeVendorRegistration(
  sessionId: string,
  extractedData: ExtractedVendorData
): Promise<{ vendorId: string; error?: string }> {
  try {
    // Create new vendor
    const { data, error } = await supabase
      .from("vendor")
      .insert({
        id: `vendor-${Date.now()}`,
        nama_perniagaan: extractedData.namaPerniagaan || "Unnamed",
        nama_panggilan: extractedData.namaPanggilan,
        no_telefon: extractedData.noTelefon,
        email: extractedData.email,
        jenis_jualan: extractedData.jenisJualan || "General",
        status: "ACTIVE",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create vendor");
    }

    // Save registration state
    await supabase.from("registration_state").update({
      vendor_id: data.id,
      stage: "COMPLETE",
      is_completed: true,
      extracted_data: extractedData,
    })
      .eq("session_id", sessionId);

    return { vendorId: data.id };
  } catch (error) {
    console.error("Error completing vendor registration:", error);
    return {
      vendorId: "",
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

export async function getRegistrationState(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("registration_state")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching registration state:", error);
    return null;
  }
}

export async function getChatHistory(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("chat_message")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true });

    if (error) throw error;

    return data?.map((msg) => ({
      role: msg.role.toLowerCase() as "user" | "assistant",
      content: msg.content,
    })) || [];
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
}
