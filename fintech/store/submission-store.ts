"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { Submission, SubmissionStatus } from "@/lib/types";

type SubmissionState = {
  submissions: Submission[];
  createSubmission: (payload: Omit<Submission, "id" | "timestamp">) => Submission;
  updateSubmission: (
    id: string,
    patch: Partial<Pick<Submission, "status" | "reward" | "confidence">>
  ) => void;
  getUserSubmissions: (userId: string) => Submission[];
};

export const useSubmissionStore = create<SubmissionState>()(
  persist(
    (set, get) => ({
      submissions: [],
      createSubmission: (payload) => {
        const item: Submission = {
          id: uuidv4(),
          ...payload,
          timestamp: new Date().toISOString()
        };
        set((state) => ({ submissions: [item, ...state.submissions] }));
        return item;
      },
      updateSubmission: (id, patch) =>
        set((state) => ({
          submissions: state.submissions.map((s) => (s.id === id ? { ...s, ...patch } : s))
        })),
      getUserSubmissions: (userId) =>
        get().submissions.filter((s) => s.userId === userId)
    }),
    { name: "w2w-submissions", storage: createJSONStorage(() => localStorage) }
  )
);

export const statusLabel = (status: SubmissionStatus) =>
  status.charAt(0).toUpperCase() + status.slice(1);
