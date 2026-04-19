"use server";

import { supabase } from "@/lib/supabaseClient";

// ============ FLASH SALES ============

export async function createFlashSale(
  vendorId: string,
  marketId: string,
  itemId: string | null,
  originalPrice: number,
  discountPercentage: number,
  durationMinutes: number = 30,
  quantity?: number
): Promise<{ success: boolean; saleId?: string; error?: string }> {
  try {
    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60000);

    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    const { data, error } = await supabase
      .from("flash_sale")
      .insert({
        id: `flash-${Date.now()}`,
        vendor_id: vendorId,
        market_id: marketId,
        item_id: itemId,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        discount_percentage: discountPercentage,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        quantity,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, saleId: data.id };
  } catch (error) {
    console.error("Error creating flash sale:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create flash sale",
    };
  }
}

export async function getActiveFlashSales(vendorId?: string): Promise<any[]> {
  try {
    let query = supabase
      .from("flash_sale")
      .select("*")
      .eq("is_active", true)
      .gt("end_time", new Date().toISOString());

    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching flash sales:", error);
    return [];
  }
}

export async function endFlashSale(
  saleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("flash_sale")
      .update({ is_active: false, end_time: new Date().toISOString() })
      .eq("id", saleId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error ending flash sale:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to end flash sale",
    };
  }
}

// ============ PASAR DRIVE (MULTI-STALL ORDERS) ============

export async function createPasarDriveOrder(
  marketId: string,
  customerId?: string,
  estimatedPickupMinutes: number = 30
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const estimatedPickupTime = new Date(
      Date.now() + estimatedPickupMinutes * 60000
    );

    const { data, error } = await supabase
      .from("pasar_drive")
      .insert({
        id: `drive-${Date.now()}`,
        customer_id: customerId,
        market_id: marketId,
        order_time: new Date().toISOString(),
        estimated_pickup_time: estimatedPickupTime.toISOString(),
        total_amount: 0,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, orderId: data.id };
  } catch (error) {
    console.error("Error creating Pasar Drive order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create order",
    };
  }
}

export async function addItemToPasarDriveOrder(
  driveId: string,
  vendorId: string,
  itemId: string,
  quantity: number,
  pricePerUnit: number
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const subtotal = quantity * pricePerUnit;

    const { data: orderItem, error: insertError } = await supabase
      .from("pasar_drive_item")
      .insert({
        id: `drive-item-${Date.now()}`,
        drive_id: driveId,
        vendor_id: vendorId,
        item_id: itemId,
        quantity,
        price_per_unit: pricePerUnit,
        subtotal,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update order total
    const { data: items, error: fetchError } = await supabase
      .from("pasar_drive_item")
      .select("subtotal")
      .eq("drive_id", driveId);

    if (fetchError) throw fetchError;

    const totalAmount = items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;

    const { error: updateError } = await supabase
      .from("pasar_drive")
      .update({ total_amount: totalAmount })
      .eq("id", driveId);

    if (updateError) throw updateError;

    return { success: true, itemId: orderItem.id };
  } catch (error) {
    console.error("Error adding item to Pasar Drive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add item",
    };
  }
}

export async function getPasarDriveOrder(driveId: string): Promise<any> {
  try {
    const { data: order, error: orderError } = await supabase
      .from("pasar_drive")
      .select("*")
      .eq("id", driveId)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
      .from("pasar_drive_item")
      .select("*, vendor:vendor_id(nama_perniagaan)")
      .eq("drive_id", driveId);

    if (itemsError) throw itemsError;

    return { ...order, items };
  } catch (error) {
    console.error("Error fetching Pasar Drive order:", error);
    return null;
  }
}

export async function confirmPasarDriveOrder(
  driveId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("pasar_drive")
      .update({ status: "CONFIRMED", payment_status: "PAID" })
      .eq("id", driveId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error confirming order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to confirm order",
    };
  }
}

export async function completePasarDriveOrder(
  driveId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("pasar_drive")
      .update({ status: "COMPLETED" })
      .eq("id", driveId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error completing order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete order",
    };
  }
}

// ============ DUIT PECAH (SMALL CHANGE REQUEST) ============

export async function requestSmallChange(
  requesterVendorId: string,
  marketId: string,
  requestAmount: number,
  nearbyVendorIds: string[] = []
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("duit_pecah")
      .insert({
        id: `change-${Date.now()}`,
        requester_vendor_id: requesterVendorId,
        provider_vendor_id: nearbyVendorIds[0] || "",
        market_id: marketId,
        request_amount: requestAmount,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, requestId: data.id };
  } catch (error) {
    console.error("Error requesting small change:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to request change",
    };
  }
}

export async function acceptSmallChangeRequest(
  requestId: string,
  providerVendorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("duit_pecah")
      .update({
        provider_vendor_id: providerVendorId,
        status: "ACCEPTED",
      })
      .eq("id", requestId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error accepting request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to accept request",
    };
  }
}

export async function completeSmallChangeTransaction(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("duit_pecah")
      .update({
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error completing transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete",
    };
  }
}

export async function getPendingSmallChangeRequests(
  marketId: string
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("duit_pecah")
      .select("*")
      .eq("market_id", marketId)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching small change requests:", error);
    return [];
  }
}

// ============ SALES RECORDING ============

export async function recordSale(
  vendorId: string,
  marketId: string,
  items: Array<{
    itemId?: string;
    quantity: number;
    pricePerUnit: number;
  }>
): Promise<{ success: boolean; saleId?: string; error?: string }> {
  try {
    let totalAmount = 0;
    let totalQuantity = 0;

    const sale = {
      id: `sale-${Date.now()}`,
      vendor_id: vendorId,
      market_id: marketId,
      item_id: items[0]?.itemId || null,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      price_per_unit: items[0]?.pricePerUnit || 0,
      total_amount: items.reduce(
        (sum, item) => sum + item.quantity * item.pricePerUnit,
        0
      ),
      sale_time: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("sale")
      .insert(sale)
      .select()
      .single();

    if (error) throw error;

    return { success: true, saleId: data.id };
  } catch (error) {
    console.error("Error recording sale:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record sale",
    };
  }
}
