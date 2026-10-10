import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = 'adadi.mobile.cart.v1';

export type CartItem = {
  productId: string;
  businessId: string;
  name: string;
  businessName: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

export async function getCart(): Promise<CartItem[]> {
  const raw = await AsyncStorage.getItem(CART_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem =>
      item && typeof item.productId === 'string' &&
      typeof item.businessId === 'string' &&
      typeof item.name === 'string' &&
      Number.isFinite(Number(item.price)) &&
      Number.isInteger(Number(item.quantity)) &&
      Number(item.quantity) > 0
    );
  } catch {
    return [];
  }
}

export async function addCartItem(item: Omit<CartItem, 'quantity'>): Promise<{ items: CartItem[]; differentBusiness: boolean }> {
  const current = await getCart();
  if (current.length && current.some(existing => existing.businessId !== item.businessId)) {
    return { items: current, differentBusiness: true };
  }
  const existing = current.find(existing => existing.productId === item.productId);
  const next = existing
    ? current.map(existing => existing.productId === item.productId ? { ...existing, quantity: existing.quantity + 1 } : existing)
    : [...current, { ...item, quantity: 1 }];
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
  return { items: next, differentBusiness: false };
}

export async function updateCartQuantity(productId: string, quantity: number): Promise<CartItem[]> {
  const current = await getCart();
  const next = quantity <= 0
    ? current.filter(item => item.productId !== productId)
    : current.map(item => item.productId === productId ? { ...item, quantity: Math.min(99, Math.floor(quantity)) } : item);
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
  return next;
}

export async function clearCart() {
  await AsyncStorage.removeItem(CART_KEY);
}
