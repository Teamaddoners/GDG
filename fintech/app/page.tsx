"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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

const prettyDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [tab, setTab] = useState<"dashboard" | "submit" | "leaderboard">("dashboard");
  const [upload, setUpload] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<z.infer<typeof withdrawalSchema> | null>(null);
  const toast = useToast();

  const { session, signup, login, logout, getCurrentUser, updateUser, users } = useAuthStore();
  const { createSubmission, getUserSubmissions, submissions } = useSubmissionStore();
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
  const totalCO2 = useMemo(
    () => users.reduce((acc, user) => acc + user.co2SavedKg, 0).toFixed(2),
    [users]
  );
  const approvedCount = mySubmissions.filter((s) => s.status === "approved").length;
  const pendingCount = mySubmissions.filter((s) => s.status === "pending").length;
  const rejectionCount = mySubmissions.filter((s) => s.status === "rejected").length;

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
    if (values.amount > me.rupees) {
      toast.error("Insufficient balance.");
      return;
    }
    setPendingWithdrawal(values);
    setShowWithdrawConfirm(true);
  };

  const confirmWithdrawal = () => {
    if (!me || !pendingWithdrawal) return;
    updateUser(me.id, { rupees: me.rupees - pendingWithdrawal.amount });
    requestWithdrawal(me.id, pendingWithdrawal.amount, pendingWithdrawal.upiId);
    toast.success("Withdrawal requested. Processing started.");
    setShowWithdraw(false);
    setShowWithdrawConfirm(false);
    setPendingWithdrawal(null);
    withdrawalForm.reset();
  };

  if (!session || !me) {
    return (
      <main className="relative mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <div className="pointer-events-none absolute left-0 top-0 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass eco-border z-10 w-full rounded-3xl p-6 shadow-neon"
        >
          <h1 className="text-3xl font-bold text-gradient">Waste-to-Wallet</h1>
          <p className="mt-1 text-sm text-emerald-200/80">
            A recycling reward wallet that feels like a real fintech app.
          </p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setMode("signup")} className={`rounded-lg px-3 py-1 text-sm transition ${mode === "signup" ? "bg-emerald-500 text-black" : "bg-white/10 hover:bg-white/15"}`}>Signup</button>
            <button onClick={() => setMode("login")} className={`rounded-lg px-3 py-1 text-sm transition ${mode === "login" ? "bg-emerald-500 text-black" : "bg-white/10 hover:bg-white/15"}`}>Login</button>
          </div>
          <form onSubmit={authForm.handleSubmit(onAuth)} className="mt-4 space-y-3">
            {mode === "signup" && <input className="w-full rounded-xl bg-white/10 p-3 outline-none ring-1 ring-transparent transition focus:ring-emerald-300" placeholder="Name" {...authForm.register("name")} />}
            <input className="w-full rounded-xl bg-white/10 p-3 outline-none ring-1 ring-transparent transition focus:ring-emerald-300" placeholder="Email" {...authForm.register("email")} />
            <input type="password" className="w-full rounded-xl bg-white/10 p-3 outline-none ring-1 ring-transparent transition focus:ring-emerald-300" placeholder="Password" {...authForm.register("password")} />
            <button className="w-full rounded-xl bg-emerald-400 py-3 font-semibold text-black transition hover:bg-emerald-300">{mode === "signup" ? "Create account" : "Sign in"}</button>
          </form>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="glass eco-border mb-4 flex flex-col justify-between gap-3 rounded-2xl p-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold">Hey {me.name}, welcome back</h2>
          <p className="text-xs text-emerald-100/70">
            Daily streak: {me.streak} days | Your CO2 impact: {me.co2SavedKg}kg
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-200">
            Active session
          </span>
          <button className="rounded-lg bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        {(["dashboard", "submit", "leaderboard"] as const).map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm capitalize transition ${tab === item ? "bg-emerald-400 text-black" : "bg-white/10 hover:bg-white/20"}`}>
            {item}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div layout className="glass rounded-xl p-4">
            <p className="text-sm text-emerald-100/70">Wallet Balance</p>
            <p className="text-3xl font-bold">₹{me.rupees.toFixed(2)}</p>
            <p className="text-sm text-emerald-50/85">Points: {me.points}</p>
            <button onClick={() => setShowWithdraw(true)} className="mt-3 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300">Withdraw</button>
          </motion.div>

          <div className="glass rounded-xl p-4">
            <p className="text-sm text-emerald-100/70">Community CO2 Saved</p>
            <p className="text-3xl font-bold">{totalCO2}kg</p>
            <p className="text-xs text-emerald-100/70">All users combined</p>
          </div>

          <div className="glass rounded-xl p-4">
            <p className="text-sm text-emerald-100/70">Submission Outcomes</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-emerald-500/20 p-2">Approved<br />{approvedCount}</div>
              <div className="rounded-lg bg-amber-500/20 p-2">Pending<br />{pendingCount}</div>
              <div className="rounded-lg bg-rose-500/20 p-2">Rejected<br />{rejectionCount}</div>
            </div>
          </motion.div>

          <div className="glass rounded-xl p-4 md:col-span-2">
            <p className="mb-2 text-sm text-emerald-100/70">Recent activity</p>
            <div className="scrollbar-thin max-h-72 space-y-2 overflow-auto pr-1">
              {myTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="rounded-lg bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span>{tx.description}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${tx.status === "processing" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-emerald-100/70">
                    ₹{tx.amount} • {prettyDate(tx.createdAt)}
                  </div>
                </div>
              ))}
              {myTransactions.length === 0 && <div className="animate-pulse rounded-lg bg-white/5 p-3 text-sm">No wallet activity yet.</div>}
            </div>
          </div>

          <div className="glass rounded-xl p-4 md:col-span-3">
            <p className="mb-2 text-sm text-emerald-100/70">Nearby recycling center</p>
            <div className="h-36 rounded-lg bg-gradient-to-r from-emerald-600/20 via-cyan-600/20 to-fuchsia-600/15 p-3 text-sm">
              <p>EcoDrop Hub - 1.2km</p>
              <p>GreenLoop Center - 2.8km</p>
              <p>Metro E-Waste Unit - 3.1km</p>
            </div>
            <button
              onClick={() => toast.success("QR scanned. Linking to nearest center...")}
              className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
            >
              Simulate QR Scan
            </button>
          </div>
        </div>
      )}

      {tab === "submit" && (
        <div className="grid gap-4 md:grid-cols-2">
          <form onSubmit={submitForm.handleSubmit(onSubmitWaste)} className="glass space-y-3 rounded-xl p-4">
            <p className="text-sm text-emerald-100/80">
              Upload clear image for faster approval. Plastic has higher auto-approval probability.
            </p>
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
            {upload && (
              <div className="rounded-xl border border-emerald-300/30 p-2">
                <Image
                  src={upload}
                  alt="preview"
                  width={120}
                  height={120}
                  unoptimized
                  className="h-28 w-28 rounded-lg object-cover"
                />
              </div>
            )}
            <button disabled={isVerifying} className="w-full rounded-lg bg-emerald-400 py-3 font-semibold text-black disabled:opacity-50">
              {isVerifying ? "AI verifying..." : "Submit for verification"}
            </button>
            {isVerifying && (
              <div className="animate-pulse rounded-lg bg-white/5 p-3 text-xs text-emerald-100/80">
                Running AI quality checks and confidence scoring...
              </div>
            )}
          </form>
          <div className="glass rounded-xl p-4">
            <p className="mb-2 text-sm text-emerald-100/70">Submission history</p>
            <div className="scrollbar-thin max-h-[25rem] space-y-2 overflow-auto pr-1">
              {mySubmissions.slice(0, 6).map((s) => (
                <div key={s.id} className="rounded-lg bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{s.category}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${s.status === "approved" ? "bg-emerald-500/20 text-emerald-200" : s.status === "pending" ? "bg-amber-500/20 text-amber-200" : "bg-rose-500/20 text-rose-200"}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-emerald-100/75">
                    Confidence: {s.confidence ?? 0}% • Reward: ₹{s.reward} • {prettyDate(s.timestamp)}
                  </div>
                </div>
              ))}
              {mySubmissions.length === 0 && (
                <div className="rounded-lg bg-white/5 p-3 text-sm text-emerald-100/75">
                  No submissions yet. Upload your first recyclable item.
                </div>
              )}
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
                <span>
                  {u.points} pts{" "}
                  {u.points > 300 ? "🔥 Eco Warrior" : u.points > 120 ? "♻️ Pro Recycler" : "🌱 Starter"}
                </span>
              </div>
            ))}
            {submissions.length === 0 && (
              <div className="rounded-lg bg-white/5 p-3 text-sm">
                Leaderboard will become competitive after first approved submissions.
              </div>
            )}
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

      {showWithdrawConfirm && pendingWithdrawal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
          <div className="glass w-full max-w-md rounded-xl p-4">
            <h4 className="text-lg font-semibold">Confirm withdrawal</h4>
            <p className="mt-1 text-sm text-emerald-100/80">
              Send ₹{pendingWithdrawal.amount} to {pendingWithdrawal.upiId}? Balance will be deducted instantly.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowWithdrawConfirm(false);
                  setPendingWithdrawal(null);
                }}
                className="w-full rounded-lg bg-white/10 py-2"
              >
                Go back
              </button>
              <button onClick={confirmWithdrawal} className="w-full rounded-lg bg-emerald-400 py-2 font-semibold text-black">
                Yes, proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
