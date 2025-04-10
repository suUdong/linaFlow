"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, setCurrentUser, getCurrentUser } from "@/lib/auth";

export default function Home() {
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
    <div className="min-h-screen flex flex-col items-center justify-center login-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm rounded-3xl card-shadow p-8 border-0 hover-lift">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-gradient-to-r from-[#f2e6e6] to-white p-4 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/rena-pilates-logo.png"
                alt="리나 필라테스"
                width={220}
                height={220}
                className="w-48 h-48 object-contain filter drop-shadow-lg logo-hover"
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            회원 전용 온라인 콘텐츠 서비스
          </p>
        </div>

        <form ref={formRef} className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                이메일
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none pilates-input transition-all"
                  placeholder="이메일 주소 입력"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
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
                      className="block w-full py-3 text-center font-semibold text-lg border border-gray-200 rounded-lg shadow-sm focus:outline-none pilates-input transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                6자리 입력 시 자동 로그인됩니다
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              className={`relative w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-white focus:outline-none transition-all ${
                loading
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              }`}
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
              {loading && (
                <span className="absolute right-3 top-3">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              )}
            </button>

            <div className="flex justify-center">
              <Link
                href="/register"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                아직 계정이 없으신가요? 회원가입
              </Link>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-8 max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl card-shadow p-6 border-0">
        <div className="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-indigo-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              오시는 길
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              (도로명) 서울 은평구 수색로 322 단지내상가 2동 2층 리나 필라테스
            </p>
            <p className="text-sm text-gray-600 mb-1">
              (지번) 서울 은평구 수색동 341-6
            </p>
            <a
              href="https://map.naver.com/p/entry/place/1019609292?c=15.00,0,0,0,dh&placePath=/home"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
            >
              <span>네이버 지도로 보기</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-1 h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-pink-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              인스타그램
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              리나필라테스 소식과 일상을 확인하세요
            </p>
            <a
              href="https://www.instagram.com/re.na.pilates"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-pink-600 hover:text-pink-700"
            >
              <span>@re.na.pilates</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-1 h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
