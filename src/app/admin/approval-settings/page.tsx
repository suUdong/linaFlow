"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkAdminAccess } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import AdminNavigation from "@/components/AdminNavigation";
import AdminHeader from "@/components/AdminHeader";

export default function AdminApprovalSettingsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState({
    autoApproveSignup: false,
    defaultExpirationMonths: 3,
  });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Supabase 연결 정보 디버깅
    console.log("Supabase 연결 정보 확인");
    console.log(
      "NEXT_PUBLIC_SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    console.log(
      "NEXT_PUBLIC_SUPABASE_KEY 존재 여부:",
      !!process.env.NEXT_PUBLIC_SUPABASE_KEY
    );

    checkAdminStatus();
    fetchSettings();
    fetchPendingCount();
  }, []);

  const checkAdminStatus = () => {
    // 관리자 권한 체크
    const hasAccess = checkAdminAccess();
    setIsAdmin(hasAccess);
    setLoading(false);

    // 관리자가 아닌 경우 로그인 페이지로 리디렉션
    if (!hasAccess) {
      router.push("/login");
    }
  };

  // 승인 대기 중인 회원 수 가져오기
  const fetchPendingCount = async () => {
    try {
      console.log("승인 대기 회원 수 조회 중...");
      // HEAD 메서드 대신 GET 요청으로 카운트
      const { data, error } = await supabase
        .from("members")
        .select("id")
        .eq("status", "pending");

      if (error) throw error;

      // 데이터 배열의 길이로 카운트
      const count = data ? data.length : 0;
      console.log(`승인 대기 회원 수: ${count}명`);
      setPendingCount(count);
    } catch (err) {
      console.error("승인 대기 회원 수를 가져오는 중 오류 발생:", err);
    }
  };

  // 시스템 설정 가져오기
  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log("시스템 설정 가져오기 시도...");

      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("시스템 설정 조회 중 오류 발생:", error);
        throw error;
      }

      console.log("조회된 시스템 설정:", data);

      if (data) {
        setSettings({
          autoApproveSignup: data.auto_approve_signup || false,
          defaultExpirationMonths: data.default_expiration_months || 3,
        });
      } else {
        console.log("시스템 설정이 없습니다. 기본값 사용");
      }
    } catch (err) {
      console.error("설정 정보를 가져오는 중 오류 발생:", err);
      setError("설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 설정 저장
  const saveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // 기존 설정 확인 전에 Supabase 연결 상태 확인
      try {
        console.log("Supabase 연결 상태 확인 중...");
        // HEAD 메서드 대신 일반 GET 요청으로 간단한 쿼리 실행
        const { error: pingError } = await supabase
          .from("system_settings")
          .select("id")
          .limit(1);

        if (pingError) {
          console.error("Supabase 연결 확인 중 오류:", pingError);
          throw new Error(
            `Supabase 서버 연결에 실패했습니다: ${pingError.message}`
          );
        }
        console.log("Supabase 연결 확인 성공");
      } catch (pingCheckErr) {
        console.error("Supabase 연결 확인 자체에 실패:", pingCheckErr);
        throw new Error(
          "데이터베이스 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요."
        );
      }

      // 기존 설정 확인
      const { data: existingSettings, error: fetchError } = await supabase
        .from("system_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("기존 설정 확인 중 오류:", fetchError);
        throw new Error(`설정 정보 조회 실패: ${fetchError.message}`);
      }

      let operation;
      let operationResult;

      if (existingSettings) {
        // 기존 설정 업데이트
        operation = supabase
          .from("system_settings")
          .update({
            auto_approve_signup: settings.autoApproveSignup,
            default_expiration_months: settings.defaultExpirationMonths,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSettings.id);

        console.log("업데이트 작업 수행:", existingSettings.id);
        operationResult = await operation;
      } else {
        // 새 설정 생성
        operation = supabase.from("system_settings").insert([
          {
            auto_approve_signup: settings.autoApproveSignup,
            default_expiration_months: settings.defaultExpirationMonths,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        console.log("새 설정 생성 작업 수행");
        operationResult = await operation;
      }

      if (operationResult.error) {
        console.error("설정 저장 작업 중 오류:", operationResult.error);
        throw new Error(`설정 저장 실패: ${operationResult.error.message}`);
      }

      console.log("설정 저장 성공:", operationResult);
      setSuccess("설정이 성공적으로 저장되었습니다.");
    } catch (err) {
      console.error("설정 저장 중 오류:", err);
      // 더 자세한 오류 메시지 표시
      const errorMessage =
        err instanceof Error
          ? err.message
          : "알 수 없는 오류로 설정 저장에 실패했습니다.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
          <p className="text-pink-600 mt-3">설정 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <p className="text-red-500">관리자 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between mb-4 items-start md:items-center gap-4">
          <AdminNavigation
            currentPath="/admin/approval-settings"
            pendingCount={pendingCount}
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 mr-2 text-pink-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            가입승인설정
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-6 rounded-lg text-red-800 text-sm">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 p-4 mb-6 rounded-lg text-green-800 text-sm">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-green-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {success}
            </div>
          </div>
        )}

        <AdminApprovalSettings
          settings={settings}
          onSettingsChange={setSettings}
          onSave={saveSettings}
          saving={saving}
        />
      </div>
    </div>
  );
}

// AdminApprovalSettings 컴포넌트 추가
function AdminApprovalSettings({
  settings,
  onSettingsChange,
  onSave,
  saving,
}: {
  settings: { autoApproveSignup: boolean; defaultExpirationMonths: number };
  onSettingsChange: (settings: {
    autoApproveSignup: boolean;
    defaultExpirationMonths: number;
  }) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        회원 가입 승인 설정
      </h3>

      <div className="space-y-6">
        <div className="flex items-center">
          <input
            id="auto-approve"
            type="checkbox"
            className="h-5 w-5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            checked={settings.autoApproveSignup}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                autoApproveSignup: e.target.checked,
              })
            }
          />
          <label
            htmlFor="auto-approve"
            className="ml-3 block text-sm font-medium text-gray-700"
          >
            회원 가입 자동 승인
          </label>
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="ml-3">
              이 설정을 활성화하면 새로운 회원이 가입할 때 관리자 승인 없이 즉시
              서비스를 이용할 수 있습니다.
              <br />
              <br />
              비활성화 상태에서는 관리자가 회원 목록에서 수동으로 승인해야
              합니다.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            기본 만료 기간 설정
          </h4>

          <div className="mb-4">
            <label
              htmlFor="expiration-months"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              가입 시 기본 만료 기간 (개월)
            </label>
            <div className="flex items-center">
              <input
                id="expiration-months"
                type="number"
                min="1"
                max="120"
                value={settings.defaultExpirationMonths}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    defaultExpirationMonths: parseInt(e.target.value) || 3,
                  })
                }
                className="block w-24 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none transition-colors"
              />
              <span className="ml-2 text-sm text-gray-600">개월</span>
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="ml-3">
                쿠폰을 사용하지 않는 일반 회원 가입 시 적용되는 기본 만료
                기간입니다.
                <br />
                <br />
                관리자가 회원 승인 시에도 이 값이 기본으로 적용됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-300 disabled:cursor-not-allowed"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                저장 중...
              </>
            ) : (
              "설정 저장"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
