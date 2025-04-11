"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // 로고 서서히 나타나게 하는 효과
    setTimeout(() => {
      setOpacity(1);
    }, 300);

    // 사용자 체크 및 리다이렉션
    try {
      const user = getCurrentUser();

      // 리다이렉션 타이머 설정 (2초 후)
      setTimeout(() => {
        if (user) {
          // 로그인된 사용자는 역할에 따라 리다이렉션
          if (user.role === "admin") {
            router.push("/admin/members");
          } else {
            router.push("/videos");
          }
        } else {
          // 로그인 안된 사용자는 로그인 페이지로 리다이렉션
          router.push("/login");
        }
      }, 2000);
    } catch (error) {
      console.error("로그인 상태 확인 중 오류 발생:", error);
      // 오류 시에도 로그인 페이지로 이동
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div
        className="transition-opacity duration-1000 ease-in-out"
        style={{ opacity: opacity }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rena-pilates-logo.png"
          alt="리나 필라테스"
          width={280}
          height={280}
          className="w-64 h-64 object-contain"
        />
      </div>
    </div>
  );
}
