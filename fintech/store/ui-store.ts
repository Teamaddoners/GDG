"use client";

import { create } from "zustand";

type Toast = { id: string; type: "success" | "error" | "info"; message: string };

type UIState = {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (toast) => set((s) => ({ toasts: [toast, ...s.toasts].slice(0, 4) })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}));
