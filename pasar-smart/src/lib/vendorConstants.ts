// Plain constants — no "use server", safe to import in both client and server code.
export const BUSINESS_CATEGORIES = [
  "Noodles", "Rice", "Grilled", "Drinks",
  "Kuih", "Fruits", "Seafood", "Snacks", "Clothing", "Others",
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];
