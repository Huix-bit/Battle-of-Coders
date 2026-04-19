# Supabase Migration Guide

This project has been successfully migrated from **Prisma** to **Supabase** as the database solution.

## What Changed

- ❌ **Removed:**
  - `@prisma/client` and `prisma` packages
  - `prisma/` directory with schema and migrations
  - `src/lib/prisma.ts` (Prisma client initialization)
  - Prisma build scripts and database commands

- ✅ **Added:**
  - `@supabase/supabase-js` package
  - `src/lib/supabaseClient.ts` (Supabase client initialization)
  - `database/supabase_init.sql` (Database schema setup)
  - `database/supabase_seed.sql` (Sample data)
  - `.env.example` (Environment configuration template)

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be initialized
5. Go to **Settings → API** to find your:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Set Up Environment Variables

Create a `.env.local` file in the `pasar-smart/` directory:

```bash
cp .env.example .env.local
```

Then update `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Initialize Database Schema

1. Open the Supabase SQL Editor (in your project dashboard)
2. Copy and paste the contents of `database/supabase_init.sql`
3. Run the SQL to create tables and indexes

### 4. (Optional) Add Sample Data

To populate the database with initial sample data:

1. Open the Supabase SQL Editor
2. Copy and paste the contents of `database/supabase_seed.sql`
3. Run the SQL to add sample vendors and markets

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to start using the application.

## Database Schema

### Vendor Table
Stores information about market vendors/merchants.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (UUID) |
| nama_perniagaan | text | Business name |
| nama_panggilan | text | Nickname |
| no_telefon | text | Phone number |
| email | text | Email address |
| jenis_jualan | text | Type of sales/business |
| yuran_harian_sen | integer | Daily fee in cents |
| status | text | DRAFT \| AKTIF \| GANTUNG |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last updated timestamp |

### Market Table
Stores information about market locations.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (UUID) |
| nama_pasar | text | Market name |
| daerah | text | District/Region |
| alamat | text | Address |
| hari_operasi | text | Operation days |
| status | text | DIRANCANG \| BEROPERASI \| DITUTUP |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last updated timestamp |

### Assignment Table
Stores vendor-to-market assignments/stall allocations.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (UUID) |
| vendor_id | text | Foreign key to vendor |
| market_id | text | Foreign key to market |
| tarikh_mula | timestamp | Start date |
| tarikh_tamat | timestamp | End date (optional) |
| petak_stall | text | Stall number |
| status | text | DIJADUALKAN \| DISAHKAN \| BERJALAN \| SELESAI \| BATAL |
| catatan | text | Notes/remarks |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last updated timestamp |

## Code Changes by File

### Action Files (Server Actions)
- `src/actions/vendors.ts` - Uses `supabase.from('vendor')`
- `src/actions/markets.ts` - Uses `supabase.from('market')`
- `src/actions/assignments.ts` - Uses `supabase.from('assignment')`

### Page Files
- `src/app/page.tsx` - Fetches record counts
- `src/app/penjaja/page.tsx` - Fetches vendors list
- `src/app/jadual/page.tsx` - Fetches markets and assignments

### Library Files
- `src/lib/supabaseClient.ts` - Supabase client initialization
- `src/lib/reports.ts` - Report queries using Supabase joins

## API Patterns Used

### Count Records
```typescript
const { count } = await supabase
  .from('table')
  .select('id', { count: 'exact', head: true });
```

### Select with Ordering
```typescript
const { data } = await supabase
  .from('table')
  .select('*')
  .order('column', { ascending: true });
```

### Insert Data
```typescript
await supabase.from('table').insert([{ column: value }]);
```

### Update Data
```typescript
await supabase
  .from('table')
  .update({ column: newValue })
  .eq('id', id);
```

### Delete Data
```typescript
await supabase.from('table').delete().eq('id', id);
```

### Join Queries
```typescript
const { data } = await supabase
  .from('assignment')
  .select('*, vendor (*), market (*)')
  .order('tarikh_mula', { ascending: true });
```

## Security Considerations

Currently, the Row Level Security (RLS) policies are set to allow all authenticated users full access. For production, you should:

1. Implement stricter RLS policies based on user roles
2. Use Supabase authentication (Auth)
3. Validate user permissions server-side

## Troubleshooting

### Missing Environment Variables
Make sure `.env.local` has both:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Connection Errors
- Check your Supabase project is active
- Verify credentials are correct
- Check network connectivity to Supabase

### Column Not Found Errors
- Ensure you've run `supabase_init.sql` to create tables
- Column names use snake_case (e.g., `nama_perniagaan` not `namaPerniagaan`)

## Next Steps

1. Deploy to production (Vercel, Netlify, etc.)
2. Implement authentication with Supabase Auth
3. Set up RLS policies for multi-tenant support
4. Configure backups in Supabase settings
5. Monitor database performance in Supabase logs

For more information, visit [Supabase Documentation](https://supabase.com/docs)
