/**
 * Demo / mock data shown when Supabase is not configured.
 * Replace with real data by connecting Supabase via .env.local.
 */

export const MOCK_STATS = {
  vendors: 24,
  sites: 8,
  assignments: 47,
};

export interface MockMarket {
  id: string;
  name: string;
  district: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
}

export const MOCK_MARKETS: MockMarket[] = [
  { id: "1", name: "Pasar Malam Taman Bukit Beruang",    district: "Bukit Beruang",  day_of_week: 5, open_time: "18:00", close_time: "23:00", is_active: true },
  { id: "2", name: "Pasar Malam Ayer Keroh",              district: "Ayer Keroh",     day_of_week: 6, open_time: "17:30", close_time: "23:00", is_active: true },
  { id: "3", name: "Pasar Malam Alor Gajah",              district: "Alor Gajah",     day_of_week: 3, open_time: "18:00", close_time: "22:30", is_active: true },
  { id: "4", name: "Pasar Malam Dataran Jasin",           district: "Jasin",          day_of_week: 0, open_time: "17:00", close_time: "22:00", is_active: true },
  { id: "5", name: "Pasar Malam Hang Tuah Jaya",          district: "Melaka Tengah",  day_of_week: 4, open_time: "18:30", close_time: "23:30", is_active: true },
  { id: "6", name: "Pasar Malam Bukit Beruang Sabtu",     district: "Bukit Beruang",  day_of_week: 6, open_time: "17:00", close_time: "23:00", is_active: true },
  { id: "7", name: "Pasar Malam Ayer Keroh Jumaat",       district: "Ayer Keroh",     day_of_week: 5, open_time: "18:00", close_time: "22:00", is_active: true },
  { id: "8", name: "Pasar Malam Melaka Tengah Isnin",     district: "Melaka Tengah",  day_of_week: 1, open_time: "18:00", close_time: "23:00", is_active: true },
];

export interface MockVendor {
  id: string;
  namaPerniagaan: string;
  namaPanggilan: string | null;
  noTelefon: string | null;
  email: string | null;
  jenisJualan: string;
  yuranHarianSen: number;
  status: string;
}

export const MOCK_VENDORS: MockVendor[] = [
  { id: "demo-vendor-1", namaPerniagaan: "Mee Goreng Mamak Haji Ali",  namaPanggilan: "Haji Ali",  noTelefon: "012-3456789", email: null,                    jenisJualan: "Noodles & rice", yuranHarianSen: 1500, status: "AKTIF"   },
  { id: "v2", namaPerniagaan: "Ayam Percik Siti",            namaPanggilan: "Kak Siti",  noTelefon: "017-8901234", email: "siti@email.com",         jenisJualan: "Grilled chicken",yuranHarianSen: 1200, status: "AKTIF"   },
  { id: "v3", namaPerniagaan: "Kuih Muih Puan Ros",          namaPanggilan: "Puan Ros",  noTelefon: null,          email: null,                    jenisJualan: "Traditional cakes",yuranHarianSen: 800, status: "AKTIF"  },
  { id: "v4", namaPerniagaan: "Air Balang Rahman",            namaPanggilan: "Man",       noTelefon: "011-2345678", email: null,                    jenisJualan: "Drinks",         yuranHarianSen: 600,  status: "AKTIF"   },
  { id: "v5", namaPerniagaan: "Rojak Buah Encik Zaini",      namaPanggilan: "Pak Zaini", noTelefon: "016-5678901", email: null,                    jenisJualan: "Fruit rojak",    yuranHarianSen: 1000, status: "GANTUNG" },
];
