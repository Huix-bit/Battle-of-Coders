"use server";

import Groq from "groq-sdk";
import { supabase } from "@/lib/supabaseClient";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============ ANALYTICS ============

export async function getDailySalesSummary(vendorId: string, marketId: string) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("sale")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("market_id", marketId)
      .gte("sale_time", `${today}T00:00:00`)
      .lte("sale_time", `${today}T23:59:59`);

    if (error) throw error;

    const sales = data || [];
    const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
    const transactionCount = sales.length;
    const avgTransactionValue =
      transactionCount > 0 ? totalSales / transactionCount : 0;

    // Calculate peak hour
    const hourCounts: Record<number, number> = {};
    sales.forEach((sale) => {
      const hour = new Date(sale.sale_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalSales,
      totalQuantity,
      transactionCount,
      avgTransactionValue,
      peakHour: peakHour ? peakHour[0] : null,
      peakHourCount: peakHour ? peakHour[1] : 0,
      hourlyBreakdown: hourCounts,
    };
  } catch (error) {
    console.error("Error fetching daily sales summary:", error);
    return {
      totalSales: 0,
      totalQuantity: 0,
      transactionCount: 0,
      avgTransactionValue: 0,
      peakHour: null,
      peakHourCount: 0,
    };
  }
}

export async function getWeeklyAnalytics(vendorId: string, marketId: string) {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("sale")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("market_id", marketId)
      .gte("sale_time", sevenDaysAgo.toISOString());

    if (error) throw error;

    const sales = data || [];

    // Group by date
    const dailyBreakdown: Record<string, any> = {};
    sales.forEach((sale) => {
      const date = sale.sale_time.split("T")[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          totalSales: 0,
          transactionCount: 0,
          quantitySold: 0,
        };
      }
      dailyBreakdown[date].totalSales += sale.total_amount;
      dailyBreakdown[date].transactionCount += 1;
      dailyBreakdown[date].quantitySold += sale.quantity;
    });

    const totalWeeklySales = Object.values(dailyBreakdown).reduce(
      (sum: number, day: any) => sum + day.totalSales,
      0
    );
    const avgDailySales = Object.keys(dailyBreakdown).length
      ? totalWeeklySales / Object.keys(dailyBreakdown).length
      : 0;

    return {
      totalWeeklySales,
      avgDailySales,
      daysWithSales: Object.keys(dailyBreakdown).length,
      dailyBreakdown,
    };
  } catch (error) {
    console.error("Error fetching weekly analytics:", error);
    return {
      totalWeeklySales: 0,
      avgDailySales: 0,
      daysWithSales: 0,
      dailyBreakdown: {},
    };
  }
}

export async function getTopSellingItems(vendorId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("sale")
      .select("item_id, quantity")
      .eq("vendor_id", vendorId);

    if (error) throw error;

    const sales = data || [];
    const itemQuantities: Record<string, number> = {};

    sales.forEach((sale) => {
      if (sale.item_id) {
        itemQuantities[sale.item_id] =
          (itemQuantities[sale.item_id] || 0) + sale.quantity;
      }
    });

    // Get top 5 items
    const topItems = await Promise.all(
      Object.entries(itemQuantities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(async ([itemId, quantity]) => {
          const { data: item } = await supabase
            .from("vendor_menu")
            .select("*")
            .eq("id", itemId)
            .single();

          return {
            itemId,
            name: item?.item_name,
            quantity,
            revenue: (item?.price || 0) * quantity,
          };
        })
    );

    return topItems;
  } catch (error) {
    console.error("Error fetching top selling items:", error);
    return [];
  }
}

export async function updateVendorAnalytics(
  vendorId: string,
  marketId: string,
  date: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const dateOnly = date.split("T")[0];

    const dailySummary = await getDailySalesSummary(vendorId, marketId);

    const { error } = await supabase.from("vendor_analytics").upsert(
      {
        id: `analytics-${vendorId}-${marketId}-${dateOnly}`,
        vendor_id: vendorId,
        market_id: marketId,
        date: dateOnly,
        total_sales: dailySummary.totalSales,
        total_quantity_sold: dailySummary.totalQuantity,
        peak_hour_start: dailySummary.peakHour,
        peak_hour_count: dailySummary.peakHourCount,
        avg_transaction_value: dailySummary.avgTransactionValue,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "vendor_id,market_id,date" }
    );

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error updating analytics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update analytics",
    };
  }
}

// ============ AI RECOMMENDATIONS ============

export async function generateAIRecommendations(
  vendorId: string,
  marketId: string
): Promise<any[]> {
  try {
    // Get vendor data
    const { data: vendor } = await supabase
      .from("vendor")
      .select("*")
      .eq("id", vendorId)
      .single();

    // Get recent sales data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: sales } = await supabase
      .from("sale")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("market_id", marketId)
      .gte("sale_time", sevenDaysAgo.toISOString());

    // Get menu items
    const { data: menuItems } = await supabase
      .from("vendor_menu")
      .select("*")
      .eq("vendor_id", vendorId);

    // Get analytics
    const analytics = await getDailySalesSummary(vendorId, marketId);
    const weeklyAnalytics = await getWeeklyAnalytics(vendorId, marketId);

    // Prepare data for AI analysis
    const dataContext = {
      businessName: vendor?.nama_perniagaan,
      businessType: vendor?.jenis_jualan,
      totalRecentSales: sales?.length || 0,
      totalRevenue: (sales || []).reduce((sum, s) => sum + s.total_amount, 0),
      peakHour: analytics.peakHour,
      avgTransactionValue: analytics.avgTransactionValue,
      weeklyTrend: weeklyAnalytics.dailyBreakdown,
      menuItems: menuItems?.length || 0,
      topSellingItems: await getTopSellingItems(vendorId),
    };

    const prompt = `Anda adalah ahli bisnes pasar malam yang memberikan rekomendasi berbasis data dalam format JSON.

Berdasarkan data berikut, berikan 3-5 rekomendasi spesifik untuk meningkatkan penjualan:

Data Bisnis:
- Nama: ${dataContext.businessName}
- Jenis: ${dataContext.businessType}
- Total Penjualan (7 hari): RM${dataContext.totalRevenue.toFixed(2)}
- Rata-rata Transaksi: RM${dataContext.avgTransactionValue.toFixed(2)}
- Jam Puncak: ${dataContext.peakHour}:00
- Item Menu: ${dataContext.menuItems}

Balas HANYA dengan JSON array ini (tiada teks lain):
[
  {
    "type": "PRICING|BUNDLING|POSITIONING|PRODUCT|TIMING",
    "title": "Judul Rekomendasi",
    "description": "Penjelasan detail",
    "suggestedValue": { "action": "nilai spesifik" },
    "rationale": "Alasan berdasarkan data",
    "impact": { "expectedIncrease": "X%" }
  }
]`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content ?? "";

    // Parse and validate JSON
    let recommendations = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing recommendations:", parseError);
    }

    // Save recommendations to database
    for (const rec of recommendations) {
      await supabase.from("recommendation").insert({
        id: `rec-${Date.now()}-${Math.random()}`,
        vendor_id: vendorId,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        suggested_value: rec.suggestedValue,
        rationale: rec.rationale,
        impact: rec.impact,
      });
    }

    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}

export async function getRecommendations(vendorId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("recommendation")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("generated_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}

export async function applyRecommendation(
  recommendationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("recommendation")
      .update({ applied_at: new Date().toISOString() })
      .eq("id", recommendationId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error applying recommendation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply",
    };
  }
}
