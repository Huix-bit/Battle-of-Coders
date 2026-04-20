"use server";

import { supabase } from "@/lib/supabaseClient";

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

export async function toggleStallPresence(
  vendorId: string,
  marketId: string,
  assignmentId: string,
  isPresent: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if stall status exists
    const { data: existing } = await supabase
      .from("stall_status")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("market_id", marketId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
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
      const { error } = await supabase.from("stall_status").insert({
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
    const { error } = await supabase
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
    let query = supabase.from("active_stalls").select("*");

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
    const { data, error } = await supabase
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
    const { data, error } = await supabase.from("active_stalls").select("*");

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
    const { error } = await supabase
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
    const { data, error } = await supabase
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
