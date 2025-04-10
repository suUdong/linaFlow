"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    birth_date: "",
    email: "",
  });
  const [password, setPassword] = useState(["", "", "", "", "", ""]);
  const [confirmPassword, setConfirmPassword] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRefs = useRef<HTMLInputElement[]>([]);
  const confirmRefs = useRef<HTMLInputElement[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  // 초기 렌더링 시 입력 참조 설정
  useEffect(() => {
    passwordRefs.current = passwordRefs.current.slice(0, 6);
    confirmRefs.current = confirmRefs.current.slice(0, 6);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (
    index: number,
    value: string,
    isConfirm: boolean
  ) => {
    // 숫자만 입력 가능하도록 제한
    if (value && !/^\d$/.test(value)) return;

    if (isConfirm) {
      const newPassword = [...confirmPassword];
      newPassword[index] = value;
      setConfirmPassword(newPassword);

      // 다음 입력 필드로 포커스 이동
      if (value && index < 5) {
        confirmRefs.current[index + 1].focus();
      } else if (value && index === 5) {
        // 마지막 자리까지 모두 입력했고, 모든 필수 항목이 있으면 자동 제출
        const passwordComplete = password.every((digit) => digit !== "");
        const confirmComplete = newPassword.every((digit) => digit !== "");

        if (
          formData.name &&
          formData.email &&
          passwordComplete &&
          confirmComplete
        ) {
          // 비밀번호와 확인 비밀번호가 같은지 확인
          const passwordString = password.join("");
          const confirmString = newPassword.join("");

          if (passwordString === confirmString) {
            setTimeout(() => {
              if (formRef.current) {
                formRef.current.dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true })
                );
              }
            }, 300);
          }
        }
      }
    } else {
      const newPassword = [...password];
      newPassword[index] = value;
      setPassword(newPassword);

      // 다음 입력 필드로 포커스 이동
      if (value && index < 5) {
        passwordRefs.current[index + 1].focus();
      } else if (value && index === 5) {
        // 모든 숫자가 입력되면 비밀번호 확인으로 자동 포커스
        confirmRefs.current[0].focus();
      }
    }
  };

  const handleInputKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    isConfirm: boolean
  ) => {
    // 백스페이스 키를 누르면 이전 입력 필드로 포커스 이동
    if (e.key === "Backspace") {
      if (isConfirm) {
        if (!confirmPassword[index] && index > 0) {
          confirmRefs.current[index - 1].focus();
        }
      } else {
        if (!password[index] && index > 0) {
          passwordRefs.current[index - 1].focus();
        }
      }
    }
  };

  const handleInputPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    isConfirm: boolean
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // 숫자만 추출
    const numbers = pastedData.replace(/\D/g, "").slice(0, 6).split("");

    if (numbers.length) {
      if (isConfirm) {
        const newPassword = [...confirmPassword];
        numbers.forEach((num, index) => {
          if (index < 6) newPassword[index] = num;
        });
        setConfirmPassword(newPassword);

        // 붙여넣은 후 마지막 입력 필드로 포커스 이동
        const lastIndex = Math.min(numbers.length - 1, 5);
        if (lastIndex >= 0) {
          confirmRefs.current[lastIndex].focus();
        }
      } else {
        const newPassword = [...password];
        numbers.forEach((num, index) => {
          if (index < 6) newPassword[index] = num;
        });
        setPassword(newPassword);

        // 붙여넣은 후 마지막 입력 필드로 포커스 이동
        const lastIndex = Math.min(numbers.length - 1, 5);
        if (lastIndex >= 0) {
          passwordRefs.current[lastIndex].focus();
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 비밀번호 문자열로 변환
      const passwordString = password.join("");
      const confirmPasswordString = confirmPassword.join("");

      // 기본 유효성 검사
      if (!formData.name || !formData.email || passwordString.length !== 6) {
        setError("필수 항목을 모두 입력해주세요.");
        setLoading(false);
        return;
      }

      // 비밀번호 검증 (6자리 숫자)
      if (!/^\d{6}$/.test(passwordString)) {
        setError("비밀번호는 6자리 숫자여야 합니다.");
        setLoading(false);
        return;
      }

      // 비밀번호 확인
      if (passwordString !== confirmPasswordString) {
        setError("비밀번호가 일치하지 않습니다.");
        setLoading(false);
        return;
      }

      // 이메일 중복 확인
      const { data: existingUser, error: emailCheckError } = await supabase
        .from("members")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (emailCheckError) throw emailCheckError;

      if (existingUser) {
        setError("이미 사용 중인 이메일입니다.");
        setLoading(false);
        return;
      }

      // 회원 가입 신청
      const { error: insertError } = await supabase.from("members").insert([
        {
          name: formData.name,
          nickname: formData.nickname || formData.name,
          birth_date: formData.birth_date || null,
          email: formData.email,
          password_hash: passwordString, // 실제 구현에서는 bcrypt로 해시 필요
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      // 가입 신청 완료
      setSuccess(true);

      // 폼 초기화
      setFormData({
        name: "",
        nickname: "",
        birth_date: "",
        email: "",
      });
      setPassword(["", "", "", "", "", ""]);
      setConfirmPassword(["", "", "", "", "", ""]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 입력 필드 렌더링 함수
  const renderPasswordFields = (isConfirm = false) => {
    const currentPassword = isConfirm ? confirmPassword : password;
    const currentRefs = isConfirm ? confirmRefs : passwordRefs;

    return (
      <div className="mt-1 flex justify-between gap-2">
        {currentPassword.map((digit, index) => (
          <div key={index} className="w-full relative">
            <input
              id={`${isConfirm ? "confirm-" : ""}password-${index}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              ref={(el) => {
                if (el) currentRefs.current[index] = el;
              }}
              value={digit}
              onChange={(e) =>
                handlePasswordChange(index, e.target.value, isConfirm)
              }
              onKeyDown={(e) => handleInputKeyDown(index, e, isConfirm)}
              onPaste={
                index === 0 ? (e) => handleInputPaste(e, isConfirm) : undefined
              }
              className="block w-full py-3 text-center font-semibold text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              disabled={loading}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            LinaFlow
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            프리미엄 멤버십 가입 신청
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 p-4 rounded-md text-center">
            <p className="text-green-800 mb-4">
              회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인이
              가능합니다.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              로그인 페이지로 이동
            </button>
          </div>
        ) : (
          <form
            ref={formRef}
            className="mt-8 space-y-6"
            onSubmit={handleSubmit}
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  이름 *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="nickname"
                  className="block text-sm font-medium text-gray-700"
                >
                  별명 (선택)
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="birth_date"
                  className="block text-sm font-medium text-gray-700"
                >
                  생년월일 (선택)
                </label>
                <input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  이메일 *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="password-0"
                  className="block text-sm font-medium text-gray-700"
                >
                  비밀번호 (6자리 숫자) *
                </label>
                {renderPasswordFields(false)}
              </div>

              <div>
                <label
                  htmlFor="confirm-password-0"
                  className="block text-sm font-medium text-gray-700"
                >
                  비밀번호 확인 *
                </label>
                {renderPasswordFields(true)}
                <p className="mt-1 text-xs text-gray-500 text-center">
                  모든 입력 완료 시 자동으로 신청됩니다
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
                  href="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  이미 계정이 있으신가요?
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
                  loading
                    ? "bg-indigo-400"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {loading ? "처리 중..." : "회원가입 신청"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
