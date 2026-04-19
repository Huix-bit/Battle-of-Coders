# ✅ Deployment Checklist - Vendor Ecosystem

## 🔧 Pre-Deployment Setup

### 1. Environment Configuration
- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set and valid
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set and valid
- [ ] `OPENAI_API_KEY` is set and valid
- [ ] All three env vars have non-empty values

**Verify:**
```bash
# In terminal
cat .env.local | grep SUPABASE
cat .env.local | grep OPENAI
```

---

### 2. Dependencies Installed
- [ ] `npm install` has been run
- [ ] `node_modules/` folder exists
- [ ] No missing dependencies in `package.json`
- [ ] Next.js 16.2.4 installed
- [ ] React 19.2.4 installed
- [ ] Supabase client installed
- [ ] OpenAI SDK installed

**Verify:**
```bash
npm ls @supabase/supabase-js
npm ls openai
npm ls next
npm ls react
```

---

### 3. TypeScript Setup
- [ ] `tsconfig.json` exists
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Aliases configured (`@/*` should work)

**Verify:**
```bash
npx tsc --noEmit
# Should have 0 errors
```

---

## 🗄️ Database Migration

### 1. Schema Creation
- [ ] Log into Supabase dashboard
- [ ] Navigate to SQL Editor
- [ ] Create new query
- [ ] Paste contents of `database/vendor_ecosystem_schema.sql`
- [ ] Execute the query
- [ ] Wait for success notification

**Verify - Check all 11 tables exist:**
```bash
# In Supabase SQL Editor, run:
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected tables:**
```
- stall_status
- vendor_menu
- sale
- flash_sale
- pasar_drive
- pasar_drive_item
- duit_pecah
- chat_message
- registration_state
- vendor_analytics
- recommendation
```

### 2. Views and Indexes
- [ ] Verify views created:
  ```sql
  SELECT viewname FROM pg_views WHERE schemaname = 'public';
  -- Should see: active_stalls, daily_sales_summary
  ```

- [ ] Verify indexes exist:
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'stall_status';
  SELECT indexname FROM pg_indexes WHERE tablename = 'sale';
  SELECT indexname FROM pg_indexes WHERE tablename = 'flash_sale';
  -- Should see multiple indexes
  ```

---

## 📁 File Structure Verification

### 1. Server Actions Created
- [ ] `src/actions/aiRegistration.ts` exists (300+ lines)
- [ ] `src/actions/stallStatus.ts` exists (250+ lines)
- [ ] `src/actions/sellingTools.ts` exists (350+ lines)
- [ ] `src/actions/analytics.ts` exists (400+ lines)

**Verify:**
```bash
ls -la src/actions/
# Should see 4 .ts files
wc -l src/actions/*.ts
# Should show line counts above
```

### 2. Components Created
- [ ] `src/components/ai-registration-chat.tsx` exists
- [ ] `src/components/vendor-dashboard.tsx` exists
- [ ] `src/components/selling-tools-panel.tsx` exists

**Verify:**
```bash
ls -la src/components/
# Should see 3 .tsx files
```

### 3. Database Schema
- [ ] `database/vendor_ecosystem_schema.sql` exists

**Verify:**
```bash
ls -la database/
# Should see vendor_ecosystem_schema.sql
```

---

## 🎨 Page Routes Setup

### Pages to Create

#### 1. AI Registration Page
**File:** `src/app/daftar-ai/page.tsx`
```typescript
import { AIRegistrationChat } from "@/components/ai-registration-chat";

export default function DaftarAIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-800 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Pendaftaran Penjaja via AI
        </h1>
        <AIRegistrationChat />
      </div>
    </div>
  );
}
```

#### 2. Vendor Dashboard Page
**File:** `src/app/vendor/dashboard/page.tsx`
```typescript
"use client";
import { VendorDashboard } from "@/components/vendor-dashboard";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const vendorId = searchParams.get("vendorId") || "v-demo";
  const marketId = searchParams.get("marketId") || "m-demo";

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <VendorDashboard vendorId={vendorId} marketId={marketId} />
    </div>
  );
}
```

#### 3. Selling Tools Page
**File:** `src/app/vendor/tools/page.tsx`
```typescript
"use client";
import { SellingToolsPanel } from "@/components/selling-tools-panel";
import { useSearchParams } from "next/navigation";

export default function ToolsPage() {
  const searchParams = useSearchParams();
  const vendorId = searchParams.get("vendorId") || "v-demo";
  const marketId = searchParams.get("marketId") || "m-demo";

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <SellingToolsPanel vendorId={vendorId} marketId={marketId} />
    </div>
  );
}
```

**Verify all three pages created:**
```bash
ls -la src/app/daftar-ai/
ls -la src/app/vendor/dashboard/
ls -la src/app/vendor/tools/
# Each should have page.tsx
```

---

## 🧪 Functionality Testing

### Test 1: AI Registration
- [ ] Navigate to `http://localhost:3000/daftar-ai`
- [ ] Page loads without errors
- [ ] Can type message
- [ ] AI responds (wait 2-5 seconds)
- [ ] Data extraction displays
- [ ] "Complete Registration" button appears
- [ ] After completion, vendor saved to database

**Test Steps:**
```
1. Go to /daftar-ai
2. Type: "Saya Fatimah, saya jual mee goreng di pasar..."
3. Wait for AI response
4. Continue conversation or complete registration
5. Check Supabase: SELECT * FROM registration_state WHERE status = 'COMPLETED';
```

### Test 2: Stall Toggle
- [ ] Navigate to dashboard with query params: `/vendor/dashboard?vendorId=v-1&marketId=m-1`
- [ ] Page loads without errors
- [ ] "I'm Here" button visible and clickable
- [ ] Click button → changes color
- [ ] Check database: `SELECT * FROM stall_status WHERE vendor_id = 'v-1';`
- [ ] Status should be "ACTIVE" or "CLOSED"

**Test Steps:**
```
1. Create vendor first (or use existing)
2. Get vendorId from Supabase: SELECT id FROM vendor LIMIT 1;
3. Navigate to dashboard with that vendorId
4. Click "I'm Here" button
5. Check stall_status table for updated record
```

### Test 3: Flash Sale Creation
- [ ] Navigate to `/vendor/tools?vendorId=v-1&marketId=m-1`
- [ ] Click "⚡ Flash Sale" tab
- [ ] Fill form: original price, discount %, duration
- [ ] Click "Create Flash Sale"
- [ ] Check database: `SELECT * FROM flash_sale WHERE vendor_id = 'v-1';`
- [ ] Record should exist with discounted price calculated

**Test Steps:**
```
1. On tools page, click Flash Sale tab
2. Enter: Price: 50, Discount: 20%, Duration: 30 min
3. Click button
4. Expected: (50 × 0.8) = RM 40 discounted price
5. Verify in DB
```

### Test 4: Analytics
- [ ] Create 10+ sales: `INSERT INTO sale (...) VALUES (...)`
- [ ] Navigate to dashboard
- [ ] Check "Today's Sales" stat card
- [ ] Should show total, transaction count, peak hour
- [ ] Click on dashboard multiple times
- [ ] Stats update every 30 seconds

**Test SQL:**
```sql
INSERT INTO sale (vendor_id, market_id, quantity, total_amount, sale_time, payment_method)
VALUES 
  ('v-1', 'm-1', 2, 30, NOW(), 'CASH'),
  ('v-1', 'm-1', 3, 45, NOW(), 'CASH'),
  ('v-1', 'm-1', 1, 15, NOW(), 'CASH');
```

### Test 5: AI Recommendations
- [ ] Dashboard page loads
- [ ] "AI Recommendations" section visible
- [ ] Wait for AI to generate (or generate manually)
- [ ] Recommendations display with type, title, description
- [ ] At least 3 suggestions showing

**Test Steps:**
```typescript
// In server action or directly:
const recs = await generateAIRecommendations('v-1', 'm-1');
console.log('Generated:', recs.length, 'recommendations');
```

---

## 🔐 Security Verification

- [ ] No `OPENAI_API_KEY` exposed in frontend code
- [ ] All database writes use server actions
- [ ] Environment variables not logged to console
- [ ] No API keys in git history: `git log --all -S 'sk-' --oneline`
- [ ] `.env.local` is in `.gitignore`

**Verify:**
```bash
grep -r "OPENAI_API_KEY" src/components/ src/app/ --include="*.tsx"
# Should return no results (API key only in server actions)

grep -r "sk-" . --include="*.ts" --include="*.tsx" 2>/dev/null
# Should return no results (hardcoded keys)
```

---

## ⚡ Performance Verification

### Load Time Test
- [ ] Dashboard loads in < 3 seconds (with 30-second poll cycle)
- [ ] Flash sale creation completes in < 2 seconds
- [ ] Analytics queries complete in < 1 second

**Measure:**
```typescript
// In browser console
console.time('dashboard');
// navigate to dashboard
console.timeEnd('dashboard');
```

### Database Query Performance
- [ ] Daily sales query < 500ms
- [ ] Get active stalls query < 200ms
- [ ] Nearby stalls query (Haversine) < 1000ms

**Test:**
```sql
EXPLAIN ANALYZE
SELECT * FROM active_stalls 
WHERE market_id = 'm-1';
```

---

## 🚀 Deployment

### Development (Local Testing)
```bash
npm run dev
# Server runs at http://localhost:3000
# Test all features
```

### Production Build
```bash
npm run build
# Check for build errors
# Should see "Compiled successfully"

npm run start
# Test production build locally
```

### Vercel Deployment (Recommended)
- [ ] Connect GitHub repo to Vercel
- [ ] Add environment variables in Vercel dashboard
- [ ] Trigger deployment from Vercel UI
- [ ] Wait for build to complete
- [ ] Test at deployed URL

**Environment variables to set in Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
```

---

## 📋 Launch Checklist

### Before Going Live
- [ ] All tests passed
- [ ] No console errors in browser
- [ ] No server errors in terminal
- [ ] Database backup created
- [ ] Documentation reviewed by team
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Rollback plan documented

### Go Live Checklist
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Check database for new records
- [ ] Verify AI responses working
- [ ] Test vendor registration flow
- [ ] Confirm all features responsive

### Post-Launch Monitoring
- [ ] Check server logs daily for errors
- [ ] Monitor OpenAI API usage
- [ ] Track database growth
- [ ] Collect vendor feedback
- [ ] Monitor response times
- [ ] Set up alerts for failures

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on routes | Create all 3 pages: daftar-ai, dashboard, tools |
| Env vars not loading | Restart dev server after .env.local changes |
| Database not accessible | Verify SUPABASE_URL and ANON_KEY |
| AI not responding | Check OPENAI_API_KEY and API quota |
| Build fails | Run `npm install` and `npm run build` again |
| Styles not loading | Run `npm install` and check tailwind.config.ts |
| Database migrations fail | Check SQL syntax in vendor_ecosystem_schema.sql |

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **OpenAI Docs:** https://platform.openai.com/docs
- **Tailwind Docs:** https://tailwindcss.com/docs
- **React Docs:** https://react.dev

---

## ✨ Success Criteria

You're ready to launch when:

✅ Database has all 11 tables  
✅ All 3 pages created and accessible  
✅ AI registration works (saves vendor to DB)  
✅ Stall toggle updates immediately  
✅ Flash sales display correctly  
✅ Analytics show sales data  
✅ No errors in console or terminal  
✅ Performance acceptable (< 3s load time)  
✅ All env vars configured  
✅ Security check passed  

---

**Ready for launch! 🎉**

**Next steps:**
1. Run database migration
2. Create the 3 pages
3. Test all features
4. Deploy to production
5. Monitor for issues

**Questions?** Check TROUBLESHOOTING.md or QUICK_REFERENCE.md
