"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatZodError,
  stallCreateSchema,
  stallUpdateSchema,
} from "@/lib/validations";
import type { UserRole } from "@/lib/nightMarketTypes";
import type { ActionState } from "./types";

function optFloat(s: string | undefined): number | null {
  if (s == null) return null;
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseBool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}

async function getLinkedVendorId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("vendor")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

async function getStallVendorId(stallId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("stalls")
    .select("vendor_id")
    .eq("id", stallId)
    .maybeSingle();
  return data?.vendor_id ?? null;
}

async function assertStallPermission(
  role: UserRole,
  userId: string,
  stallVendorId: string | null,
): Promise<boolean> {
  if (!stallVendorId) return false;
  if (role === "ADMIN") return true;
  if (role !== "VENDOR") return false;
  const vid = await getLinkedVendorId(
    await createSupabaseServerClient(),
    userId,
  );
  return vid === stallVendorId;
}

export async function createStall(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getSessionProfile();
  if (!profile)
    return { error: "Sila log masuk untuk mengurus gerai." };
  if (profile.role !== "ADMIN" && profile.role !== "VENDOR") {
    return { error: "Kebenaran ditolak." };
  }

  let vendorId = String(formData.get("vendorId") ?? "").trim();
  if (profile.role === "VENDOR") {
    const supabase = await createSupabaseServerClient();
    const linked = await getLinkedVendorId(supabase, profile.id);
    if (!linked) {
      return {
        error:
          "Akaun penjaja anda belum dipautkan ke rekod penjaja. Hubungi pentadbir.",
      };
    }
    vendorId = linked;
  }

  const raw = {
    vendorId,
    marketId: String(formData.get("marketId") ?? "").trim(),
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    status: String(formData.get("status") ?? "OPEN"),
    flashSaleActive: parseBool(formData.get("flashSaleActive")),
    isHere: parseBool(formData.get("isHere")),
    mapLocationX: String(formData.get("mapLocationX") ?? ""),
    mapLocationY: String(formData.get("mapLocationY") ?? ""),
  };

  const parsed = stallCreateSchema.safeParse(raw);
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const mx = optFloat(parsed.data.mapLocationX);
  const my = optFloat(parsed.data.mapLocationY);

  try {
    await supabase.from("stalls").insert([
      {
        vendor_id: parsed.data.vendorId,
        market_id: parsed.data.marketId || null,
        name: parsed.data.name,
        category: parsed.data.category,
        status: parsed.data.status,
        flash_sale_active: parsed.data.flashSaleActive,
        is_here: parsed.data.isHere,
        map_location_x: mx,
        map_location_y: my,
      },
    ]);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Gagal mencipta rekod gerai",
    };
  }

  revalidatePath("/gerai");
  return { error: null, ok: true };
}

export async function updateStall(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getSessionProfile();
  if (!profile)
    return { error: "Sila log masuk untuk mengurus gerai." };
  if (profile.role !== "ADMIN" && profile.role !== "VENDOR") {
    return { error: "Kebenaran ditolak." };
  }

  const stallId = String(formData.get("id") ?? "");
  const existingVendor = await getStallVendorId(stallId);
  const ok = await assertStallPermission(
    profile.role,
    profile.id,
    existingVendor,
  );
  if (!ok) return { error: "Gerai tidak dijumpai atau kebenaran ditolak." };

  let vendorId = String(formData.get("vendorId") ?? "").trim();
  if (profile.role === "VENDOR") {
    const supabase = await createSupabaseServerClient();
    const linked = await getLinkedVendorId(supabase, profile.id);
    if (!linked || linked !== existingVendor)
      return { error: "Kebenaran ditolak." };
    vendorId = linked;
  }

  const raw = {
    id: stallId,
    vendorId,
    marketId: String(formData.get("marketId") ?? "").trim(),
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    status: String(formData.get("status") ?? "OPEN"),
    flashSaleActive: parseBool(formData.get("flashSaleActive")),
    isHere: parseBool(formData.get("isHere")),
    mapLocationX: String(formData.get("mapLocationX") ?? ""),
    mapLocationY: String(formData.get("mapLocationY") ?? ""),
  };

  const parsed = stallUpdateSchema.safeParse(raw);
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const mx = optFloat(parsed.data.mapLocationX);
  const my = optFloat(parsed.data.mapLocationY);

  try {
    await supabase
      .from("stalls")
      .update({
        vendor_id: parsed.data.vendorId,
        market_id: parsed.data.marketId || null,
        name: parsed.data.name,
        category: parsed.data.category,
        status: parsed.data.status,
        flash_sale_active: parsed.data.flashSaleActive,
        is_here: parsed.data.isHere,
        map_location_x: mx,
        map_location_y: my,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Gagal mengemas kini gerai",
    };
  }

  revalidatePath("/gerai");
  return { error: null, ok: true };
}

export async function deleteStall(formData: FormData): Promise<void> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Sila log masuk.");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID tidak sah");

  const stallVendor = await getStallVendorId(id);
  const ok = await assertStallPermission(profile.role, profile.id, stallVendor);
  if (!ok) throw new Error("Kebenaran ditolak.");

  const supabase = await createSupabaseServerClient();
  try {
    await supabase.from("stalls").delete().eq("id", id);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Gagal memadam gerai");
  }
  revalidatePath("/gerai");
}
