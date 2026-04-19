"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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
    await prisma.vendor.create({
      data: {
        namaPerniagaan: parsed.data.namaPerniagaan,
        namaPanggilan: parsed.data.namaPanggilan || null,
        noTelefon: parsed.data.noTelefon || null,
        email: parsed.data.email || null,
        jenisJualan: parsed.data.jenisJualan,
        yuranHarianSen: sen,
        status: "DRAFT",
      },
    });
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

  const existing = await prisma.vendor.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { error: "Rekod penjaja tidak dijumpai" };
  if (!canTransitionVendor(existing.status, parsed.data.status)) {
    return {
      error: `Peralihan status daripada ${existing.status} ke ${parsed.data.status} tidak dibenarkan`,
    };
  }

  try {
    await prisma.vendor.update({
      where: { id: parsed.data.id },
      data: {
        namaPerniagaan: parsed.data.namaPerniagaan,
        namaPanggilan: parsed.data.namaPanggilan || null,
        noTelefon: parsed.data.noTelefon || null,
        email: parsed.data.email || null,
        jenisJualan: parsed.data.jenisJualan,
        yuranHarianSen: sen,
        status: parsed.data.status,
      },
    });
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
    await prisma.vendor.delete({ where: { id } });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Gagal memadam penjaja");
  }
  revalidatePath("/penjaja");
}
