// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BookProvider } from "@/contexts/BookContext"; // Import
import Header from "@/components/Header"; // Import

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "200文字の空",
  description: "200文字の井の中から青空を眺めます．",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className} suppressHydrationWarning={true}>
        <BookProvider> {/* Providerで全体をラップ */}
          <Header />
          <main className="pt-20"> {/* ヘッダーの高さ分だけpaddingを確保 */}
            {children}
          </main>
        </BookProvider>
      </body>
    </html>
  );
}