-- Create Vendor table
CREATE TABLE IF NOT EXISTS vendor (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama_perniagaan TEXT NOT NULL,
  nama_panggilan TEXT,
  no_telefon TEXT,
  email TEXT,
  jenis_jualan TEXT NOT NULL,
  yuran_harian_sen INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT | AKTIF | GANTUNG
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Market table
CREATE TABLE IF NOT EXISTS market (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama_pasar TEXT NOT NULL,
  daerah TEXT NOT NULL, -- BUKIT_BERUANG | AYER_KEROH | ALOR_GAJAH | JASIN | MELAKA_TENGAH
  alamat TEXT,
  hari_operasi TEXT,
  status TEXT NOT NULL DEFAULT 'DIRANCANG', -- DIRANCANG | BEROPERASI | DITUTUP
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Assignment table
CREATE TABLE IF NOT EXISTS assignment (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendor_id TEXT NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  tarikh_mula TIMESTAMP NOT NULL,
  tarikh_tamat TIMESTAMP,
  petak_stall TEXT,
  status TEXT NOT NULL DEFAULT 'DIJADUALKAN', -- DIJADUALKAN | DISAHKAN | BERJALAN | SELESAI | BATAL
  catatan TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assignment_market_id ON assignment(market_id);
CREATE INDEX IF NOT EXISTS idx_assignment_vendor_id ON assignment(vendor_id);
CREATE INDEX IF NOT EXISTS idx_assignment_tarikh_mula ON assignment(tarikh_mula);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE vendor ENABLE ROW LEVEL SECURITY;
ALTER TABLE market ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment ENABLE ROW LEVEL SECURITY;

-- Create public policies (allows all authenticated users to read/write)
-- Modify these policies based on your security requirements
CREATE POLICY "Enable read access for all authenticated users on vendor"
  ON vendor FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on vendor"
  ON vendor FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on vendor"
  ON vendor FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on vendor"
  ON vendor FOR DELETE
  USING (auth.role() = 'authenticated');

-- Repeat for market table
CREATE POLICY "Enable read access for all authenticated users on market"
  ON market FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on market"
  ON market FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on market"
  ON market FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on market"
  ON market FOR DELETE
  USING (auth.role() = 'authenticated');

-- Repeat for assignment table
CREATE POLICY "Enable read access for all authenticated users on assignment"
  ON assignment FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on assignment"
  ON assignment FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on assignment"
  ON assignment FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on assignment"
  ON assignment FOR DELETE
  USING (auth.role() = 'authenticated');
