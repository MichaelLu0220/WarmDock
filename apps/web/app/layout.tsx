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
      <head>
        {/* 像素字型(像素風 accent / 復古 body)。用 <link> 而非 next/font,
            避免 build 時抓不到字型直接 fail;抓不到時優雅退回 monospace。 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
