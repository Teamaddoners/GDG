"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { Session, User } from "@/lib/types";

type AuthState = {
  users: User[];
  session: Session | null;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
  }) => { ok: boolean; message: string };
  login: (payload: { email: string; password: string }) => {
    ok: boolean;
    message: string;
  };
  logout: () => void;
  getCurrentUser: () => User | undefined;
  updateUser: (userId: string, patch: Partial<User>) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      session: null,
      signup: ({ name, email, password }) => {
        const exists = get().users.some((u) => u.email === email);
        if (exists) return { ok: false, message: "Email already exists." };
        const user: User = {
          id: uuidv4(),
          name,
          email,
          password,
          points: 0,
          rupees: 0,
          streak: 0,
          co2SavedKg: 0,
          createdAt: new Date().toISOString()
        };
        const token = `local-jwt-${uuidv4()}`;
        set((state) => ({
          users: [...state.users, user],
          session: { token, userId: user.id }
        }));
        return { ok: true, message: "Account created." };
      },
      login: ({ email, password }) => {
        const user = get().users.find(
          (u) => u.email === email && u.password === password
        );
        if (!user) return { ok: false, message: "Invalid credentials." };
        set({ session: { token: `local-jwt-${uuidv4()}`, userId: user.id } });
        return { ok: true, message: "Welcome back." };
      },
      logout: () => set({ session: null }),
      getCurrentUser: () => {
        const userId = get().session?.userId;
        return get().users.find((u) => u.id === userId);
      },
      updateUser: (userId, patch) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, ...patch } : u))
        }))
    }),
    {
      name: "w2w-auth",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
