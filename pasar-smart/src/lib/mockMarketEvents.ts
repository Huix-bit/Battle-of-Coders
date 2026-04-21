/**
 * Mock data for multiple night markets
 * Each market has:
 * - Event info (name, date, coordinates, hours)
 * - Stalls list with details (name, category, crowd %, wait time)
 * - Layout grid (physical stall placement)
 * - Navigation directions
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type LayoutCell = { cat: string; label: string; stall?: string; emoji?: string } | null;

export interface Stall {
  id: string;
  name: string;
  cat: string;
  crowd: number;
  wait: string;
  flash: boolean;
  emoji: string;
  open: boolean;
}

export interface NavigationStep {
  step: number;
  instruction: string;
  distance: string;
  icon: string;
}

export interface MarketEvent {
  id: string;
  name: string;
  date: string;
  latitude: number;
  longitude: number;
  address: string;
  operatingHours: string;
  stalls: Stall[];
  layoutGrid: LayoutCell[][];
  navigationDirections: NavigationStep[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKET 1: Pasar Malam Melaka (Original - April 20, 2026)
// ─────────────────────────────────────────────────────────────────────────────

const MELAKA_STALLS: Stall[] = [
  { id: "B4", name: "Mee Goreng Haji Ali",  cat: "Noodles",  crowd: 95, wait: "20 min", flash: false, emoji: "🍜", open: true  },
  { id: "B5", name: "Satay Jamilah",         cat: "Grilled",  crowd: 88, wait: "15 min", flash: false, emoji: "🍢", open: true  },
  { id: "C4", name: "Ikan Bakar Hamidah",    cat: "Seafood",  crowd: 80, wait: "25 min", flash: false, emoji: "🐠", open: true  },
  { id: "A4", name: "Cendol Pak Din",        cat: "Drinks",   crowd: 85, wait: "5 min",  flash: false, emoji: "🧊", open: true  },
  { id: "C2", name: "Ayam Percik Siti",      cat: "Grilled",  crowd: 50, wait: "10 min", flash: true,  emoji: "🍗", open: true  },
  { id: "D3", name: "Nasi Lemak Wangi",      cat: "Rice",     crowd: 45, wait: "3 min",  flash: false, emoji: "🍚", open: true  },
  { id: "E5", name: "Rojak Buah Pak Zaini",  cat: "Fruits",   crowd: 40, wait: "8 min",  flash: true,  emoji: "🥭", open: true  },
  { id: "F2", name: "Kuih Muih Puan Ros",    cat: "Kuih",     crowd: 20, wait: "2 min",  flash: false, emoji: "🧁", open: true  },
  { id: "E7", name: "Keropok Lekor Azri",    cat: "Snacks",   crowd: 15, wait: "5 min",  flash: false, emoji: "🐟", open: false },
];

const MELAKA_LAYOUT: LayoutCell[][] = [
  [null, null, null, {cat:"Drinks",  label:"Drinks Zone",  stall:"Cendol Pak Din",       emoji:"🧊"}, {cat:"Drinks", label:"Drinks"}, null, null, null],
  [null, {cat:"Noodles",label:"Noodles",stall:"Mee Goreng Haji Ali",emoji:"🍜"}, null, {cat:"Grilled",label:"Grilled"}, {cat:"Grilled",label:"Satay",stall:"Satay Jamilah",emoji:"🍢"}, null, null, null],
  [null, {cat:"Grilled",label:"Grilled",stall:"Ayam Percik Siti",emoji:"🍗"}, null, {cat:"Seafood",label:"Seafood",stall:"Ikan Bakar Hamidah",emoji:"🐠"}, {cat:"Seafood",label:"Seafood"}, null, null, null],
  [{cat:"Toilet",label:"🚻"}, null, {cat:"Rice",label:"Rice",stall:"Nasi Lemak Wangi",emoji:"🍚"}, null, null, null, null, {cat:"Toilet",label:"🚻"}],
  [null, null, null, {cat:"Fruits",label:"Fruits"}, {cat:"Fruits",label:"Fruits",stall:"Rojak Buah",emoji:"🥭"}, null, {cat:"Snacks",label:"Snacks",stall:"Keropok Lekor",emoji:"🐟"}, null],
  [null, {cat:"Kuih",label:"Kuih",stall:"Kuih Muih Puan Ros",emoji:"🧁"}, {cat:"Kuih",label:"Kuih"}, null, null, null, null, null],
];

const MELAKA_NAV: NavigationStep[] = [
  { step: 1, instruction: "Head north on Jalan Sultan Ibrahim", distance: "250 m", icon: "🔝" },
  { step: 2, instruction: "Turn right at Jalan Melaka Raya", distance: "180 m", icon: "➡️" },
  { step: 3, instruction: "Continue straight for 500 m", distance: "500 m", icon: "➡️" },
  { step: 4, instruction: "Turn left onto Jalan Banda", distance: "120 m", icon: "⬅️" },
  { step: 5, instruction: "Arrive at Pasar Malam Melaka", distance: "0 m", icon: "📍" },
];

export const MELAKA_EVENT: MarketEvent = {
  id: "melaka",
  name: "Pasar Malam Melaka",
  date: "April 20, 2026",
  latitude: 2.1896,
  longitude: 102.6483,
  address: "Jalan Banda, 75200 Melaka",
  operatingHours: "6:00 PM - 11:30 PM",
  stalls: MELAKA_STALLS,
  layoutGrid: MELAKA_LAYOUT,
  navigationDirections: MELAKA_NAV,
};

// ─────────────────────────────────────────────────────────────────────────────
// MARKET 2: Jonker Walk Night Market (April 24, 2026)
// ─────────────────────────────────────────────────────────────────────────────

const JONKER_STALLS: Stall[] = [
  { id: "A1", name: "Chee Cheong Fun Ah Seng", cat: "Noodles",  crowd: 92, wait: "18 min", flash: false, emoji: "🍜", open: true },
  { id: "A3", name: "Char Koay Teow Ah Huat",  cat: "Noodles",  crowd: 88, wait: "22 min", flash: true,  emoji: "🍲", open: true },
  { id: "B2", name: "Fish Ball Soup Lim",      cat: "Seafood",  crowd: 85, wait: "12 min", flash: false, emoji: "🐟", open: true },
  { id: "B4", name: "Popiah Aunty Rose",       cat: "Snacks",   crowd: 60, wait: "8 min",  flash: false, emoji: "🌮", open: true },
  { id: "C1", name: "Ice Kacang Pak Ahmad",    cat: "Drinks",   crowd: 78, wait: "5 min",  flash: false, emoji: "🧊", open: true },
  { id: "C3", name: "Durian Waffle Stall",     cat: "Desserts", crowd: 55, wait: "10 min", flash: true,  emoji: "🍰", open: true },
  { id: "D2", name: "Grilled Meat Skewers",    cat: "Grilled",  crowd: 72, wait: "15 min", flash: false, emoji: "🍢", open: true },
  { id: "D4", name: "Antique Souvenirs Shop",  cat: "Goods",    crowd: 25, wait: "2 min",  flash: false, emoji: "🎁", open: true },
  { id: "E3", name: "Bak Chang Uncle Tan",     cat: "Rice",     crowd: 30, wait: "3 min",  flash: false, emoji: "🍚", open: true },
];

const JONKER_LAYOUT: LayoutCell[][] = [
  [{cat:"Noodles",label:"Noodles",stall:"Chee Cheong Fun Ah Seng",emoji:"🍜"}, null, {cat:"Noodles",label:"Noodles",stall:"Char Koay Teow Ah Huat",emoji:"🍲"}, null, {cat:"Seafood",label:"Seafood",stall:"Fish Ball Soup Lim",emoji:"🐟"}, null, null, null],
  [null, {cat:"Snacks",label:"Snacks",stall:"Popiah Aunty Rose",emoji:"🌮"}, null, {cat:"Drinks",label:"Drinks",stall:"Ice Kacang Pak Ahmad",emoji:"🧊"}, null, {cat:"Desserts",label:"Desserts",stall:"Durian Waffle",emoji:"🍰"}, null, null],
  [{cat:"Grilled",label:"Grilled",stall:"Grilled Meat Skewers",emoji:"🍢"}, null, null, null, {cat:"Goods",label:"Goods",stall:"Antique Souvenirs",emoji:"🎁"}, null, null, {cat:"Toilet",label:"🚻"}],
  [null, {cat:"Rice",label:"Rice",stall:"Bak Chang Uncle Tan",emoji:"🍚"}, null, null, null, null, {cat:"Noodles",label:"Noodles"}, null],
  [{cat:"Toilet",label:"🚻"}, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
];

const JONKER_NAV: NavigationStep[] = [
  { step: 1, instruction: "Head east on Jalan Merdeka", distance: "300 m", icon: "🔝" },
  { step: 2, instruction: "Turn left onto Jalan Tun Sri Lanang", distance: "150 m", icon: "⬅️" },
  { step: 3, instruction: "Continue on Jalan Jonker", distance: "400 m", icon: "➡️" },
  { step: 4, instruction: "Arrive at Jonker Walk Night Market", distance: "0 m", icon: "📍" },
];

export const JONKER_EVENT: MarketEvent = {
  id: "jonker",
  name: "Jonker Walk Night Market",
  date: "April 24, 2026",
  latitude: 2.1944,
  longitude: 102.6388,
  address: "Jalan Jonker, 75200 Melaka",
  operatingHours: "5:00 PM - 11:00 PM",
  stalls: JONKER_STALLS,
  layoutGrid: JONKER_LAYOUT,
  navigationDirections: JONKER_NAV,
};

// ─────────────────────────────────────────────────────────────────────────────
// MARKET 3: Bukit Baru Night Market (April 22, 2026)
// ─────────────────────────────────────────────────────────────────────────────

const BUKIT_STALLS: Stall[] = [
  { id: "A2", name: "Cucur Goreng Puan Zah",   cat: "Desserts", crowd: 65, wait: "7 min",  flash: false, emoji: "🍠", open: true },
  { id: "A4", name: "Teh Tarik Abang Sulaiman",cat: "Drinks",   crowd: 72, wait: "4 min",  flash: false, emoji: "☕", open: true },
  { id: "B1", name: "Laksa Kuah Sedap",        cat: "Noodles",  crowd: 90, wait: "20 min", flash: true,  emoji: "🍜", open: true },
  { id: "B3", name: "Roti Canai Arjun",        cat: "Bread",    crowd: 58, wait: "8 min",  flash: false, emoji: "🥐", open: true },
  { id: "C2", name: "Satay Bundle Pack",       cat: "Grilled",  crowd: 85, wait: "15 min", flash: false, emoji: "🍢", open: true },
  { id: "C4", name: "Fresh Juice Stand",       cat: "Drinks",   crowd: 55, wait: "3 min",  flash: false, emoji: "🥤", open: true },
  { id: "D1", name: "Roasted Duck Specialist", cat: "Grilled",  crowd: 75, wait: "18 min", flash: false, emoji: "🦆", open: true },
  { id: "D3", name: "Hand-Woven Baskets",      cat: "Goods",    crowd: 20, wait: "2 min",  flash: false, emoji: "🧺", open: true },
  { id: "E2", name: "Steamed Buns Stall",      cat: "Bread",    crowd: 35, wait: "4 min",  flash: true,  emoji: "🥟", open: false },
];

const BUKIT_LAYOUT: LayoutCell[][] = [
  [null, {cat:"Desserts",label:"Desserts",stall:"Cucur Goreng Puan Zah",emoji:"🍠"}, null, {cat:"Drinks",label:"Drinks",stall:"Teh Tarik Abang Sulaiman",emoji:"☕"}, null, null, null, null],
  [{cat:"Noodles",label:"Noodles",stall:"Laksa Kuah Sedap",emoji:"🍜"}, null, {cat:"Bread",label:"Bread",stall:"Roti Canai Arjun",emoji:"🥐"}, null, {cat:"Grilled",label:"Grilled",stall:"Satay Bundle Pack",emoji:"🍢"}, null, {cat:"Drinks",label:"Drinks",stall:"Fresh Juice",emoji:"🥤"}, null],
  [null, {cat:"Grilled",label:"Grilled",stall:"Roasted Duck",emoji:"🦆"}, null, {cat:"Goods",label:"Goods",stall:"Hand-Woven Baskets",emoji:"🧺"}, null, null, {cat:"Bread",label:"Bread",stall:"Steamed Buns",emoji:"🥟"}, {cat:"Toilet",label:"🚻"}],
  [{cat:"Toilet",label:"🚻"}, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
];

const BUKIT_NAV: NavigationStep[] = [
  { step: 1, instruction: "Head south on Jalan Merdeka", distance: "200 m", icon: "🔝" },
  { step: 2, instruction: "Turn right onto Bukit Baru Road", distance: "350 m", icon: "➡️" },
  { step: 3, instruction: "Continue to Market Square", distance: "280 m", icon: "➡️" },
  { step: 4, instruction: "Arrive at Bukit Baru Night Market", distance: "0 m", icon: "📍" },
];

export const BUKIT_EVENT: MarketEvent = {
  id: "bukit",
  name: "Bukit Baru Night Market",
  date: "April 22, 2026",
  latitude: 2.1825,
  longitude: 102.6512,
  address: "Market Square, Bukit Baru, 75200 Melaka",
  operatingHours: "6:30 PM - 11:00 PM",
  stalls: BUKIT_STALLS,
  layoutGrid: BUKIT_LAYOUT,
  navigationDirections: BUKIT_NAV,
};

// ─────────────────────────────────────────────────────────────────────────────
// All available markets
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_MARKETS: MarketEvent[] = [
  MELAKA_EVENT,
  JONKER_EVENT,
  BUKIT_EVENT,
];

export function getMarketById(id: string): MarketEvent | undefined {
  return ALL_MARKETS.find(market => market.id === id);
}
