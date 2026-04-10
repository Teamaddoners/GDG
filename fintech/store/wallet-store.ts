"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { WalletTransaction } from "@/lib/types";

type WalletState = {
  transactions: WalletTransaction[];
  addCredit: (userId: string, amount: number, description: string) => void;
  requestWithdrawal: (userId: string, amount: number, upiId: string) => void;
  getUserTransactions: (userId: string) => WalletTransaction[];
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      transactions: [],
      addCredit: (userId, amount, description) =>
        set((state) => ({
          transactions: [
            {
              id: uuidv4(),
              userId,
              amount,
              type: "credit",
              description,
              status: "success",
              createdAt: new Date().toISOString()
            },
            ...state.transactions
          ]
        })),
      requestWithdrawal: (userId, amount, upiId) =>
        set((state) => ({
          transactions: [
            {
              id: uuidv4(),
              userId,
              amount,
              type: "withdrawal",
              description: `Withdrawal to ${upiId}`,
              status: "processing",
              createdAt: new Date().toISOString()
            },
            ...state.transactions
          ]
        })),
      getUserTransactions: (userId) =>
        get().transactions.filter((t) => t.userId === userId)
    }),
    { name: "w2w-wallet", storage: createJSONStorage(() => localStorage) }
  )
);
