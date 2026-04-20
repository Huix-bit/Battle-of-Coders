export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  vendor: string;
  vendorEmoji: string;
  emoji: string;
}

const KEY = "pasar-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addItems(incoming: Omit<CartItem, "qty">[], qty: number): void {
  const cart = getCart();
  for (const item of incoming) {
    if (qty <= 0) continue;
    const found = cart.find((c) => c.id === item.id);
    if (found) {
      found.qty += qty;
    } else {
      cart.push({ ...item, qty });
    }
  }
  saveCart(cart);
}

export function upsertItem(item: Omit<CartItem, "qty">, delta: number): void {
  const cart = getCart();
  const found = cart.find((c) => c.id === item.id);
  if (found) {
    found.qty = Math.max(0, found.qty + delta);
  } else if (delta > 0) {
    cart.push({ ...item, qty: delta });
  }
  saveCart(cart.filter((c) => c.qty > 0));
}

export function clearCart(): void {
  localStorage.removeItem(KEY);
}

export function cartCount(): number {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}
