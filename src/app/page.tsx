"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          padding: "2rem",
          width: "100%",
          maxWidth: "28rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
            color: "#111827",
          }}
        >
          LinaFlow
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "#6b7280",
            marginBottom: "2rem",
          }}
        >
          프리미엄 필라테스 콘텐츠 솔루션
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: 500,
            color: "white",
            backgroundColor: "#4f46e5",
            borderRadius: "0.375rem",
            textDecoration: "none",
          }}
        >
          로그인하기
        </Link>
      </div>
    </div>
  );
}
