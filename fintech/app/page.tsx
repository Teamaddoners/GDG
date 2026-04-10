"use client";

import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useSubmissionStore } from "@/store/submission-store";
import { useWalletStore } from "@/store/wallet-store";
import { CATEGORY_REWARD_MAP, WASTE_CATEGORIES } from "@/lib/constants";
import { delay, randomConfidence, toBase64 } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

const submitSchema = z.object({
  category: z.string().min(1),
  notes: z.string().optional()
});

const withdrawalSchema = z.object({
  upiId: z.string().min(6).regex(/^[\w.-]+@[\w.-]+$/),
  amount: z.coerce.number().positive()
});

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [tab, setTab] = useState<"dashboard" | "submit" | "leaderboard">("dashboard");
  const [upload, setUpload] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const toast = useToast();

  const { session, signup, login, logout, getCurrentUser, updateUser, users } = useAuthStore();
  const { createSubmission, getUserSubmissions } = useSubmissionStore();
  const { addCredit, requestWithdrawal, getUserTransactions } = useWalletStore();
  const me = getCurrentUser();

  const authForm = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "", name: "" }
  });
  const submitForm = useForm<z.infer<typeof submitSchema>>({
    resolver: zodResolver(submitSchema),
    defaultValues: { category: "plastic", notes: "" }
  });
  const withdrawalForm = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { upiId: "", amount: 50 }
  });

  const mySubmissions = me ? getUserSubmissions(me.id) : [];
  const myTransactions = me ? getUserTransactions(me.id) : [];

  const leaderboard = useMemo(
    () => [...users].sort((a, b) => b.points - a.points).slice(0, 10),
    [users]
  );

  const onAuth = async (values: z.infer<typeof authSchema>) => {
    await delay(700);
    const result =
      mode === "signup"
        ? signup({ name: values.name || "Eco User", email: values.email, password: values.password })
        : login({ email: values.email, password: values.password });
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
  };

  const onSubmitWaste = async (values: z.infer<typeof submitSchema>) => {
    if (!me) return;
    if (!upload) return toast.error("Please upload waste image.");
    setIsVerifying(true);
    await delay(1300);
    const confidence = randomConfidence();
    const baseReward = CATEGORY_REWARD_MAP[values.category] || 20;
    const status = values.category === "plastic" ? (confidence > 75 ? "approved" : "pending") : confidence > 80 ? "approved" : "pending";
    const reward = status === "approved" ? baseReward : 0;
    createSubmission({
      userId: me.id,
      image: upload,
      category: values.category,
      notes: values.notes,
      status,
      reward,
      confidence
    });
    if (status === "approved") {
      const today = new Date().toDateString();
      const streak = me.lastSubmissionDate === today ? me.streak : me.streak + 1;
      updateUser(me.id, {
        points: me.points + baseReward,
        rupees: me.rupees + baseReward,
        streak,
        lastSubmissionDate: today,
        co2SavedKg: Number((me.co2SavedKg + baseReward * 0.12).toFixed(2))
      });
      addCredit(me.id, baseReward, `${values.category} submission approved`);
      toast.success(`Approved with ${confidence}% confidence!`);
    } else {
      toast.info(`Submitted with ${confidence}% confidence. Pending review.`);
    }
    setUpload("");
    submitForm.reset({ category: "plastic", notes: "" });
    setIsVerifying(false);
  };

  const onWithdraw = async (values: z.infer<typeof withdrawalSchema>) => {
    if (!me) return;
    if (values.amount > me.rupees) return toast.error("Insufficient balance.");
    updateUser(me.id, { rupees: me.rupees - values.amount });
    requestWithdrawal(me.id, values.amount, values.upiId);
    toast.success("Withdrawal requested. Processing started.");
    setShowWithdraw(false);
    withdrawalForm.reset();
  };

  if (!session || !me) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass w-full rounded-2xl p-6 shadow-neon">
          <h1 className="text-2xl font-bold">Waste-to-Wallet</h1>
          <p className="mt-1 text-sm text-emerald-200/80">Recycle smarter. Earn instantly.</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setMode("signup")} className={`rounded-lg px-3 py-1 text-sm ${mode === "signup" ? "bg-emerald-500 text-black" : "bg-white/10"}`}>Signup</button>
            <button onClick={() => setMode("login")} className={`rounded-lg px-3 py-1 text-sm ${mode === "login" ? "bg-emerald-500 text-black" : "bg-white/10"}`}>Login</button>
          </div>
          <form onSubmit={authForm.handleSubmit(onAuth)} className="mt-4 space-y-3">
            {mode === "signup" && <input className="w-full rounded-lg bg-white/10 p-3" placeholder="Name" {...authForm.register("name")} />}
            <input className="w-full rounded-lg bg-white/10 p-3" placeholder="Email" {...authForm.register("email")} />
            <input type="password" className="w-full rounded-lg bg-white/10 p-3" placeholder="Password" {...authForm.register("password")} />
            <button className="w-full rounded-lg bg-emerald-400 py-3 font-semibold text-black">{mode === "signup" ? "Create account" : "Sign in"}</button>
          </form>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="glass mb-4 flex items-center justify-between rounded-2xl p-4">
        <div>
          <h2 className="text-xl font-semibold">Hey {me.name}, welcome back</h2>
          <p className="text-xs text-emerald-100/70">Today streak: {me.streak} | CO2 saved: {me.co2SavedKg}kg</p>
        </div>
        <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={logout}>Logout</button>
      </header>

      <div className="mb-4 flex gap-2">
        {(["dashboard", "submit", "leaderboard"] as const).map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm ${tab === item ? "bg-emerald-400 text-black" : "bg-white/10"}`}>
            {item}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div layout className="glass rounded-xl p-4">
            <p className="text-sm text-emerald-100/70">Wallet Balance</p>
            <p className="text-3xl font-bold">₹{me.rupees}</p>
            <p className="text-sm">Points: {me.points}</p>
            <button onClick={() => setShowWithdraw(true)} className="mt-3 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-black">Withdraw</button>
          </motion.div>
          <div className="glass rounded-xl p-4 md:col-span-2">
            <p className="mb-2 text-sm text-emerald-100/70">Recent activity</p>
            <div className="space-y-2">
              {myTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="rounded-lg bg-white/5 p-3 text-sm">
                  {tx.description} - ₹{tx.amount} ({tx.status})
                </div>
              ))}
              {myTransactions.length === 0 && <div className="animate-pulse rounded-lg bg-white/5 p-3 text-sm">No activity yet.</div>}
            </div>
          </div>
          <div className="glass rounded-xl p-4 md:col-span-3">
            <p className="mb-2 text-sm text-emerald-100/70">Nearby recycling center</p>
            <div className="h-36 rounded-lg bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 p-3 text-sm">
              EcoDrop Hub - 1.2km | GreenLoop Center - 2.8km
            </div>
            <button className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">Simulate QR Scan</button>
          </div>
        </div>
      )}

      {tab === "submit" && (
        <div className="grid gap-4 md:grid-cols-2">
          <form onSubmit={submitForm.handleSubmit(onSubmitWaste)} className="glass space-y-3 rounded-xl p-4">
            <select className="w-full rounded-lg bg-white/10 p-3" {...submitForm.register("category")}>
              {WASTE_CATEGORIES.map((item) => (
                <option value={item} key={item} className="bg-black">{item}</option>
              ))}
            </select>
            <textarea className="w-full rounded-lg bg-white/10 p-3" placeholder="Optional notes" {...submitForm.register("notes")} />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const b64 = await toBase64(file);
                setUpload(b64);
              }}
              className="w-full rounded-lg bg-white/10 p-2 text-sm"
            />
            {upload && <img src={upload} alt="preview" className="h-24 w-24 rounded-lg object-cover" />}
            <button disabled={isVerifying} className="w-full rounded-lg bg-emerald-400 py-3 font-semibold text-black disabled:opacity-50">
              {isVerifying ? "AI verifying..." : "Submit for verification"}
            </button>
          </form>
          <div className="glass rounded-xl p-4">
            <p className="mb-2 text-sm text-emerald-100/70">Submission history</p>
            <div className="space-y-2">
              {mySubmissions.slice(0, 6).map((s) => (
                <div key={s.id} className="rounded-lg bg-white/5 p-3 text-sm">
                  {s.category} - {s.status} - {s.confidence ?? 0}% - ₹{s.reward}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="glass rounded-xl p-4">
          <h3 className="mb-3 text-lg font-semibold">Top Recyclers</h3>
          <div className="space-y-2">
            {leaderboard.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3 text-sm">
                <span>#{i + 1} {u.name}</span>
                <span>{u.points} pts {u.points > 300 ? "🔥 Eco Warrior" : u.points > 120 ? "♻️ Pro Recycler" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4">
          <form onSubmit={withdrawalForm.handleSubmit(onWithdraw)} className="glass w-full max-w-md space-y-3 rounded-xl p-4">
            <h3 className="text-lg font-semibold">Request Withdrawal</h3>
            <input className="w-full rounded-lg bg-white/10 p-3" placeholder="UPI ID (name@bank)" {...withdrawalForm.register("upiId")} />
            <input type="number" className="w-full rounded-lg bg-white/10 p-3" placeholder="Amount" {...withdrawalForm.register("amount")} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowWithdraw(false)} className="w-full rounded-lg bg-white/10 py-2">Cancel</button>
              <button className="w-full rounded-lg bg-emerald-400 py-2 font-semibold text-black">Confirm</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
