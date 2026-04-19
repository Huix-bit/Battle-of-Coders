# 🛠️ Troubleshooting Guide - Vendor Ecosystem

## 🔍 Issues by Module

---

## 🤖 AI Registration Issues

### Problem: Registration chat not responding
**Symptoms:** User sends message, nothing happens for >10 seconds

**Causes & Fixes:**
1. OpenAI API key invalid or expired
   ```env
   # Check .env.local
   OPENAI_API_KEY=sk-... # Must be valid
   ```
   
2. OpenAI API rate limited
   - Wait 60 seconds before retrying
   - Check OpenAI dashboard for quota

3. Network timeout
   - Check internet connection
   - Supabase URL reachable: test `supabase.health()`

4. Session ID not persisting
   - Check browser localStorage: `sessionStorage` for `registrationSessionId`
   - Clear cache and retry

**Debug Steps:**
```typescript
// In browser console
await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'test' })
}).then(r => r.json()).then(console.log);
```

---

### Problem: Chat history not saving
**Symptoms:** Reload page, chat is gone

**Causes & Fixes:**
1. `ChatMessage` table doesn't exist
   - Run `vendor_ecosystem_schema.sql` in Supabase
   
2. Supabase RLS policy blocking inserts
   ```sql
   -- Test policy
   SELECT * FROM chat_message LIMIT 1;
   ```
   
3. `sessionId` not set
   - Component must initialize: `const [sessionId] = useState(generateId())`

**Debug Steps:**
```typescript
// Check messages in DB
const { data } = await supabase
  .from('chat_message')
  .select('*')
  .eq('session_id', sessionId);
console.log('Messages:', data);
```

---

### Problem: AI keeps asking same question
**Symptoms:** "What is your business type?" asked twice

**Causes & Fixes:**
1. System prompt not including previous messages
   - Check `processVendorRegistrationChat()` passes all `previousMessages`
   
2. `checkRegistrationComplete()` not recognizing data
   - Edit pattern matching in `extractVendorData()`
   - Test with: `extractVendorData("Saya jual kuih")`

3. Database not updating extracted data
   - Verify `RegistrationState` table has new record
   - Check `extractedData` JSON field

**Debug Steps:**
```typescript
// Test extraction
const testMessage = "Saya adalah Hajah Nur, jual nasi goreng...";
const extracted = extractVendorData(testMessage);
console.log('Extracted:', extracted);
```

---

## 📍 Stall Status Issues

### Problem: "I'm Here" toggle not working
**Symptoms:** Click button, nothing happens

**Causes & Fixes:**
1. `StallStatus` table doesn't exist
   - Run database migration
   
2. `assignmentId` is null/undefined
   - Check Market_Schedules linking vendor → market
   - Verify: `assignmentId` passed from page context
   
3. Supabase client not initialized
   - Check import: `import { createClient } from '@supabase/supabase-js'`
   - Verify `supabaseClient.ts` uses correct env vars

**Debug Steps:**
```typescript
// Check if table exists
const { data, error } = await supabase
  .from('stall_status')
  .select('*')
  .limit(1);
console.log('Table exists:', !error);
```

---

### Problem: Stall not appearing on map
**Symptoms:** Vendor toggled "I'm Here" but not visible

**Causes & Fixes:**
1. GPS coordinates (latitude/longitude) not set
   - Call `updateStallLocation()` after toggle
   - Provide valid GPS: `latitude: 2.1896, longitude: 102.2501` (Melaka example)
   
2. `isPresent = false` in database
   - Check `StallStatus.is_present` column
   - Verify toggle actually updated it
   
3. Map component not calling `getActiveStalls()`
   - Customer map must query: `SELECT * FROM active_stalls`
   - Refresh interval < 30 seconds for live map

**Debug Steps:**
```sql
-- Direct SQL in Supabase
SELECT vendor_id, is_present, latitude, longitude 
FROM stall_status 
WHERE market_id = 'market-123';
```

---

### Problem: "Nearby stalls" showing wrong distance
**Symptoms:** Vendor 100m away doesn't show in getNearbyStalls(lat, lng, 1)

**Causes & Fixes:**
1. GPS coordinates have wrong scale
   - Latitude/longitude must be decimal: `2.1896`, not `2189.6`
   
2. Radius calculation wrong
   - `getNearbyStalls(lat, lng, 1)` = 1 KILOMETER
   - Use `getNearbyStalls(lat, lng, 0.1)` for 100 meters

3. Haversine formula error
   - Check implementation uses: `6371` km as Earth radius
   - Not `6400` or other values

**Debug Steps:**
```typescript
// Test distance calculation
const dist = calculateDistance(2.1896, 102.2501, 2.1900, 102.2505);
console.log('Distance (km):', dist); // Should be ~0.4 km
```

---

## 💰 Selling Tools Issues

### Problem: Flash sale not showing "Active" status
**Symptoms:** Flash sale created, but not in list

**Causes & Fixes:**
1. `endTime` already passed
   - Check: `NOW() > endTime`
   - Flash sale auto-expires, doesn't mark inactive
   
2. `isActive` manually set to false
   - Update: `UPDATE flash_sale SET is_active = true WHERE id = '...'`
   
3. Discount percentage = 0 or negative
   - Must be: `0 < discountPercentage < 100`
   - Test with: `createFlashSale(..., discountPercentage: 20, ...)`

**Debug Steps:**
```sql
SELECT * FROM flash_sale 
WHERE vendor_id = 'v-123' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### Problem: Pasar-Drive order total is wrong
**Symptoms:** Added 2 items, total doesn't match

**Causes & Fixes:**
1. `addItemToPasarDriveOrder()` not recalculating total
   - Check function: `SUM(quantity * price_per_unit)`
   - Should run after every item added
   
2. Database update not committing
   - Check transaction handling
   - Use `await` for all DB operations
   
3. stale data in component
   - Refresh order after add: `const updated = await getPasarDriveOrder(driveId)`

**Debug Steps:**
```typescript
// Create minimal test
const orderId = await createPasarDriveOrder('market-1');
await addItemToPasarDriveOrder(orderId, 'vendor-1', 'item-1', 1, 50);
const order = await getPasarDriveOrder(orderId);
console.log('Total should be 50:', order.totalAmount);
```

---

### Problem: Duit Pecah request not appearing to nearby vendors
**Symptoms:** Create request, other vendors don't see it

**Causes & Fixes:**
1. `getPendingSmallChangeRequests()` not filtering correctly
   - Check: `WHERE status = 'PENDING'`
   - And: `WHERE DATE(created_at) = TODAY()`
   
2. Vendor not actually "nearby"
   - Check `requestSmallChange()` filters by distance
   - Verify: distance <= 0.5 km (500 meters)
   
3. Real-time sync not working
   - Dashboard needs refresh interval
   - Don't wait for automatic; click refresh button

**Debug Steps:**
```sql
SELECT * FROM duit_pecah 
WHERE status = 'PENDING' 
  AND created_at > NOW() - INTERVAL '1 hour';
```

---

### Problem: Sales not recording
**Symptoms:** Create sale, doesn't appear in analytics

**Causes & Fixes:**
1. `recordSale()` throwing error silently
   - Add try-catch logging:
   ```typescript
   try {
     await recordSale(...);
   } catch (e) {
     console.error('Sale error:', e);
   }
   ```
   
2. `Sale` table doesn't exist
   - Verify database migration ran
   
3. Invalid transaction data
   - Check: `quantity > 0`, `totalAmount > 0`
   - Type validation: `typeof totalAmount === 'number'`

**Debug Steps:**
```typescript
// Test sale recording
const result = await recordSale(
  'v-123',
  'm-456',
  2,
  100
);
console.log('Recorded:', result);
```

---

## 📊 Analytics Issues

### Problem: Daily summary empty
**Symptoms:** `getDailySalesSummary()` returns all zeros

**Causes & Fixes:**
1. No sales recorded yet
   - Create test sales first: `await recordSale(...)`
   - Check: `SELECT COUNT(*) FROM sale WHERE DATE(sale_time) = TODAY()`
   
2. Time zone mismatch
   - Supabase defaults to UTC
   - Use: `WHERE DATE(sale_time AT TIME ZONE 'Asia/Kuala_Lumpur') = TODAY()`
   
3. Query filtering wrong date
   - Today means: `sale_time >= TODAY()` AND `sale_time < TODAY() + 1 day`

**Debug Steps:**
```sql
SELECT sale_time, quantity, total_amount 
FROM sale 
WHERE vendor_id = 'v-123' 
  AND DATE(sale_time) = TODAY()
ORDER BY sale_time DESC;
```

---

### Problem: Peak hour shows NULL
**Symptoms:** `peakHour` is null or 0

**Causes & Fixes:**
1. No sales today
   - Create test sales first
   
2. Sales don't have times
   - Verify `sale.sale_time` is set
   - Check: `sale_time IS NOT NULL`
   
3. All sales in same hour
   - Peak hour = hour with most transactions
   - If all in 5pm, peakHour = 17

**Debug Steps:**
```typescript
// Check hourly breakdown
const summary = await getDailySalesSummary(vendorId, marketId);
console.log('Hourly:', summary.hourlyBreakdown);
// Should show distribution like: { 17: 5, 18: 3, 19: 2 }
```

---

### Problem: AI recommendations not generating
**Symptoms:** `generateAIRecommendations()` returns empty array

**Causes & Fixes:**
1. OpenAI API key invalid
   - Test: `await openai.models.list()`
   
2. Insufficient sales data (< 10 transactions)
   - Create test sales first
   - Recommendations require minimum data
   
3. JSON parsing error in response
   - Check: `JSON.parse()` can handle response
   - Log raw response before parsing

**Debug Steps:**
```typescript
// Test AI generation
const recs = await generateAIRecommendations('v-123', 'm-456');
console.log('Recommendations:', recs);

// Should return array like:
// [{ type: 'PRICING', title: '...', ... }]
```

---

## 🔗 Database Connection Issues

### Problem: "Cannot connect to database"
**Symptoms:** Error on every server action

**Causes & Fixes:**
1. `.env.local` missing or invalid
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   OPENAI_API_KEY=sk-...
   ```
   
2. Supabase project down
   - Check: supabase.com/status
   
3. Network firewall blocking
   - Test: `curl https://xxxxx.supabase.co/rest/v1/`

**Debug Steps:**
```typescript
// Test connection
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(URL, KEY);
const { data, error } = await supabase.from('vendor').select('*').limit(1);
console.log('Connected:', !error);
```

---

### Problem: "Permission denied" on queries
**Symptoms:** All queries fail with RLS error

**Causes & Fixes:**
1. Row Level Security (RLS) too restrictive
   - Disable for development:
   ```sql
   ALTER TABLE vendor DISABLE ROW LEVEL SECURITY;
   ```
   
2. User not authenticated
   - Server actions run as anonymous user
   - RLS policy must allow anonymous access
   
3. Policy using `auth.uid()` but user not logged in
   - Remove `auth.uid()` check or use `auth.uid() IS NULL`

**Debug Steps:**
```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('vendor', 'stall_status', 'sale');

-- Disable for testing
ALTER TABLE vendor DISABLE ROW LEVEL SECURITY;
```

---

## 🚀 Performance Issues

### Problem: Dashboard takes 5+ seconds to load
**Symptoms:** Long wait on `/vendor/dashboard`

**Causes & Fixes:**
1. Too many queries running in parallel
   - Vendor dashboard runs ~5 queries: stall status, daily summary, flash sales, recommendations, analytics
   - Check each query time: `console.time('query'); ... console.timeEnd('query');`
   
2. AI recommendations blocking initial load
   - Don't generate on component mount
   - Fetch existing recommendations, generate in background
   
3. Missing database indexes
   - Indexes included in `vendor_ecosystem_schema.sql`
   - Check indexes exist:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'stall_status';
   ```

**Debug Steps:**
```typescript
// Add timing
console.time('dashboard');
const data = await Promise.all([
  getStallStatus(...),
  getDailySalesSummary(...),
  getActiveFlashSales(...)
]);
console.timeEnd('dashboard');
```

---

### Problem: Real-time updates too slow
**Symptoms:** Toggle "I'm Here", takes 10 seconds to update

**Causes & Fixes:**
1. Refresh interval too long
   - Default: 30 seconds
   - Reduce to: 10-15 seconds for faster updates
   ```typescript
   setInterval(() => refetch(), 15000); // 15 seconds
   ```
   
2. Multiple API calls happening together
   - Batch requests: `Promise.all([...])`
   
3. Component re-rendering too much
   - Use `useMemo()` for heavy computations
   - Check for unnecessary state updates

**Debug Steps:**
```typescript
// Measure actual API time
console.time('api');
await toggleStallPresence(...);
console.timeEnd('api');
```

---

## 🔐 Security Issues

### Problem: "Unauthorized" errors
**Symptoms:** Some operations fail with auth error

**Causes & Fixes:**
1. Using client-side instead of server actions
   - All write operations must be in server actions (`"use server"`)
   - Cannot call Supabase directly from components
   
2. API key exposed in client code
   - Use environment variables, not hardcoded strings
   - `NEXT_PUBLIC_` only for public values
   - `OPENAI_API_KEY` must never be public
   
3. Wrong Supabase key type
   - Use `ANON_KEY` for public access
   - Use `SERVICE_ROLE_KEY` only in admin contexts

**Debug Steps:**
```typescript
// Correct: Server action
"use server"
const result = await supabase.from('sale').insert({...});

// Wrong: Client component
const supabase = createClient(URL, KEY); // DON'T DO THIS
```

---

## 📝 Log Analysis

### Where to find logs:
```
Client logs: Browser DevTools Console (F12)
Server logs: Terminal where `npm run dev` is running
Database logs: Supabase Dashboard > Logs
OpenAI logs: https://platform.openai.com/account/api-keys
```

### Enable verbose logging:
```typescript
// Add to server actions
console.log('[DEBUG]', functionName, { input, output });
console.error('[ERROR]', functionName, error);
```

---

## ✅ Testing Checklist

After each fix, verify:

- [ ] Database connection works
- [ ] Sample vendor registration completes
- [ ] "I'm Here" toggle updates immediately
- [ ] Flash sale shows in list
- [ ] Daily sales appear in analytics
- [ ] AI recommendations generate (or error explains why)
- [ ] No console errors in DevTools
- [ ] Server logs show no errors

---

## 🆘 Still Stuck?

1. **Check recent error logs**
   ```bash
   # Terminal
   npm run dev
   # Look for red error messages
   ```

2. **Test Supabase directly**
   ```typescript
   // Copy-paste in browser console
   const supabase = window.supabaseClient;
   const {data, error} = await supabase.from('vendor').select('*');
   console.log(data, error);
   ```

3. **Test OpenAI directly**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer sk-..."
   ```

4. **Enable debug mode**
   ```env
   DEBUG=*
   ```

5. **Ask for help** with:
   - Error message (exact text)
   - Steps to reproduce
   - Which module (registration, stall, selling, analytics)
   - Browser console logs (F12 > Console tab)
   - Server logs (terminal output)

---

**Happy debugging! 🐛**
