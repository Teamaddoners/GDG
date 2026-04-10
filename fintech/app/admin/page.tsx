"use client";

import { useMemo } from "react";
import { useSubmissionStore } from "@/store/submission-store";
import { useAuthStore } from "@/store/auth-store";
import { useWalletStore } from "@/store/wallet-store";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_REWARD_MAP } from "@/lib/constants";

export default function AdminPage() {
  const { submissions, updateSubmission, getUserSubmissions } = useSubmissionStore();
  const { users, updateUser } = useAuthStore();
  const { addCredit } = useWalletStore();
  const toast = useToast();

  const usersMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const review = (id: string, userId: string, decision: "approved" | "rejected", reward: number) => {
    const target = submissions.find((s) => s.id === id);
    if (!target) return;
    if (target.status === decision) {
      toast.info(`Submission already marked as ${decision}.`);
      return;
    }

    updateSubmission(id, { status: decision, reward: decision === "approved" ? reward : 0 });

    const existingReward = target.status === "approved" ? target.reward : 0;
    const delta = decision === "approved" ? reward - existingReward : -existingReward;
    if (decision === "approved") {
      const u = usersMap.get(userId);
      if (u) {
        updateUser(userId, {
          points: Math.max(0, u.points + delta),
          rupees: Math.max(0, u.rupees + delta)
        });
        if (delta > 0) addCredit(userId, delta, "Admin approved submission");
      }
    } else {
      const u = usersMap.get(userId);
      if (u && delta < 0) {
        updateUser(userId, {
          points: Math.max(0, u.points + delta),
          rupees: Math.max(0, u.rupees + delta)
        });
      }
    }
    toast.success(`Submission ${decision}.`);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-3xl font-bold text-gradient">Admin Panel</h1>
      <section className="mb-6 rounded-xl border border-white/20 bg-white/5 p-4">
        <h2 className="mb-2 font-semibold">Users and Balances</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg bg-black/30 p-3 text-sm">
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-emerald-100/70">{u.email}</div>
              <div className="mt-1">₹{u.rupees} | {u.points} pts | Streak {u.streak}</div>
              <div className="text-xs text-emerald-100/70">
                Submissions: {getUserSubmissions(u.id).length}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-white/20 bg-white/5 p-4">
        <h2 className="mb-2 font-semibold">All Submissions</h2>
        <div className="space-y-2">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-lg bg-black/30 p-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="capitalize">{s.category}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${s.status === "approved" ? "bg-emerald-500/20 text-emerald-200" : s.status === "rejected" ? "bg-rose-500/20 text-rose-200" : "bg-amber-500/20 text-amber-200"}`}>
                  {s.status}
                </span>
              </div>
              <div className="mb-2 text-xs text-emerald-100/70">
                Confidence {s.confidence ?? 0}% | Reward ₹{s.reward}
              </div>
              <div className="flex gap-2">
                <button onClick={() => review(s.id, s.userId, "approved", Math.max(20, s.reward || CATEGORY_REWARD_MAP[s.category] || 30))} className="rounded bg-emerald-500 px-2 py-1 text-black">Approve</button>
                <button onClick={() => review(s.id, s.userId, "rejected", 0)} className="rounded bg-rose-500 px-2 py-1">Reject</button>
              </div>
            </div>
          ))}
          {submissions.length === 0 && (
            <div className="rounded-lg bg-black/30 p-3 text-sm">No submissions yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
