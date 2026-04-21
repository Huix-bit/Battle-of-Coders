"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabaseClient";

const db = supabaseAdmin ?? supabase;

export type StallStatusType = "ACTIVE" | "BUSY" | "SOLDOUT" | "CLOSED";

interface StallStatusUpdate {
  isPresent: boolean;
  status: StallStatusType;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
}

interface ActiveStall {
  vendorId: string;
  marketId: string;
  namaPerniagaan: string;
  jenisJualan: string;
  namaPasar: string;
  currentStallNumber: string;
  status: StallStatusType;
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

export async function ensureMarketExists(marketId: string) {
  const { data, error } = await db
    .from("market")
    .select("id")
    .eq("id", marketId)
    .maybeSingle();

  if (error) throw error;
  if (data?.id) return;

  const { error: insertError } = await db.from("market").insert({
    id: marketId,
    nama_pasar: "Demo Market",
    daerah: "MELAKA_TENGAH",
    alamat: null,
    hari_operasi: null,
    status: "DIRANCANG",
  });

  if (insertError) throw insertError;
}

async function ensureVendorExists(vendorId: string) {
  const { data } = await db
    .from("vendor")
    .select("id")
    .eq("id", vendorId)
    .maybeSingle();

  if (data?.id) return; // already exists

  // Auto-create a minimal vendor row so FK constraints don't block the toggle
  const { error } = await db.from("vendor").insert({
    id: vendorId,
    nama_perniagaan: "My Stall",
    jenis_jualan: "Belum ditetapkan",
    status: "AKTIF",
  });

  // Ignore conflict (another process may have inserted concurrently)
  if (error && !error.message.includes("duplicate") && !error.message.includes("unique")) {
    throw error;
  }
}

async function ensureAssignmentId(vendorId: string, marketId: string) {
  const { data, error } = await db
    .from("assignment")
    .select("id")
    .eq("vendor_id", vendorId)
    .eq("market_id", marketId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data?.id) return data.id;

  // Ensure both FK targets exist before inserting the assignment
  await ensureVendorExists(vendorId);
  await ensureMarketExists(marketId);

  const newId = `assign-${vendorId}-${marketId}`;
  const { error: insertError } = await db.from("assignment").insert({
    id: newId,
    vendor_id: vendorId,
    market_id: marketId,
    tarikh_mula: new Date().toISOString(),
    status: "DIJADUALKAN",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (insertError) throw insertError;
  return newId;
}

export async function toggleStallPresence(
  vendorId: string,
  marketId: string,
  _assignmentId: string,
  isPresent: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const assignmentId = await ensureAssignmentId(vendorId, marketId);

    // Check if stall status exists
    const { data: existing } = await db
      .from("stall_status")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("market_id", marketId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await db
        .from("stall_status")
        .update({
          is_present: isPresent,
          status: isPresent ? "ACTIVE" : "CLOSED",
          last_updated: new Date().toISOString(),
        })
        .eq("vendor_id", vendorId)
        .eq("market_id", marketId);

      if (error) throw error;
    } else {
      // Create new
      const { error } = await db.from("stall_status").insert({
        id: `stall-${vendorId}-${marketId}-${Date.now()}`,
        vendor_id: vendorId,
        market_id: marketId,
        assignment_id: assignmentId,
        is_present: isPresent,
        status: isPresent ? "ACTIVE" : "CLOSED",
        last_updated: new Date().toISOString(),
      });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error toggling stall presence:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

export async function updateStallStatus(
  vendorId: string,
  marketId: string,
  update: StallStatusUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from("stall_status")
      .update({
        ...update,
        last_updated: new Date().toISOString(),
      })
      .eq("vendor_id", vendorId)
      .eq("market_id", marketId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error updating stall status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

export async function getActiveStalls(marketId?: string): Promise<ActiveStall[]> {
  try {
    let query = db.from("active_stalls").select("*");

    if (marketId) {
      query = query.eq("market_id", marketId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (
      data?.map((stall: any) => ({
        vendorId: stall.vendor_id,
        marketId: stall.market_id,
        namaPerniagaan: stall.nama_perniagaan,
        jenisJualan: stall.jenis_jualan,
        namaPasar: stall.nama_pasar,
        currentStallNumber: stall.current_stall_number,
        status: stall.status,
        latitude: stall.latitude,
        longitude: stall.longitude,
        lastUpdated: stall.last_updated,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching active stalls:", error);
    return [];
  }
}

export async function getVendorStallStatus(vendorId: string, marketId: string) {
  try {
    const { data, error } = await db
      .from("stall_status")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("market_id", marketId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return data || null;
  } catch (error) {
    console.error("Error fetching stall status:", error);
    return null;
  }
}

export async function getNearbyStalls(
  latitude: number,
  longitude: number,
  radiusKm: number = 1
): Promise<ActiveStall[]> {
  try {
    // Simple distance calculation (in production, use PostGIS)
    const { data, error } = await db.from("active_stalls").select("*");

    if (error) throw error;

    return (
      data
        ?.filter((stall: any) => {
          if (!stall.latitude || !stall.longitude) return false;

          // Haversine formula (simplified)
          const R = 6371; // Earth's radius in km
          const dLat =
            ((stall.latitude - latitude) * Math.PI) / 180;
          const dLon =
            ((stall.longitude - longitude) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((latitude * Math.PI) / 180) *
            Math.cos((stall.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return distance <= radiusKm;
        })
        .map((stall: any) => ({
          vendorId: stall.vendor_id,
          marketId: stall.market_id,
          namaPerniagaan: stall.nama_perniagaan,
          jenisJualan: stall.jenis_jualan,
          namaPasar: stall.nama_pasar,
          currentStallNumber: stall.current_stall_number,
          status: stall.status,
          latitude: stall.latitude,
          longitude: stall.longitude,
          lastUpdated: stall.last_updated,
        })) || []
    );
  } catch (error) {
    console.error("Error fetching nearby stalls:", error);
    return [];
  }
}

export async function updateStallLocation(
  vendorId: string,
  marketId: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from("stall_status")
      .update({
        latitude,
        longitude,
        last_updated: new Date().toISOString(),
      })
      .eq("vendor_id", vendorId)
      .eq("market_id", marketId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error updating stall location:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update location",
    };
  }
}

export async function getStallAvailability(marketId: string): Promise<{
  totalStalls: number;
  activeStalls: number;
  busyStalls: number;
  availableStalls: number;
}> {
  try {
    const { data, error } = await db
      .from("active_stalls")
      .select("status")
      .eq("market_id", marketId);

    if (error) throw error;

    const activeStalls = data?.length || 0;
    const busyStalls = data?.filter((s) => s.status === "BUSY").length || 0;
    const availableStalls = activeStalls - busyStalls;

    return {
      totalStalls: activeStalls,
      activeStalls,
      busyStalls,
      availableStalls,
    };
  } catch (error) {
    console.error("Error fetching stall availability:", error);
    return {
      totalStalls: 0,
      activeStalls: 0,
      busyStalls: 0,
      availableStalls: 0,
    };
  }
}
