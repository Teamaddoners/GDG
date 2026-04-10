"use client";

import { useMemo } from "react";
import { useSubmissionStore } from "@/store/submission-store";
import { useAuthStore } from "@/store/auth-store";
import { useWalletStore } from "@/store/wallet-store";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { submissions, updateSubmission } = useSubmissionStore();
  const { users, updateUser } = useAuthStore();
  const { addCredit } = useWalletStore();
  const toast = useToast();

  const usersMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const review = (id: string, userId: string, decision: "approved" | "rejected", reward: number) => {
    updateSubmission(id, { status: decision, reward: decision === "approved" ? reward : 0 });
    if (decision === "approved") {
      const u = usersMap.get(userId);
      if (u) {
        updateUser(userId, { points: u.points + reward, rupees: u.rupees + reward });
        addCredit(userId, reward, "Admin approved submission");
      }
    }
    toast.success(`Submission ${decision}.`);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Admin Panel</h1>
      <section className="mb-6 rounded-xl border border-white/20 bg-white/5 p-4">
        <h2 className="mb-2 font-semibold">Users</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg bg-black/30 p-3 text-sm">
              {u.name} | {u.email} | ₹{u.rupees} | {u.points} pts
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-white/20 bg-white/5 p-4">
        <h2 className="mb-2 font-semibold">All Submissions</h2>
        <div className="space-y-2">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-lg bg-black/30 p-3 text-sm">
              <div className="mb-2">{s.category} | {s.status} | Confidence {s.confidence ?? 0}%</div>
              <div className="flex gap-2">
                <button onClick={() => review(s.id, s.userId, "approved", Math.max(20, s.reward || 30))} className="rounded bg-emerald-500 px-2 py-1 text-black">Approve</button>
                <button onClick={() => review(s.id, s.userId, "rejected", 0)} className="rounded bg-rose-500 px-2 py-1">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
