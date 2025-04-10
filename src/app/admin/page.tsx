"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    // 관리자 페이지 기본 경로로 리디렉션
    router.push("/admin/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">관리자 페이지로 이동 중...</p>
    </div>
  );
}
