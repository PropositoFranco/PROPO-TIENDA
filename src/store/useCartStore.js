import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],

  addItem: (product) =>
    set((s) => {
      const existing = s.items.find((i) => i.id === product.id);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.id === product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { items: [...s.items, { ...product, qty: 1 }] };
    }),

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  clearCart: () => set({ items: [] }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.price_cristales * i.qty, 0),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
}));
