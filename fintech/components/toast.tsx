"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

export const Toasts = () => {
  const toasts = useUIStore((s) => s.toasts);
  const remove = useUIStore((s) => s.removeToast);

  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => remove(t.id), 2200));
    return () => timers.forEach(clearTimeout);
  }, [toasts, remove]);

  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="rounded-xl border border-white/20 bg-black/70 px-4 py-3 text-sm text-white backdrop-blur"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
