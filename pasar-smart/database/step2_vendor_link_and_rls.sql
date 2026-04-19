-- Step 2 — link vendor rows to Supabase Auth users + tighten stalls RLS
-- Apply after smart_night_market.sql

ALTER TABLE vendor ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES profiles (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_auth_user_id_unique ON vendor (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Admin can see all profiles (needed for dashboards / linking vendors)
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'ADMIN'::user_role
    )
  );

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'ADMIN'::user_role
    )
  )
  WITH CHECK (true);

-- Stalls: public read for discovery; mutations require login (JWT from Server Actions)
DROP POLICY IF EXISTS "stalls_all_anon" ON stalls;
DROP POLICY IF EXISTS "stalls_all_authenticated" ON stalls;

CREATE POLICY "stalls_select_public"
  ON stalls FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "stalls_insert_authenticated"
  ON stalls FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "stalls_update_authenticated"
  ON stalls FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "stalls_delete_authenticated"
  ON stalls FOR DELETE TO authenticated
  USING (true);
