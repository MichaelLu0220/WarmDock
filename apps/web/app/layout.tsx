import type { Metadata } from "next";
import "@warmdock/ui-web/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "WarmDock",
  description: "A minimalist right-side todo assistant that helps you finish what matters today.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
