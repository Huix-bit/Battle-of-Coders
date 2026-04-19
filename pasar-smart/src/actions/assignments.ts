"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canTransitionAssignment } from "@/lib/status";
import {
  assignmentCreateSchema,
  assignmentUpdateSchema,
  formatZodError,
} from "@/lib/validations";
import type { ActionState } from "./types";

function parseOptionalDate(s: string | undefined): Date | null {
  if (!s || !s.trim()) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function createAssignment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    vendorId: String(formData.get("vendorId") ?? ""),
    marketId: String(formData.get("marketId") ?? ""),
    tarikhMula: String(formData.get("tarikhMula") ?? ""),
    tarikhTamat: String(formData.get("tarikhTamat") ?? ""),
    petakStall: String(formData.get("petakStall") ?? ""),
    catatan: String(formData.get("catatan") ?? ""),
  };
  const parsed = assignmentCreateSchema.safeParse(raw);
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  const mula = new Date(parsed.data.tarikhMula);
  const tamat = parseOptionalDate(parsed.data.tarikhTamat);

  try {
    await prisma.assignment.create({
      data: {
        vendorId: parsed.data.vendorId,
        marketId: parsed.data.marketId,
        tarikhMula: mula,
        tarikhTamat: tamat,
        petakStall: parsed.data.petakStall || null,
        catatan: parsed.data.catatan || null,
        status: "DIJADUALKAN",
      },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mencipta penugasan" };
  }
  revalidatePath("/jadual");
  return { error: null, ok: true };
}

export async function updateAssignment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    id: String(formData.get("id") ?? ""),
    vendorId: String(formData.get("vendorId") ?? ""),
    marketId: String(formData.get("marketId") ?? ""),
    tarikhMula: String(formData.get("tarikhMula") ?? ""),
    tarikhTamat: String(formData.get("tarikhTamat") ?? ""),
    petakStall: String(formData.get("petakStall") ?? ""),
    catatan: String(formData.get("catatan") ?? ""),
    status: String(formData.get("status") ?? ""),
  };
  const parsed = assignmentUpdateSchema.safeParse(raw);
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  const existing = await prisma.assignment.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { error: "Penugasan tidak dijumpai" };
  if (!canTransitionAssignment(existing.status, parsed.data.status)) {
    return {
      error: `Peralihan status daripada ${existing.status} ke ${parsed.data.status} tidak dibenarkan`,
    };
  }

  const mula = new Date(parsed.data.tarikhMula);
  const tamat = parseOptionalDate(parsed.data.tarikhTamat);

  try {
    await prisma.assignment.update({
      where: { id: parsed.data.id },
      data: {
        vendorId: parsed.data.vendorId,
        marketId: parsed.data.marketId,
        tarikhMula: mula,
        tarikhTamat: tamat,
        petakStall: parsed.data.petakStall || null,
        catatan: parsed.data.catatan || null,
        status: parsed.data.status,
      },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengemas kini penugasan" };
  }
  revalidatePath("/jadual");
  return { error: null, ok: true };
}

export async function deleteAssignment(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID tidak sah");
  try {
    await prisma.assignment.delete({ where: { id } });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Gagal memadam penugasan");
  }
  revalidatePath("/jadual");
}
