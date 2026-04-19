export const VENDOR_STATUS = ["DRAFT", "AKTIF", "GANTUNG"] as const;
export type VendorStatus = (typeof VENDOR_STATUS)[number];

export const MARKET_STATUS = ["DIRANCANG", "BEROPERASI", "DITUTUP"] as const;
export type MarketStatus = (typeof MARKET_STATUS)[number];

export const ASSIGNMENT_STATUS = [
  "DIJADUALKAN",
  "DISAHKAN",
  "BERJALAN",
  "SELESAI",
  "BATAL",
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUS)[number];

const vendorEdges: Record<VendorStatus, VendorStatus[]> = {
  DRAFT: ["AKTIF", "GANTUNG"],
  AKTIF: ["GANTUNG"],
  GANTUNG: ["AKTIF"],
};

export function canTransitionVendor(from: string, to: string): boolean {
  if (from === to) return true;
  const next = vendorEdges[from as VendorStatus];
  return Boolean(next?.includes(to as VendorStatus));
}

const marketEdges: Record<MarketStatus, MarketStatus[]> = {
  DIRANCANG: ["BEROPERASI", "DITUTUP"],
  BEROPERASI: ["DITUTUP", "DIRANCANG"],
  DITUTUP: ["DIRANCANG"],
};

export function canTransitionMarket(from: string, to: string): boolean {
  if (from === to) return true;
  const next = marketEdges[from as MarketStatus];
  return Boolean(next?.includes(to as MarketStatus));
}

const assignmentEdges: Record<AssignmentStatus, AssignmentStatus[]> = {
  DIJADUALKAN: ["DISAHKAN", "BATAL"],
  DISAHKAN: ["BERJALAN", "BATAL"],
  BERJALAN: ["SELESAI"],
  SELESAI: [],
  BATAL: [],
};

export function canTransitionAssignment(from: string, to: string): boolean {
  if (from === to) return true;
  const next = assignmentEdges[from as AssignmentStatus];
  return Boolean(next?.includes(to as AssignmentStatus));
}

export const VENDOR_STATUS_LABEL: Record<VendorStatus, string> = {
  DRAFT: "Draft",
  AKTIF: "Active",
  GANTUNG: "Suspended",
};

export const MARKET_STATUS_LABEL: Record<MarketStatus, string> = {
  DIRANCANG: "Planned",
  BEROPERASI: "Operating",
  DITUTUP: "Closed",
};

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  DIJADUALKAN: "Scheduled",
  DISAHKAN: "Confirmed",
  BERJALAN: "In Progress",
  SELESAI: "Completed",
  BATAL: "Cancelled",
};
