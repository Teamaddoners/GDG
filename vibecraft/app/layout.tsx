import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowFix — Turn chaos into clarity instantly",
  description: "FlowFix transforms messy notes into structured action items with confidence and time-saved estimates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
