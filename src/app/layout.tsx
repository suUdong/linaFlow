import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinaFlow | 프리미엄 필라테스 콘텐츠 솔루션",
  description: "필라테스 전문가를 위한 최고의 콘텐츠 관리 플랫폼",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=5.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <div className="min-h-full flex flex-col">{children}</div>
      </body>
    </html>
  );
}
