-- Smart Night Market — additive schema for PASAR-SMART (PostgreSQL / Supabase)
--
-- Apply this AFTER database/supabase_init.sql (existing vendor / market / assignment).
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Users from the product spec map to:
--   • auth.users — credentials (managed by Supabase Auth; no password_hash in public schema)
--   • profiles — app-visible user row (name, role, timestamps)
--
-- Stalls.vendor_id references existing vendor(id) so current penjaja records stay the source of truth.
-- Link auth users ↔ vendors in a later step (e.g. vendor.auth_user_id) if needed.

-- ---------------------------------------------------------------------------
-- ENUM types (idempotent)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'VENDOR', 'BUYER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE stall_status AS ENUM ('OPEN', 'BUSY', 'SOLD_OUT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- profiles — mirrors “Users” (auth + role); id matches auth.users.id
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'BUYER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);

-- ---------------------------------------------------------------------------
-- stalls — live stall / map / flash sale state
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stalls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendor_id TEXT NOT NULL REFERENCES vendor (id) ON DELETE CASCADE,
  market_id TEXT REFERENCES market (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Lain-lain',
  is_here BOOLEAN NOT NULL DEFAULT FALSE,
  status stall_status NOT NULL DEFAULT 'OPEN',
  flash_sale_active BOOLEAN NOT NULL DEFAULT FALSE,
  map_location_x DOUBLE PRECISION,
  map_location_y DOUBLE PRECISION,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stalls_vendor_id ON stalls (vendor_id);
CREATE INDEX IF NOT EXISTS idx_stalls_market_id ON stalls (market_id);
CREATE INDEX IF NOT EXISTS idx_stalls_status ON stalls (status);

-- ---------------------------------------------------------------------------
-- orders — multi-vendor checkout + Pasar-Drive
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  buyer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'PENDING',
  is_pasar_drive BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- ---------------------------------------------------------------------------
-- order_items — line items spanning stalls
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  stall_id TEXT NOT NULL REFERENCES stalls (id) ON DELETE RESTRICT,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_stall_id ON order_items (stall_id);

-- ---------------------------------------------------------------------------
-- Auto-create profile row when a Supabase Auth user is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r user_role;
BEGIN
  r := CASE NEW.raw_user_meta_data->>'role'
    WHEN 'ADMIN' THEN 'ADMIN'::user_role
    WHEN 'VENDOR' THEN 'VENDOR'::user_role
    WHEN 'BUYER' THEN 'BUYER'::user_role
    ELSE 'BUYER'::user_role
  END;
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    r
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security (permissive for anon + authenticated — tighten in production)
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "stalls_all_authenticated" ON stalls;
DROP POLICY IF EXISTS "orders_all_authenticated" ON orders;
DROP POLICY IF EXISTS "order_items_all_authenticated" ON order_items;
DROP POLICY IF EXISTS "stalls_all_anon" ON stalls;
DROP POLICY IF EXISTS "orders_all_anon" ON orders;
DROP POLICY IF EXISTS "order_items_all_anon" ON order_items;
DROP POLICY IF EXISTS "profiles_all_anon" ON profiles;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role / future admin bypass can use service key; anon app may need INSERT for signup via Supabase only.
-- Development: allow authenticated full CRUD on app tables used by Server Actions with user session later.
CREATE POLICY "stalls_all_authenticated"
  ON stalls FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "orders_all_authenticated"
  ON orders FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "order_items_all_authenticated"
  ON order_items FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Match existing supabase_init pattern for vendor/market/assignment (anon Server Actions without login)
CREATE POLICY "stalls_all_anon"
  ON stalls FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "orders_all_anon"
  ON orders FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "order_items_all_anon"
  ON order_items FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "profiles_all_anon"
  ON profiles FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
