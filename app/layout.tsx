import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sugiyama's First App",
  description: "Next.js & Vercel deployment test",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
