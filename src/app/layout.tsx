// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BookProvider } from "@/contexts/BookContext";
import { DisplayProvider } from "@/contexts/DisplayContext";
import Header from "@/components/Header";

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export const metadata: Metadata = {
  title: "kawazu",
  description: "先入観から離れて、新しい作品と出会うための読書アプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="google-site-verification" content="THAOk5rR43WaoxYMrz1rNm2jUrkkRvaBHSbJKo7fNj8" />
      </head>
      <body>
        <DisplayProvider>
          <BookProvider>
            <Header />
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
          </BookProvider>
        </DisplayProvider>
      </body>
    </html>
  );
}
