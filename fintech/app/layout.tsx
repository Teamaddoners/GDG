import type { Metadata } from "next";
import "./globals.css";
import { Toasts } from "@/components/toast";

export const metadata: Metadata = {
  title: "Waste-to-Wallet",
  description: "Recycle, earn, and track your green impact."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        <Toasts />
      </body>
    </html>
  );
}
