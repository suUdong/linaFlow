"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 항상 로그인 페이지로 리다이렉션합니다.
    // 로그인 후 필요한 페이지로 이동하는 로직은 로그인 페이지에서 처리합니다.
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">리다이렉션 중...</p>
    </div>
  );
}
