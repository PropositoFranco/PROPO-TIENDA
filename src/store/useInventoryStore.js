import { create } from 'zustand';

export const useInventoryStore = create((set, get) => ({
  items: [],
  equipped: {},
  isLoading: false,

  fetchInventory: async (userId) => {
    set({ isLoading: true });
    // Supabase connection will go here
    // const { data } = await supabase
    //   .from('inventory_items')
    //   .select('*, products(*)')
    //   .eq('user_id', userId);
    set({ isLoading: false });
  },

  addItem: (item) =>
    set((s) => ({ items: [...s.items, item] })),

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  equipItem: (item) =>
    set((s) => ({
      equipped: { ...s.equipped, [item.slot]: item.id },
      items: s.items.map((i) =>
        i.id === item.id ? { ...i, is_equipped: true } : i
      ),
    })),

  unequipItem: (slot) =>
    set((s) => {
      const itemId = s.equipped[slot];
      return {
        equipped: { ...s.equipped, [slot]: null },
        items: s.items.map((i) =>
          i.id === itemId ? { ...i, is_equipped: false } : i
        ),
      };
    }),
}));
