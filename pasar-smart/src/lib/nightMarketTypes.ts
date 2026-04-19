/**
 * Types for Smart Night Market tables (profiles, stalls, orders, order_items).
 * Column names match PostgreSQL snake_case from database/smart_night_market.sql.
 */

import type { StallStatus } from "./status";

export type UserRole = "ADMIN" | "VENDOR" | "BUYER";

export type { StallStatus };

export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "COMPLETED";

export type ProfileRow = {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type StallRow = {
  id: string;
  vendor_id: string;
  market_id: string | null;
  name: string;
  category: string;
  is_here: boolean;
  status: StallStatus;
  flash_sale_active: boolean;
  map_location_x: number | null;
  map_location_y: number | null;
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  buyer_id: string;
  total_amount: string;
  status: OrderStatus;
  is_pasar_drive: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  stall_id: string;
  item_name: string;
  quantity: number;
  price: string;
  created_at: string;
};
