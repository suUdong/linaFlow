import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "리나 필라테스 - 프리미엄 필라테스 콘텐츠",
  description: "리나 필라테스 회원 전용 온라인 콘텐츠 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://img.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <main className="min-h-screen">{children}</main>
        <footer className="py-4 text-center text-sm text-gray-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p>
              © {new Date().getFullYear()} 리나 필라테스. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
