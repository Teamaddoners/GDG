"use client";

import { v4 as uuidv4 } from "uuid";
import { useUIStore } from "@/store/ui-store";

export const useToast = () => {
  const addToast = useUIStore((s) => s.addToast);
  return {
    success: (message: string) => addToast({ id: uuidv4(), type: "success", message }),
    error: (message: string) => addToast({ id: uuidv4(), type: "error", message }),
    info: (message: string) => addToast({ id: uuidv4(), type: "info", message })
  };
};
