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
    coupon_code: "",
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
  const [autoApproved, setAutoApproved] = useState(false);

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

      // 시스템 설정 확인 - 자동 승인 여부
      const { data: systemSettings, error: settingsError } = await supabase
        .from("system_settings")
        .select("auto_approve_signup, default_expiration_months")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (settingsError) throw settingsError;

      // 자동 승인 설정 가져오기 (설정이 없으면 false로 기본값 설정)
      const autoApproveSignup = systemSettings?.auto_approve_signup || false;
      // 기본 만료 기간 설정 가져오기 (설정이 없으면 3개월로 기본값 설정)
      const defaultExpirationMonths =
        systemSettings?.default_expiration_months || 3;

      // 쿠폰 코드 검증 (입력된 경우에만)
      let couponIsValid = true;
      let couponDuration = 0;

      if (formData.coupon_code) {
        const { data: couponData, error: couponError } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", formData.coupon_code)
          .eq("is_used", false)
          .maybeSingle();

        if (couponError) throw couponError;

        if (!couponData) {
          setError("유효하지 않은 쿠폰 코드입니다.");
          setLoading(false);
          return;
        }

        // 만료 날짜 확인
        const expiryDate = new Date(couponData.expires_at);
        if (expiryDate < new Date()) {
          setError("만료된 쿠폰 코드입니다.");
          setLoading(false);
          return;
        }

        couponIsValid = true;
        couponDuration = couponData.duration_months;
      }

      // 회원 가입 신청
      const { error: insertError } = await supabase.from("members").insert([
        {
          name: formData.name,
          nickname: formData.nickname || formData.name,
          birth_date: formData.birth_date || null,
          email: formData.email,
          password_hash: passwordString, // 실제 구현에서는 bcrypt로 해시 필요
          status: autoApproveSignup ? "active" : "pending", // 자동 승인 설정에 따라 상태 결정
          created_at: new Date().toISOString(),
          coupon_code: formData.coupon_code || null,
          // 쿠폰 사용 시 쿠폰의 만료일 설정, 그렇지 않으면 기본 만료 기간 적용
          expired_at:
            couponDuration > 0
              ? new Date(
                  new Date().setMonth(new Date().getMonth() + couponDuration)
                ).toISOString()
              : new Date(
                  new Date().setMonth(
                    new Date().getMonth() + defaultExpirationMonths
                  )
                ).toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      // 쿠폰 사용 처리 (유효한 쿠폰이 있는 경우)
      if (formData.coupon_code && couponIsValid) {
        // 사용자 ID 조회
        const { data: newUser } = await supabase
          .from("members")
          .select("id")
          .eq("email", formData.email)
          .single();

        if (newUser) {
          // 쿠폰 사용 처리
          await supabase
            .from("coupons")
            .update({
              is_used: true,
              used_by: newUser.id,
              used_at: new Date().toISOString(),
            })
            .eq("code", formData.coupon_code);
        }
      }

      // 자동 승인 여부 설정
      setAutoApproved(autoApproveSignup);

      // 가입 신청 완료
      setSuccess(true);

      // 폼 초기화
      setFormData({
        name: "",
        nickname: "",
        birth_date: "",
        email: "",
        coupon_code: "",
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
      <div className="mt-2 flex justify-between gap-2">
        {currentPassword.map((digit, index) => (
          <div key={index} className="w-full relative">
            <input
              id={`${isConfirm ? "confirm-" : ""}password-${index}`}
              type="text"
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
              className="block w-12 h-12 rounded-lg border border-gray-300 px-3 py-2 text-center shadow-sm text-xl font-semibold focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition-colors password-dots"
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <style jsx global>{`
          .password-dots {
            -webkit-text-security: disc;
            text-security: disc;
          }
        `}</style>

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
            가입 신청서
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200 shadow-sm">
            <p className="text-green-800 mb-4 font-medium">
              {autoApproved
                ? "회원가입이 완료되었습니다. 지금 바로 로그인하여 서비스를 이용할 수 있습니다."
                : "회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다."}
            </p>
            <button
              onClick={() => router.push("/login")}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
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
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-3 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition-colors"
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
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-3 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition-colors"
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
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-3 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition-colors"
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
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 mt-1 block w-full rounded-lg border border-gray-300 px-3 py-3 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition-colors"
                    disabled={loading}
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="coupon_code"
                  className="block text-sm font-medium text-gray-700"
                >
                  쿠폰 코드 (선택)
                </label>
                <input
                  id="coupon_code"
                  name="coupon_code"
                  type="text"
                  value={formData.coupon_code}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-3 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition-colors"
                  disabled={loading}
                  placeholder="쿠폰 코드가 있다면 입력하세요"
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

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/login"
                  className="font-medium text-pink-600 hover:text-pink-800 hover:underline transition-colors"
                >
                  이미 계정이 있으신가요?
                </Link>
              </div>
            </div>

            {loading && (
              <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                <div className="h-full bg-pink-600 animate-pulse-x"></div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                  loading
                    ? "bg-pink-400 cursor-not-allowed"
                    : "bg-pink-600 hover:bg-pink-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 shadow-md transform transition-transform duration-150 ease-in-out`}
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
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {loading ? "처리 중..." : "회원가입 신청"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
