"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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
    await prisma.market.create({
      data: {
        namaPasar: parsed.data.namaPasar,
        daerah: parsed.data.daerah,
        alamat: parsed.data.alamat || null,
        hariOperasi: parsed.data.hariOperasi || null,
        status: "DIRANCANG",
      },
    });
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

  const existing = await prisma.market.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { error: "Tapak pasar tidak dijumpai" };
  if (!canTransitionMarket(existing.status, parsed.data.status)) {
    return {
      error: `Peralihan status daripada ${existing.status} ke ${parsed.data.status} tidak dibenarkan`,
    };
  }

  try {
    await prisma.market.update({
      where: { id: parsed.data.id },
      data: {
        namaPasar: parsed.data.namaPasar,
        daerah: parsed.data.daerah,
        alamat: parsed.data.alamat || null,
        hariOperasi: parsed.data.hariOperasi || null,
        status: parsed.data.status,
      },
    });
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
    await prisma.market.delete({ where: { id } });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Gagal memadam tapak");
  }
  revalidatePath("/jadual");
}
