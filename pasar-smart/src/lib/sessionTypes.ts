import type { UserRole } from "@/lib/nightMarketTypes";

/** Logged-in user snapshot for nav / shell (public fields only). */
export type SessionProfile = {
  id: string;
  email: string | null;
  full_name: string;
  role: UserRole;
};
