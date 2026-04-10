import clsx from "clsx";

export const cn = (...args: Parameters<typeof clsx>) => clsx(...args);

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const randomConfidence = () => Math.floor(70 + Math.random() * 31);
