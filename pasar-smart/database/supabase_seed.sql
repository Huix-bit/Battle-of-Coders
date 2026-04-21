-- Seed data for Vendor table
INSERT INTO vendor (nama_perniagaan, nama_panggilan, no_telefon, email, jenis_jualan, yuran_harian_sen, status)
VALUES
  ('Kuih Tradisi Kak Timah', 'Kak Timah', '012-3456789', NULL, 'Kuih-muih & dodol', 3500, 'AKTIF'),
  ('Craft Melaka Weave', NULL, NULL, 'craft@example.com', 'Kraftangan & cenderamata', 4200, 'AKTIF');

-- Seed data for Market table
INSERT INTO market (id, nama_pasar, daerah, alamat, hari_operasi, status)
VALUES
  ('demo-market-1', 'Demo Market', 'MELAKA_TENGAH', 'Kawasan bandar', 'Setiap Hari', 'BEROPERASI'),
  ('mkt-2', 'Pasar Malam Bandaraya Melaka', 'MELAKA_TENGAH', 'Kawasan bandar', 'Jumaat & Sabtu', 'BEROPERASI'),
  ('mkt-3', 'Pasar Malam Universiti', 'BUKIT_BERUANG', NULL, 'Rabu & Khamis', 'BEROPERASI');

