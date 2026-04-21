"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabaseClient";

const db = supabaseAdmin ?? supabase;
import { rmStringToSen } from "@/lib/money";
import { canTransitionVendor } from "@/lib/status";
import {
  formatZodError,
  vendorCreateSchema,
  vendorUpdateSchema,
} from "@/lib/validations";
import type { ActionState } from "./types";

export async function createVendor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    namaPerniagaan: String(formData.get("namaPerniagaan") ?? ""),
    namaPanggilan: String(formData.get("namaPanggilan") ?? ""),
    noTelefon: String(formData.get("noTelefon") ?? ""),
    email: String(formData.get("email") ?? ""),
    jenisJualan: String(formData.get("jenisJualan") ?? ""),
    yuranRm: String(formData.get("yuranRm") ?? ""),
  };
  const parsed = vendorCreateSchema.safeParse(raw);
  if (!parsed.success) return { error: formatZodError(parsed.error) };
  let sen: number;
  try {
    sen = rmStringToSen(parsed.data.yuranRm);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ralat yuran" };
  }
  if (sen < 0) return { error: "Yuran tidak boleh negatif" };
  try {
    await db.from("vendor").insert([
      {
        nama_perniagaan: parsed.data.namaPerniagaan,
        nama_panggilan: parsed.data.namaPanggilan || null,
        no_telefon: parsed.data.noTelefon || null,
        email: parsed.data.email || null,
        jenis_jualan: parsed.data.jenisJualan,
        yuran_harian_sen: sen,
        status: "DRAFT",
      },
    ]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menyimpan penjaja" };
  }
  revalidatePath("/penjaja");
  return { error: null, ok: true };
}

export async function updateVendor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    id: String(formData.get("id") ?? ""),
    namaPerniagaan: String(formData.get("namaPerniagaan") ?? ""),
    namaPanggilan: String(formData.get("namaPanggilan") ?? ""),
    noTelefon: String(formData.get("noTelefon") ?? ""),
    email: String(formData.get("email") ?? ""),
    jenisJualan: String(formData.get("jenisJualan") ?? ""),
    yuranRm: String(formData.get("yuranRm") ?? ""),
    status: String(formData.get("status") ?? ""),
  };
  const parsed = vendorUpdateSchema.safeParse(raw);
  if (!parsed.success) return { error: formatZodError(parsed.error) };
  let sen: number;
  try {
    sen = rmStringToSen(parsed.data.yuranRm);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ralat yuran" };
  }
  if (sen < 0) return { error: "Yuran tidak boleh negatif" };

  const { data: existing } = await db
    .from("vendor")
    .select("*")
    .eq("id", parsed.data.id)
    .single();

  if (!existing) return { error: "Rekod penjaja tidak dijumpai" };
  if (!canTransitionVendor(existing.status, parsed.data.status)) {
    return {
      error: `Peralihan status daripada ${existing.status} ke ${parsed.data.status} tidak dibenarkan`,
    };
  }

  try {
    await db
      .from("vendor")
      .update({
        nama_perniagaan: parsed.data.namaPerniagaan,
        nama_panggilan: parsed.data.namaPanggilan || null,
        no_telefon: parsed.data.noTelefon || null,
        email: parsed.data.email || null,
        jenis_jualan: parsed.data.jenisJualan,
        yuran_harian_sen: sen,
        status: parsed.data.status,
      })
      .eq("id", parsed.data.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengemas kini penjaja" };
  }
  revalidatePath("/penjaja");
  return { error: null, ok: true };
}

export async function deleteVendor(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID tidak sah");
  try {
    await db.from("vendor").delete().eq("id", id);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Gagal memadam penjaja");
  }
  revalidatePath("/penjaja");
}
