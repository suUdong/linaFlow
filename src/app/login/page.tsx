"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, setCurrentUser, getCurrentUser } from "@/lib/auth";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  // 이미 로그인된 사용자를 확인하고 리다이렉션
  useEffect(() => {
    try {
      const user = getCurrentUser();
      if (user) {
        // 이미 로그인된 경우 역할 기반으로 페이지 리다이렉션
        if (user.role === "admin") {
          router.push("/admin/members");
        } else {
          router.push("/videos");
        }
      }
    } catch (error) {
      console.error("로그인 상태 확인 중 오류 발생:", error);
    } finally {
      setInitialLoading(false);
    }
  }, [router]);

  // 초기 렌더링 시 입력 참조 설정
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // 숫자만 입력 가능하도록 제한
    if (value && !/^\d$/.test(value)) return;

    const newPassword = [...password];
    newPassword[index] = value;
    setPassword(newPassword);

    // 다음 입력 필드로 포커스 이동
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    } else if (value && index === 5) {
      // 마지막 자리 입력 시 이메일 입력되어 있다면 자동 로그인 시도
      if (email && newPassword.every((digit) => digit !== "")) {
        // 약간의 지연 후 제출 (애니메이션 효과를 위해)
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.dispatchEvent(
              new Event("submit", { cancelable: true, bubbles: true })
            );
          }
        }, 300);
      }
    }
  };

  const handleInputKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // 백스페이스 키를 누르면 이전 입력 필드로 포커스 이동
    if (e.key === "Backspace" && !password[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // 숫자만 추출
    const numbers = pastedData.replace(/\D/g, "").slice(0, 6).split("");

    if (numbers.length) {
      const newPassword = [...password];
      numbers.forEach((num, index) => {
        if (index < 6) newPassword[index] = num;
      });
      setPassword(newPassword);

      // 붙여넣은 후 마지막 입력 필드로 포커스 이동
      const lastIndex = Math.min(numbers.length - 1, 5);
      if (lastIndex >= 0) {
        inputRefs.current[lastIndex].focus();
      }

      // 6자리가 모두 입력되었고 이메일이 있다면 자동 로그인
      if (email && numbers.length === 6) {
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.dispatchEvent(
              new Event("submit", { cancelable: true, bubbles: true })
            );
          }
        }, 300);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const passwordString = password.join("");

      // 모든 필드가 입력되었는지 확인
      if (passwordString.length !== 6) {
        setError("비밀번호는 6자리 숫자여야 합니다.");
        setLoading(false);
        return;
      }

      const { user, isAdmin, error } = await signIn(email, passwordString);

      if (error) {
        setError(
          error instanceof Error
            ? error.message
            : "로그인 중 오류가 발생했습니다."
        );
        return;
      }

      if (user) {
        setCurrentUser(user);

        // 관리자인 경우 관리자 페이지로 이동
        if (isAdmin) {
          router.push("/admin/members");
        } else {
          router.push("/videos");
        }
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중이면 로딩 인디케이터 표시
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-6 sm:p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            LinaFlow
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            프리미엄 필라테스 콘텐츠 솔루션
          </p>
        </div>

        <form ref={formRef} className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소 입력"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password-0"
                className="block text-sm font-medium text-gray-700"
              >
                비밀번호 (6자리 숫자)
              </label>
              <div className="mt-1 flex justify-between gap-2">
                {password.map((digit, index) => (
                  <div key={index} className="w-full relative">
                    <input
                      id={`password-${index}`}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      ref={(el) => {
                        if (el) inputRefs.current[index] = el;
                      }}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleInputKeyDown(index, e)}
                      onPaste={index === 0 ? handleInputPaste : undefined}
                      className="block w-full py-3 text-center font-semibold text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500 text-center">
                6자리 입력 시 자동 로그인됩니다
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                회원가입 신청하기
              </Link>
            </div>
          </div>

          {loading && (
            <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-indigo-600 animate-pulse-x"></div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
