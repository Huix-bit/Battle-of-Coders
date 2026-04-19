-- Seed data for Vendor table
INSERT INTO vendor (nama_perniagaan, nama_panggilan, no_telefon, email, jenis_jualan, yuran_harian_sen, status)
VALUES
  ('Kuih Tradisi Kak Timah', 'Kak Timah', '012-3456789', NULL, 'Kuih-muih & dodol', 3500, 'AKTIF'),
  ('Craft Melaka Weave', NULL, NULL, 'craft@example.com', 'Kraftangan & cenderamata', 4200, 'AKTIF');

-- Seed data for Market table
INSERT INTO market (nama_pasar, daerah, alamat, hari_operasi, status)
VALUES
  ('Pasar Malam Bandaraya Melaka', 'MELAKA_TENGAH', 'Kawasan bandar', 'Jumaat & Sabtu', 'BEROPERASI'),
  ('Pasar Malam Universiti', 'BUKIT_BERUANG', NULL, 'Rabu & Khamis', 'BEROPERASI');

-- Get the vendor and market IDs for the assignment
-- Note: This seed assumes the above data was inserted first
-- Assignments will be created based on the IDs returned from the above inserts
-- Due to the dynamic nature of UUIDs, you may need to manually adjust these IDs
-- or use the application UI to create assignments
