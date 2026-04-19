# 🚀 Vendor Ecosystem - Quick Reference

## 📋 Files Overview

| File | Purpose | Key Functions |
|------|---------|---|
| `aiRegistration.ts` | AI vendor registration | `processVendorRegistrationChat`, `completeVendorRegistration`, `getChatHistory` |
| `stallStatus.ts` | Real-time stall management | `toggleStallPresence`, `getActiveStalls`, `getNearbyStalls` |
| `sellingTools.ts` | Flash sales, Pasar-Drive, duit pecah | `createFlashSale`, `createPasarDriveOrder`, `requestSmallChange` |
| `analytics.ts` | Sales tracking & AI recommendations | `getDailySalesSummary`, `generateAIRecommendations` |

---

## 🎮 Usage Examples

### Example 1: Vendor Registration Flow
```typescript
import { 
  processVendorRegistrationChat, 
  completeVendorRegistration 
} from "@/actions/aiRegistration";

// User types a message
const response = await processVendorRegistrationChat(
  sessionId,
  "Saya jual kuih tradisional, namanya Kuih Lapis..."
);

// Extract: { namaPerniagaan: "Kuih Lapis", jenisJualan: "Kuih" }
console.log(response.extractedData);

// When registration complete
if (response.isComplete) {
  const result = await completeVendorRegistration(sessionId, response.extractedData);
  console.log("New vendor ID:", result.vendorId);
}
```

### Example 2: Stall "I'm Here" Toggle
```typescript
import { toggleStallPresence, getActiveStalls } from "@/actions/stallStatus";

// Vendor clicks "I'm Here" button
await toggleStallPresence(vendorId, marketId, assignmentId, true);

// Get all active stalls in market
const activeStalls = await getActiveStalls(marketId);
// Shows vendor is now live on map
```

### Example 3: Create Flash Sale
```typescript
import { createFlashSale, getActiveFlashSales } from "@/actions/sellingTools";

// Vendor: "20% off for 30 minutes!"
const result = await createFlashSale(
  vendorId,
  marketId,
  itemId,
  originalPrice: 50,
  discountPercentage: 20,
  durationMinutes: 30
);

// Get all active flash sales
const sales = await getActiveFlashSales(vendorId);
```

### Example 4: Multi-Stall Order (Pasar-Drive)
```typescript
import { 
  createPasarDriveOrder, 
  addItemToPasarDriveOrder,
  confirmPasarDriveOrder 
} from "@/actions/sellingTools";

// Customer starts order
const order = await createPasarDriveOrder(marketId);
// driveId: "drive-123"

// Customer adds from vendor 1
await addItemToPasarDriveOrder(
  driveId: "drive-123",
  vendorId: "vendor-1",
  itemId: "item-1",
  quantity: 2,
  pricePerUnit: 15
);

// Customer adds from vendor 2
await addItemToPasarDriveOrder(
  driveId: "drive-123",
  vendorId: "vendor-2",
  itemId: "item-2",
  quantity: 3,
  pricePerUnit: 10
);

// Customer confirms and pays once
await confirmPasarDriveOrder("drive-123");
// Order total: (2 × 15) + (3 × 10) = RM 60
```

### Example 5: Sales Analytics
```typescript
import { 
  getDailySalesSummary, 
  getWeeklyAnalytics, 
  generateAIRecommendations 
} from "@/actions/analytics";

// Daily stats
const today = await getDailySalesSummary(vendorId, marketId);
console.log(`Today: RM ${today.totalSales}, ${today.transactionCount} sales`);

// Weekly trends
const week = await getWeeklyAnalytics(vendorId, marketId);
console.log(`Week avg: RM ${week.avgDailySales}`);

// AI suggestions
const recommendations = await generateAIRecommendations(vendorId, marketId);
recommendations.forEach(rec => {
  console.log(`${rec.type}: ${rec.title}`);
  console.log(`  → ${rec.description}`);
});
```

### Example 6: Duit Pecah (Small Change)
```typescript
import { 
  requestSmallChange, 
  acceptSmallChangeRequest,
  getPendingSmallChangeRequests 
} from "@/actions/sellingTools";

// Vendor 1: Need small change
const request = await requestSmallChange(vendor1Id, marketId, 50);

// Vendor 2: See pending requests
const pending = await getPendingSmallChangeRequests(marketId);

// Vendor 2: Accept the request
await acceptSmallChangeRequest(requestId, vendor2Id);
```

---

## 🎛️ Component Usage

### Vendor Dashboard
```tsx
import { VendorDashboard } from "@/components/vendor-dashboard";

// In your page
<VendorDashboard vendorId="v-123" marketId="m-456" />
```

**Displays:**
- "I'm Here" toggle (real-time)
- Today's sales
- Peak selling hours
- Active flash sales
- AI recommendations
- Auto-refreshes every 30s

### AI Registration Chat
```tsx
import { AIRegistrationChat } from "@/components/ai-registration-chat";

// In your page
<AIRegistrationChat />
```

**Features:**
- Natural language conversation
- Auto data extraction
- Chat history saved
- Success confirmation

### Selling Tools Panel
```tsx
import { SellingToolsPanel } from "@/components/selling-tools-panel";

// In your page
<SellingToolsPanel vendorId="v-123" marketId="m-456" />
```

**Tabs:**
- ⚡ Flash Sales - Create discounts
- 🚗 Pasar-Drive - Multi-vendor orders
- 💰 Duit Pecah - Request small change
- 📊 Record Sales - Log transactions

---

## 🔑 Key Data Structures

### Stall Status
```typescript
{
  vendorId: string;
  marketId: string;
  isPresent: boolean;
  status: "ACTIVE" | "BUSY" | "SOLDOUT" | "CLOSED";
  lastUpdated: Date;
  latitude: number;
  longitude: number;
  currentStallNumber: string;
}
```

### Flash Sale
```typescript
{
  vendorId: string;
  marketId: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  startTime: Date;
  endTime: Date;
  quantity: number;
  quantitySold: number;
  isActive: boolean;
}
```

### Pasar-Drive Order
```typescript
{
  id: string;
  marketId: string;
  status: "PENDING" | "CONFIRMED" | "READY" | "COMPLETED";
  totalAmount: number;
  items: [
    {
      vendorId: string;
      itemId: string;
      quantity: number;
      pricePerUnit: number;
    }
  ];
}
```

### Sales Record
```typescript
{
  vendorId: string;
  marketId: string;
  quantity: number;
  totalAmount: number;
  saleTime: Date;
  paymentMethod: "CASH" | "CARD" | "DIGITAL";
}
```

### Daily Summary
```typescript
{
  totalSales: number;
  totalQuantity: number;
  transactionCount: number;
  avgTransactionValue: number;
  peakHour: number | null; // 0-23
  hourlyBreakdown: Record<number, number>;
}
```

### AI Recommendation
```typescript
{
  type: "PRICING" | "BUNDLING" | "POSITIONING" | "PRODUCT" | "TIMING";
  title: string;
  description: string;
  suggestedValue: any;
  rationale: string;
  impact: { expectedIncrease: string };
}
```

---

## 🔄 Common Workflows

### Workflow 1: Morning Setup
```typescript
// 1. Vendor logs in
// 2. Toggle "I'm Here"
await toggleStallPresence(vendorId, marketId, assignmentId, true);

// 3. Check today's target from yesterday
const yesterday = await getWeeklyAnalytics(vendorId, marketId);

// 4. Check AI recommendations
const recs = await getRecommendations(vendorId);

// 5. Create flash sale if recommended
if (recs.some(r => r.type === "PRICING")) {
  await createFlashSale(...);
}
```

### Workflow 2: During Business
```typescript
// Monitor in real-time
const dashboard = await VendorDashboard();

// When sale happens
await recordSale(vendorId, marketId, [{quantity, pricePerUnit}]);

// Update status (busy → closed when near limit)
if (sold >= capacity) {
  await updateStallStatus(vendorId, marketId, { status: "SOLDOUT" });
}
```

### Workflow 3: End of Day
```typescript
// Update analytics
await updateVendorAnalytics(vendorId, marketId, today);

// Get today summary
const summary = await getDailySalesSummary(vendorId, marketId);
console.log(`Earned: RM ${summary.totalSales}`);

// Toggle off
await toggleStallPresence(vendorId, marketId, assignmentId, false);

// Tomorrow's AI recommendations
await generateAIRecommendations(vendorId, marketId);
```

---

## 🧮 Calculations

### Flash Sale Discount Price
```
discountedPrice = originalPrice × (1 - discountPercentage / 100)
// Example: RM 50 with 20% off = RM 50 × 0.8 = RM 40
```

### Pasar-Drive Total
```
totalAmount = SUM(quantity × pricePerUnit for all items)
```

### Average Transaction Value
```
avgTransactionValue = totalSales / transactionCount
```

### Peak Hour
```
peakHour = hour with most transactions
```

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Flash sale not showing | Check `isActive = true` and `endTime > now` |
| Stall not on map | Verify `isPresent = true` and GPS coordinates set |
| Empty recommendations | Run `generateAIRecommendations()` - needs data first |
| Chat history missing | Check `ChatMessage` table - verify `sessionId` matches |
| Pasar-Drive total wrong | Recalculate all `PasarDriveItem.subtotal` values |
| AI response slow | Wait for `openai.chat.completions.create()` - takes 2-5s |

---

## 📊 Query Examples

### Get all active vendors in market
```typescript
const stalls = await getActiveStalls(marketId);
```

### Get nearby vendors (within 1km)
```typescript
const nearby = await getNearbyStalls(latitude, longitude, 1);
```

### Get vendor's best day
```typescript
const weekly = await getWeeklyAnalytics(vendorId, marketId);
const bestDay = Object.entries(weekly.dailyBreakdown)
  .sort(([,a], [,b]) => b.totalSales - a.totalSales)[0];
```

### Get top selling items across vendors
```typescript
const items = await getTopSellingItems(vendorId);
const top3 = items.slice(0, 3);
```

---

## ⚡ Performance Tips

1. **Use `revalidatePath()` after mutations** - Keeps data fresh
2. **Batch analytics updates** - Call `updateVendorAnalytics()` once per day
3. **Generate recommendations daily** - Not real-time, expensive operation
4. **Cache stall positions** - Use interval for updates instead of continuous
5. **Index for speed** - All tables have necessary indexes pre-added

---

## 🔐 Authentication

All server actions require Supabase credentials from `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
```

No explicit auth needed in actions (uses Supabase RLS).

---

## 🚀 Deployment Checklist

- [ ] Database migration applied
- [ ] Environment variables set
- [ ] All 4 pages created and tested
- [ ] Components integrated
- [ ] Real-time intervals configured
- [ ] AI recommendations tested
- [ ] Error handling verified
- [ ] Performance optimized

---

**Ready to deploy! 🎉**
