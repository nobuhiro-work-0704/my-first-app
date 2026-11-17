import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Security Incident Watch | 各社公式セキュリティ速報・AI要約",
  description: "各企業の公式発表・適時開示から、最新の不正アクセス・個人情報漏洩インシデントを自動収集し、Gemini AIが要約・影響範囲を分析する実用ポータル。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased font-sans bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
