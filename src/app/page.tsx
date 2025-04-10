"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();

    if (user) {
      router.push("/videos");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">리다이렉션 중...</p>
    </div>
  );
}
