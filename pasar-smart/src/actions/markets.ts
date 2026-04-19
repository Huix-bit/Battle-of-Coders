"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabaseClient";
import { canTransitionMarket } from "@/lib/status";
import {
  formatZodError,
  marketCreateSchema,
  marketUpdateSchema,
} from "@/lib/validations";
import type { ActionState } from "./types";

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
  try {
    await supabase.from("market").insert([
      {
        nama_pasar: parsed.data.namaPasar,
        daerah: parsed.data.daerah,
        alamat: parsed.data.alamat || null,
        hari_operasi: parsed.data.hariOperasi || null,
        status: "DIRANCANG",
      },
    ]);
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

  const { data: existing } = await supabase
    .from("market")
    .select("*")
    .eq("id", parsed.data.id)
    .single();

  if (!existing) return { error: "Tapak pasar tidak dijumpai" };
  if (!canTransitionMarket(existing.status, parsed.data.status)) {
    return {
      error: `Peralihan status daripada ${existing.status} ke ${parsed.data.status} tidak dibenarkan`,
    };
  }

  try {
    await supabase
      .from("market")
      .update({
        nama_pasar: parsed.data.namaPasar,
        daerah: parsed.data.daerah,
        alamat: parsed.data.alamat || null,
        hari_operasi: parsed.data.hariOperasi || null,
        status: parsed.data.status,
      })
      .eq("id", parsed.data.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengemas kini tapak" };
  }
  revalidatePath("/jadual");
  return { error: null, ok: true };
}

export async function deleteMarket(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID tidak sah");
  try {
    await supabase.from("market").delete().eq("id", id);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Gagal memadam tapak");
  }
  revalidatePath("/jadual");
}
