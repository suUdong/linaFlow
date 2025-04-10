"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shouldAutoLogin, setShouldAutoLogin] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const loginButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 inputRefs 초기화
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // 6자리 비밀번호가 모두 입력되었을 때 자동 로그인
  useEffect(() => {
    if (
      shouldAutoLogin &&
      !loading &&
      email &&
      password.every((digit) => digit !== "")
    ) {
      console.log("자동 로그인 트리거됨");
      setShouldAutoLogin(false);
      handleSubmit();
    }
  }, [shouldAutoLogin, password, email, loading]);

  // 이메일과 비밀번호가 모두 입력된 경우 페이지를 이동합니다.
  const handleRedirect = async (role: string) => {
    if (role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/");
    }
  };

  // 사용자가 로그인 상태인지 확인합니다.
  useEffect(() => {
    const checkSession = async () => {
      try {
        // localStorage에서 사용자 정보 가져오기
        const userJson = localStorage.getItem("user");

        if (userJson) {
          const userData = JSON.parse(userJson);

          if (userData && userData.role) {
            // 로그인한 사용자의 역할을 기반으로 리디렉션
            handleRedirect(userData.role);
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
        // 오류 발생 시 localStorage 초기화
        localStorage.removeItem("user");
      }
    };

    checkSession();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // 숫자만 입력 가능하도록 제한
    if (value && !/^\d$/.test(value)) return;

    // 이전 에러 메시지 초기화
    setError("");

    const newPassword = [...password];
    newPassword[index] = value;
    setPassword(newPassword);

    // 다음 입력 필드로 포커스 이동
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus?.();
    } else if (value && index === 5) {
      // 마지막 자리까지 모두 입력됐을 때
      if (email && newPassword.every((digit) => digit !== "")) {
        // 입력 필드에서 포커스 제거 (키보드 숨기기)
        if (inputRefs.current[index]) {
          inputRefs.current[index]?.blur?.();
        }

        // 자동 로그인 트리거
        setShouldAutoLogin(true);
      }
    }
  };

  // 백스페이스 키를 눌렀을 때 이전 입력칸으로 이동
  const handleInputKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace") {
      if (index > 0 && password[index] === "") {
        const newPassword = [...password];
        // 현재 입력칸이 비어있는 경우 이전 칸으로 이동하고 값 지우기
        newPassword[index - 1] = "";
        setPassword(newPassword);
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1]?.focus?.();
        }
      } else if (password[index] !== "") {
        // 현재 입력칸에 값이 있는 경우 값만 지우기
        const newPassword = [...password];
        newPassword[index] = "";
        setPassword(newPassword);
      }
    }
  };

  // 붙여넣기 처리
  const handleInputPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    // 이전 에러 메시지 초기화
    setError("");

    const pastedData = event.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);

    if (pastedData) {
      const newPassword = [...password];

      // 붙여넣은 숫자를 각 입력칸에 분배
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newPassword[i] = pastedData[i];
      }

      setPassword(newPassword);

      // 붙여넣은 데이터가 6자리이고 이메일이 있으면 자동 제출
      if (pastedData.length === 6 && email) {
        // 마지막 입력 필드에서 포커스 제거
        if (inputRefs.current[5]) {
          inputRefs.current[5]?.blur?.();
        }

        // 자동 로그인 트리거
        setShouldAutoLogin(true);
      } else {
        // 붙여넣은 데이터의 마지막 자리 다음 입력칸으로 포커스 이동
        const nextIndex = Math.min(pastedData.length, 5);
        if (inputRefs.current[nextIndex]) {
          inputRefs.current[nextIndex].focus();
        }
      }
    }
  };

  const handleSubmit = async () => {
    console.log("로그인 시도 중...");

    // 버튼에 시각적 클릭 효과 추가
    if (loginButtonRef.current) {
      loginButtonRef.current.classList.add("scale-95");
      setTimeout(() => {
        if (loginButtonRef.current) {
          loginButtonRef.current.classList.remove("scale-95");
        }
      }, 150);
    }

    // 입력값 검증
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    // 모든 비밀번호 칸이 채워졌는지 확인
    if (password.some((digit) => !digit)) {
      setError("6자리 비밀번호를 모두 입력해주세요.");
      return;
    }

    // 이미 로딩 중이면 중복 요청 방지
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const passwordStr = password.join("");
      console.log("로그인 요청 전송");

      try {
        const { data: memberData, error: userError } = await supabase
          .from("members")
          .select("*")
          .eq("email", email)
          .maybeSingle();

        if (userError) throw userError;
        if (!memberData) {
          setError("사용자를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }

        // 비밀번호 확인 (임시로 문자열 비교만 수행, 실제로는 해시 비교 필요)
        if (memberData.password_hash !== passwordStr) {
          setError("비밀번호가 일치하지 않습니다.");
          setLoading(false);
          return;
        }

        // 상태에 따라 리디렉션
        if (memberData.status === "pending") {
          // 시스템 설정 확인 - 자동 승인 여부
          const { data: systemSettings, error: settingsError } = await supabase
            .from("system_settings")
            .select("auto_approve_signup")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (settingsError) throw settingsError;

          // 자동 승인 설정이 활성화되었는지 확인
          const autoApproveSignup =
            systemSettings?.auto_approve_signup || false;

          if (autoApproveSignup) {
            // 자동 승인이 활성화된 경우, 사용자 상태를 active로 변경
            const { error: updateError } = await supabase
              .from("members")
              .update({ status: "active" })
              .eq("id", memberData.id);

            if (updateError) throw updateError;

            // 상태 업데이트 후 재로그인을 위해 새 정보 가져오기
            const { data: updatedMember, error: refreshError } = await supabase
              .from("members")
              .select("*")
              .eq("id", memberData.id)
              .single();

            if (refreshError) throw refreshError;

            // 세션 정보 저장
            localStorage.setItem(
              "user",
              JSON.stringify({
                id: updatedMember.id,
                email: updatedMember.email,
                name: updatedMember.name,
                role: updatedMember.role,
              })
            );

            // 로그인 성공, 역할에 따라 리디렉션
            handleRedirect(updatedMember.role);
          } else {
            // 자동 승인이 비활성화된 경우 기존대로 대기 메시지 표시
            setError("관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.");
            setLoading(false);
          }
          return;
        } else if (memberData.status !== "active") {
          setError(
            `계정이 ${memberData.status} 상태입니다. 관리자에게 문의하세요.`
          );
          setLoading(false);
          return;
        }

        // 세션 정보 저장
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: memberData.id,
            email: memberData.email,
            name: memberData.name,
            role: memberData.role,
          })
        );

        console.log("로그인 성공:", memberData.id);

        // 로그인 성공, 역할에 따라 리디렉션
        handleRedirect(memberData.role);
      } catch (authError) {
        console.error("인증 오류:", authError);
        setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white">
      {/* 비밀번호 필드에 점(•)으로 표시하는 CSS */}
      <style jsx global>{`
        .password-dots {
          -webkit-text-security: disc;
          text-security: disc;
        }
      `}</style>

      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
            <p className="text-pink-600 mt-3 font-medium">로그인 중...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/rena-pilates-logo.png"
              alt="Rena Pilates Logo"
              className="h-44 w-auto"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/300x120?text=Rena+Pilates";
              }}
            />
          </div>
          <p className="text-sm text-pink-700 font-medium mb-4 italic">
            당신만을 위한 프리미엄 필라테스 온라인 콘텐츠
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              이메일
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="pl-10 mt-1 block w-full rounded-lg border border-gray-300 px-3 py-3 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition-colors"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              비밀번호 (6자리 숫자)
            </label>
            <div className="mt-2 flex justify-between gap-2">
              {password.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  pattern="[0-9]"
                  required
                  className="block w-12 h-12 rounded-lg border border-gray-300 px-3 py-2 text-center shadow-sm text-xl font-semibold focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition-colors password-dots"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(index, e)}
                  onPaste={index === 0 ? handleInputPaste : undefined}
                  autoComplete="off"
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500 text-center">
              모든 입력 완료 시 자동으로 로그인됩니다
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 shadow-sm flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <div>
            <button
              id="login-button"
              ref={loginButtonRef}
              onClick={handleSubmit}
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-pink-600 px-4 py-3 text-white font-medium hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors shadow-md disabled:bg-pink-400 disabled:cursor-not-allowed transform transition-transform duration-150 ease-in-out"
            >
              <span className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {loading ? "로그인 중..." : "로그인"}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-center mt-4">
            <div className="text-sm">
              <Link
                href="/register"
                className="text-pink-600 hover:text-pink-800 font-medium hover:underline transition-colors"
              >
                계정이 없으신가요? 가입하기
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center justify-center">
              <svg
                className="h-4 w-4 mr-1"
                xmlns="http://www.w3.org/2000/svg"
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
            <p className="text-xs text-gray-600 text-center">
              (지번) 서울 은평구 수색동 341-6
            </p>
            <p className="text-xs text-gray-600 text-center">
              (도로명) 서울특별시 은평구 수색로 217-1
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <a
              href="https://www.instagram.com/re.na.pilates"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-pink-600 hover:text-pink-800 transition-colors"
            >
              <svg
                className="h-5 w-5 mr-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              @rena_pilates
            </a>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-sm text-gray-500">
              &copy; 2023 Rena Pilates. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
