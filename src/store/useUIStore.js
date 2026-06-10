import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  activeModal: null,
  modalData: {},
  toasts: [],
  registerStep: 0,
  registerData: {},

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  openModal: (type, data = {}) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),

  pushToast: (text, type = 'success') => {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { id, text, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },

  setRegisterStep: (step) => set({ registerStep: step }),
  setRegisterData: (data) =>
    set((s) => ({ registerData: { ...s.registerData, ...data } })),
  resetRegister: () => set({ registerStep: 0, registerData: {} }),
}));
