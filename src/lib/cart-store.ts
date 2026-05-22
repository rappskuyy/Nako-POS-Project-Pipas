import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string | null;
  isPromo?: boolean;
  stock?: number;
}

interface CartState {
  items: CartItem[];
  voucherCode: string | null;
  voucherDiscount: number;
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  clear: () => void;
  setVoucher: (code: string | null, discount: number) => void;
  getSubtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      voucherCode: null,
      voucherDiscount: 0,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, qty: i.qty + (item.qty ?? 1) } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, qty: item.qty ?? 1 }] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQty: (productId, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.productId === productId ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        })),
      increment: (productId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, qty: i.qty + 1 } : i,
          ),
        })),
      decrement: (productId) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.productId === productId ? { ...i, qty: i.qty - 1 } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [], voucherCode: null, voucherDiscount: 0 }),
      setVoucher: (code, discount) => set({ voucherCode: code, voucherDiscount: discount }),
      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + (i.isPromo ? 0 : i.price * i.qty), 0),
    }),
    { name: "kopi-nako-cart" },
  ),
);
