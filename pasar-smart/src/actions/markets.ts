"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin, ADMIN_CONFIGURED } from "@/lib/supabaseAdmin";
import { canTransitionMarket } from "@/lib/status";
import {
  formatZodError,
  marketCreateSchema,
  marketUpdateSchema,
} from "@/lib/validations";
import type { ActionState } from "./types";

const db = supabaseAdmin ?? supabase;

export async function createMarket(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    namaPasar: String(formData.get("namaPasar") ?? ""),
    daerah: String(formData.get("daerah") ?? ""),
    alamat: String(formData.get("alamat") ?? ""),
    hariOperasi: String(formData.get("hariOperasi") ?? ""),
  };
  const parsed = marketCreateSchema.safeParse(raw);
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  if (!ADMIN_CONFIGURED) {
    return {
      error:
        "Market site could not be saved because the Supabase service role key is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local or allow authenticated insert policy for the market table.",
    };
  }

  try {
    const { error } = await db.from("market").insert([
      {
        nama_pasar: parsed.data.namaPasar,
        daerah: parsed.data.daerah,
        alamat: parsed.data.alamat || null,
        hari_operasi: parsed.data.hariOperasi || null,
        status: "DIRANCANG",
      },
    ]);

    if (error) {
      const isRls =
        error.message?.toLowerCase().includes("row-level security") ||
        error.message?.toLowerCase().includes("policy");
      return {
        error: isRls
          ? "Market site could not be saved. Add SUPABASE_SERVICE_ROLE_KEY in .env.local or allow insert policy for the market table."
          : error.message,
      };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menyimpan tapak pasar" };
  }
  revalidatePath("/jadual");
  return { error: null, ok: true };
}

export async function updateMarket(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    id: String(formData.get("id") ?? ""),
    namaPasar: String(formData.get("namaPasar") ?? ""),
    daerah: String(formData.get("daerah") ?? ""),
    alamat: String(formData.get("alamat") ?? ""),
    hariOperasi: String(formData.get("hariOperasi") ?? ""),
    status: String(formData.get("status") ?? ""),
  };
  const parsed = marketUpdateSchema.safeParse(raw);
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  const { data: existing, error: existingError } = await db
    .from("market")
    .select("*")
    .eq("id", parsed.data.id)
    .single();

  if (existingError) return { error: existingError.message };
  if (!existing) return { error: "Tapak pasar tidak dijumpai" };

  if (!ADMIN_CONFIGURED) {
    return {
      error:
        "Market update could not be saved because the Supabase service role key is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local or allow authenticated update policy for the market table.",
    };
  }

  if (!canTransitionMarket(existing.status, parsed.data.status)) {
    return {
      error: `Peralihan status daripada ${existing.status} ke ${parsed.data.status} tidak dibenarkan`,
    };
  }

  try {
    const { error } = await db
      .from("market")
      .update({
        nama_pasar: parsed.data.namaPasar,
        daerah: parsed.data.daerah,
        alamat: parsed.data.alamat || null,
        hari_operasi: parsed.data.hariOperasi || null,
        status: parsed.data.status,
      })
      .eq("id", parsed.data.id);

    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengemas kini tapak" };
  }
  revalidatePath("/jadual");
  return { error: null, ok: true };
}

export async function deleteMarket(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID tidak sah");

  if (!ADMIN_CONFIGURED) {
    throw new Error(
      "Market delete failed because the Supabase service role key is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local or allow authenticated delete policy for the market table."
    );
  }

  try {
    const { error } = await db.from("market").delete().eq("id", id);
    if (error) throw new Error(error.message);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Gagal memadam tapak");
  }
  revalidatePath("/jadual");
}
