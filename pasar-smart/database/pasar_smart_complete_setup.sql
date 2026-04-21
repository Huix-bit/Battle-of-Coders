-- ============================================================
--  PASAR-SMART  •  Complete Supabase Setup
--  Run this ONCE in: Supabase Dashboard → SQL Editor
--  Safe to re-run (uses IF NOT EXISTS / OR REPLACE / DO NOTHING)
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE  (auth user mirror with extended fields)
-- ─────────────────────────────────────────────────────────────
-- Ensure the role check constraint includes all three roles (idempotent repair)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT        NOT NULL DEFAULT '',
  email                TEXT        NOT NULL DEFAULT '',
  role                 TEXT        NOT NULL DEFAULT 'user',
  vendor_id            TEXT,                         -- set when role = 'vendor'
  -- extended profile fields (used by /profile/edit)
  full_name            TEXT,
  phone_number         TEXT,
  preferred_district   TEXT        DEFAULT 'Melaka Tengah',
  date_of_birth        DATE,
  gender               TEXT,
  favorite_category    TEXT        DEFAULT 'Food & Beverage',
  dietary_preferences  JSONB       DEFAULT '{}',
  live_updates         BOOLEAN     DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure role constraint is correct (covers upgrades from older schema)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'vendor', 'user'));

-- Add any columns that may be missing in existing installs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vendor_id          TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name          TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_district TEXT DEFAULT 'Melaka Tengah';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth      DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender             TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_category  TEXT DEFAULT 'Food & Beverage';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dietary_preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS live_updates        BOOLEAN DEFAULT false;


-- ─────────────────────────────────────────────────────────────
-- 2. AUTO-UPDATE updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 3. AUTO-CREATE PROFILE ON SIGNUP
--    Fires when a new user is created in auth.users
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name',  'User'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role',  'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 4. VENDOR TABLE  (already exists — make sure it has email col)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama_perniagaan   TEXT NOT NULL,
  nama_panggilan    TEXT,
  no_telefon        TEXT,
  email             TEXT,
  jenis_jualan      TEXT NOT NULL DEFAULT 'Belum ditetapkan',
  yuran_harian_sen  INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'AKTIF',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vendor ADD COLUMN IF NOT EXISTS email TEXT;


-- ─────────────────────────────────────────────────────────────
-- 5. MARKET TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama_pasar    TEXT NOT NULL,
  daerah        TEXT NOT NULL,
  alamat        TEXT,
  hari_operasi  TEXT,
  kapasiti      INTEGER NOT NULL DEFAULT 30,
  status        TEXT NOT NULL DEFAULT 'BEROPERASI',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE market ADD COLUMN IF NOT EXISTS kapasiti INTEGER NOT NULL DEFAULT 30;


-- ─────────────────────────────────────────────────────────────
-- 6. ASSIGNMENT TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignment (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendor_id       TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  market_id       TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  tarikh_mula     TIMESTAMP NOT NULL,
  tarikh_tamat    TIMESTAMP,
  petak_stall     TEXT,
  status          TEXT NOT NULL DEFAULT 'DIJADUALKAN',
  catatan         TEXT,
  live_status     TEXT DEFAULT 'OFFLINE',
  flash_sale_active BOOLEAN DEFAULT false,
  flash_sale_info TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE assignment ADD COLUMN IF NOT EXISTS live_status       TEXT DEFAULT 'OFFLINE';
ALTER TABLE assignment ADD COLUMN IF NOT EXISTS flash_sale_active BOOLEAN DEFAULT false;
ALTER TABLE assignment ADD COLUMN IF NOT EXISTS flash_sale_info   TEXT;

CREATE INDEX IF NOT EXISTS idx_assignment_market_id   ON assignment(market_id);
CREATE INDEX IF NOT EXISTS idx_assignment_vendor_id   ON assignment(vendor_id);
CREATE INDEX IF NOT EXISTS idx_assignment_tarikh_mula ON assignment(tarikh_mula);


-- ─────────────────────────────────────────────────────────────
-- 7. STALL STATUS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stall_status (
  id                   TEXT NOT NULL PRIMARY KEY,
  vendor_id            TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  market_id            TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  assignment_id        TEXT NOT NULL REFERENCES assignment(id) ON DELETE CASCADE,
  is_present           BOOLEAN NOT NULL DEFAULT FALSE,
  status               TEXT NOT NULL DEFAULT 'INACTIVE',
  last_updated         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_stall_number TEXT,
  latitude             DECIMAL(10,8),
  longitude            DECIMAL(11,8),
  photo_url            TEXT
);

CREATE INDEX IF NOT EXISTS idx_stall_status_vendor_id    ON stall_status(vendor_id);
CREATE INDEX IF NOT EXISTS idx_stall_status_market_id    ON stall_status(market_id);
CREATE INDEX IF NOT EXISTS idx_stall_status_is_present   ON stall_status(is_present);
CREATE INDEX IF NOT EXISTS idx_stall_status_last_updated ON stall_status(last_updated);


-- ─────────────────────────────────────────────────────────────
-- 8. VENDOR MENU
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_menu (
  id           TEXT NOT NULL PRIMARY KEY,
  vendor_id    TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  item_name    TEXT NOT NULL,
  category     TEXT NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  description  TEXT,
  image_url    TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  source       TEXT DEFAULT 'manual',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vendor_menu ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';


-- ─────────────────────────────────────────────────────────────
-- 9. SALES TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale (
  id             TEXT NOT NULL PRIMARY KEY,
  vendor_id      TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  market_id      TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  item_id        TEXT REFERENCES vendor_menu(id) ON DELETE SET NULL,
  quantity       INTEGER NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_amount   DECIMAL(10,2) NOT NULL,
  sale_time      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method TEXT,
  notes          TEXT
);

CREATE INDEX IF NOT EXISTS idx_sale_vendor_id ON sale(vendor_id);
CREATE INDEX IF NOT EXISTS idx_sale_market_id ON sale(market_id);
CREATE INDEX IF NOT EXISTS idx_sale_sale_time ON sale(sale_time);


-- ─────────────────────────────────────────────────────────────
-- 10. FLASH SALES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flash_sale (
  id                  TEXT NOT NULL PRIMARY KEY,
  vendor_id           TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  market_id           TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  item_id             TEXT REFERENCES vendor_menu(id) ON DELETE SET NULL,
  item_name           TEXT,
  original_price      DECIMAL(10,2) NOT NULL,
  discounted_price    DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2),
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,
  quantity            INTEGER,
  quantity_sold       INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE flash_sale ADD COLUMN IF NOT EXISTS item_name TEXT;

CREATE INDEX IF NOT EXISTS idx_flash_sale_vendor_id ON flash_sale(vendor_id);
CREATE INDEX IF NOT EXISTS idx_flash_sale_is_active ON flash_sale(is_active);
CREATE INDEX IF NOT EXISTS idx_flash_sale_end_time  ON flash_sale(end_time);


-- ─────────────────────────────────────────────────────────────
-- 11. PASAR-DRIVE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pasar_drive (
  id                    TEXT NOT NULL PRIMARY KEY,
  customer_id           TEXT,
  market_id             TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  order_time            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estimated_pickup_time TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'PENDING',
  total_amount          DECIMAL(10,2) NOT NULL,
  payment_status        TEXT DEFAULT 'UNPAID'
);

CREATE TABLE IF NOT EXISTS pasar_drive_item (
  id             TEXT NOT NULL PRIMARY KEY,
  drive_id       TEXT NOT NULL REFERENCES pasar_drive(id) ON DELETE CASCADE,
  vendor_id      TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  item_id        TEXT REFERENCES vendor_menu(id) ON DELETE SET NULL,
  quantity       INTEGER NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  subtotal       DECIMAL(10,2) NOT NULL
);


-- ─────────────────────────────────────────────────────────────
-- 12. DUIT PECAH (legacy + new)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS duit_pecah_requests (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  requester_vendor_id TEXT REFERENCES vendor(id),
  market_id           TEXT REFERENCES market(id),
  amount_needed_rm    INTEGER NOT NULL,
  status              TEXT DEFAULT 'PENDING',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS duit_pecah (
  id                  TEXT NOT NULL PRIMARY KEY,
  requester_vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  provider_vendor_id  TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  market_id           TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  request_amount      DECIMAL(10,2) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'PENDING',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at        TIMESTAMPTZ
);


-- ─────────────────────────────────────────────────────────────
-- 13. AI CHAT & REGISTRATION STATE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_message (
  id         TEXT NOT NULL PRIMARY KEY,
  vendor_id  TEXT REFERENCES vendor(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_message_vendor_id  ON chat_message(vendor_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_session_id ON chat_message(session_id);

CREATE TABLE IF NOT EXISTS registration_state (
  id             TEXT NOT NULL PRIMARY KEY,
  session_id     TEXT NOT NULL UNIQUE,
  vendor_id      TEXT REFERENCES vendor(id) ON DELETE CASCADE,
  extracted_data JSONB,
  stage          TEXT NOT NULL DEFAULT 'INITIAL',
  is_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ─────────────────────────────────────────────────────────────
-- 14. VENDOR ANALYTICS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_analytics (
  id                    TEXT NOT NULL PRIMARY KEY,
  vendor_id             TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  market_id             TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  date                  DATE NOT NULL,
  total_sales           DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_quantity_sold   INTEGER NOT NULL DEFAULT 0,
  peak_hour_start       INTEGER,
  peak_hour_count       INTEGER DEFAULT 0,
  customer_count        INTEGER DEFAULT 0,
  avg_transaction_value DECIMAL(10,2),
  top_selling_item      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, market_id, date)
);

CREATE INDEX IF NOT EXISTS idx_vendor_analytics_vendor_id ON vendor_analytics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_analytics_date      ON vendor_analytics(date);


-- ─────────────────────────────────────────────────────────────
-- 15. SAVED EVENTS (for user calendar notifications)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_events (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  location   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ─────────────────────────────────────────────────────────────
-- 16. ENABLE REALTIME
-- ─────────────────────────────────────────────────────────────
ALTER TABLE stall_status         ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sale           ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor               ENABLE ROW LEVEL SECURITY;
ALTER TABLE market               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_events         ENABLE ROW LEVEL SECURITY;

-- Add tables to realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE stall_status;
  EXCEPTION WHEN others THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE flash_sale;
  EXCEPTION WHEN others THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE assignment;
  EXCEPTION WHEN others THEN NULL; END;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 17. ROW LEVEL SECURITY POLICIES
-- ─────────────────────────────────────────────────────────────

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_service" ON profiles;

-- profiles: own row only
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (auth.uid() = id);
-- Service role bypasses RLS automatically (used by /api/auth/register)

-- vendor: authenticated users can read; service role can write
DROP POLICY IF EXISTS "vendor_select_authenticated" ON vendor;
DROP POLICY IF EXISTS "vendor_insert_service"       ON vendor;
DROP POLICY IF EXISTS "vendor_update_own"           ON vendor;
DROP POLICY IF EXISTS "Enable read access for all authenticated users on vendor" ON vendor;
DROP POLICY IF EXISTS "Enable insert for authenticated users on vendor"          ON vendor;
DROP POLICY IF EXISTS "Enable insert for all users during dev"                   ON vendor;
DROP POLICY IF EXISTS "Enable update for authenticated users on vendor"          ON vendor;
DROP POLICY IF EXISTS "Enable delete for authenticated users on vendor"          ON vendor;

CREATE POLICY "vendor_select_authenticated"
  ON vendor FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vendor_update_own"
  ON vendor FOR UPDATE USING (
    id = (SELECT vendor_id FROM profiles WHERE id = auth.uid())
  );
-- Inserts are done by service role (register API) — no anon policy needed

-- market: anyone can read
DROP POLICY IF EXISTS "market_select_all"      ON market;
DROP POLICY IF EXISTS "Enable read access for all authenticated users on market"  ON market;
DROP POLICY IF EXISTS "Enable insert for authenticated users on market"           ON market;
DROP POLICY IF EXISTS "Enable update for authenticated users on market"           ON market;
DROP POLICY IF EXISTS "Enable delete for authenticated users on market"           ON market;

CREATE POLICY "market_select_all"
  ON market FOR SELECT USING (true);
CREATE POLICY "market_write_admin"
  ON market FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- assignment: authenticated can read; vendors manage their own
DROP POLICY IF EXISTS "assignment_select_authenticated" ON assignment;
DROP POLICY IF EXISTS "Enable read access for all authenticated users on assignment" ON assignment;
DROP POLICY IF EXISTS "Enable insert for authenticated users on assignment"          ON assignment;
DROP POLICY IF EXISTS "Enable update for authenticated users on assignment"          ON assignment;
DROP POLICY IF EXISTS "Enable delete for authenticated users on assignment"          ON assignment;

CREATE POLICY "assignment_select_authenticated"
  ON assignment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "assignment_update_vendor"
  ON assignment FOR UPDATE USING (
    vendor_id = (SELECT vendor_id FROM profiles WHERE id = auth.uid())
  );

-- stall_status: anyone can read (for discover page); vendors update own
DROP POLICY IF EXISTS "stall_status_select_all"    ON stall_status;
DROP POLICY IF EXISTS "stall_status_upsert_vendor" ON stall_status;
CREATE POLICY "stall_status_select_all"
  ON stall_status FOR SELECT USING (true);
CREATE POLICY "stall_status_upsert_vendor"
  ON stall_status FOR ALL USING (
    vendor_id = (SELECT vendor_id FROM profiles WHERE id = auth.uid())
  );

-- flash_sale: anyone can read active ones; vendors manage own
DROP POLICY IF EXISTS "flash_sale_select_all"    ON flash_sale;
DROP POLICY IF EXISTS "flash_sale_manage_vendor" ON flash_sale;
CREATE POLICY "flash_sale_select_all"
  ON flash_sale FOR SELECT USING (true);
CREATE POLICY "flash_sale_manage_vendor"
  ON flash_sale FOR ALL USING (
    vendor_id = (SELECT vendor_id FROM profiles WHERE id = auth.uid())
  );

-- sale: vendors see own; service role has full access
DROP POLICY IF EXISTS "sale_select_vendor" ON sale;
CREATE POLICY "sale_select_vendor"
  ON sale FOR SELECT USING (
    vendor_id = (SELECT vendor_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "sale_insert_vendor"
  ON sale FOR INSERT WITH CHECK (
    vendor_id = (SELECT vendor_id FROM profiles WHERE id = auth.uid())
  );

-- saved_events: users see own
DROP POLICY IF EXISTS "saved_events_own" ON saved_events;
CREATE POLICY "saved_events_own"
  ON saved_events FOR ALL USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- 18. VIEWS
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS active_stalls CASCADE;
CREATE VIEW active_stalls AS
SELECT
  ss.vendor_id,
  ss.market_id,
  v.nama_perniagaan,
  v.jenis_jualan,
  m.nama_pasar,
  ss.current_stall_number,
  ss.status,
  ss.latitude,
  ss.longitude,
  ss.last_updated
FROM stall_status ss
JOIN vendor v ON ss.vendor_id = v.id
JOIN market m ON ss.market_id = m.id
WHERE ss.is_present = TRUE
ORDER BY ss.last_updated DESC;


DROP VIEW IF EXISTS daily_sales_summary CASCADE;
CREATE VIEW daily_sales_summary AS
SELECT
  v.id            AS vendor_id,
  v.nama_perniagaan,
  m.id            AS market_id,
  m.nama_pasar,
  CURRENT_DATE    AS sale_date,
  COALESCE(SUM(s.total_amount),  0) AS total_sales,
  COALESCE(SUM(s.quantity),      0) AS total_quantity_sold,
  COALESCE(AVG(s.total_amount),  0) AS avg_transaction_value
FROM vendor v
CROSS JOIN market m
LEFT JOIN sale s
  ON  s.vendor_id  = v.id
  AND s.market_id  = m.id
  AND DATE(s.sale_time) = CURRENT_DATE
GROUP BY v.id, v.nama_perniagaan, m.id, m.nama_pasar;


-- ─────────────────────────────────────────────────────────────
-- 19. DEMO SEED DATA
-- ─────────────────────────────────────────────────────────────
INSERT INTO vendor (id, nama_perniagaan, nama_panggilan, no_telefon, email, jenis_jualan, yuran_harian_sen, status)
VALUES ('demo-vendor-1', 'Mee Goreng Haji Ali', 'Haji Ali', '012-3456789', 'vendor@pasar.smart', 'Noodles', 3500, 'AKTIF')
ON CONFLICT (id) DO NOTHING;

INSERT INTO market (id, nama_pasar, daerah, alamat, hari_operasi, status)
VALUES ('demo-market-1', 'Pasar Malam Bandaraya Melaka', 'MELAKA_TENGAH', 'Kawasan bandar', 'Jumaat & Sabtu', 'BEROPERASI')
ON CONFLICT (id) DO NOTHING;

INSERT INTO assignment (id, vendor_id, market_id, tarikh_mula, status, petak_stall)
VALUES ('assign-demo-vendor-1-demo-market-1', 'demo-vendor-1', 'demo-market-1', CURRENT_TIMESTAMP, 'DIJADUALKAN', 'A01')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 20. ADMIN ACCOUNT SEED
--     Safe to re-run: wipes any partial state and recreates.
--       Email   : admin@pasarsmart.my
--       Password: Admin@1234
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_admin_id uuid := gen_random_uuid();
BEGIN
  -- Remove any partial/broken admin entry so we start clean
  DELETE FROM auth.users WHERE email = 'admin@pasarsmart.my';

  -- 1. Create the auth.users row
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous,
    created_at, updated_at,
    confirmation_token, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_admin_id,
    'authenticated',
    'authenticated',
    'admin@pasarsmart.my',
    crypt('Admin@1234', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin Pasar Smart","role":"admin"}',
    false, false, false,
    NOW(), NOW(), '', ''
  );

  -- 2. Create the auth.identities row (required for email/password login)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_admin_id,
    json_build_object('sub', v_admin_id::text, 'email', 'admin@pasarsmart.my'),
    'email',
    v_admin_id::text,
    NOW(), NOW(), NOW()
  );

  -- 3. Create the profiles row with role = 'admin'
  INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
  VALUES (v_admin_id, 'Admin Pasar Smart', 'admin@pasarsmart.my', 'admin', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET role = 'admin', name = 'Admin Pasar Smart', email = 'admin@pasarsmart.my';

END $$;
