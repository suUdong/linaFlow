"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkAdminAccess } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/AdminHeader";
import AdminNavigation from "@/components/AdminNavigation";

export default function AdminGuide() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    checkAdminStatus();
    if (isAdmin) {
      fetchPendingCount();
    }
  }, [isAdmin]);

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

  const fetchPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      setPendingCount(count || 0);
    } catch (err) {
      console.error("승인 대기 회원 수를 가져오는 중 오류 발생:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
          <p className="text-pink-600 mt-3">가이드 정보 로딩 중...</p>
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
        <div className="flex flex-col md:flex-row justify-between mb-6 items-start md:items-center gap-4">
          <AdminNavigation
            currentPath="/admin/guide"
            pendingCount={pendingCount}
          />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7 mr-2 text-pink-600"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
              관리 가이드
            </h2>
          </div>

          <div className="bg-white shadow-md overflow-hidden rounded-lg border border-gray-100">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-pink-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 mr-2 text-pink-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd"
                  />
                </svg>
                RenaFlow 사용 가이드
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                효과적인 콘텐츠 및 회원 관리를 위한 안내서입니다.
              </p>
            </div>

            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-6 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-pink-600"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-pink-800">
                      중요 안내
                    </h3>
                    <div className="mt-2 text-sm text-pink-700">
                      <p>
                        관리자 페이지에서의 모든 작업은 즉시 시스템에
                        반영됩니다. 변경 사항을 신중하게 검토하시기 바랍니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-pink-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                회원가입 신청 관리
              </h4>

              <div className="prose prose-sm text-gray-500 mb-6 pl-7">
                <ol className="list-decimal space-y-2">
                  <li>
                    <strong className="text-pink-700">
                      회원가입 신청 확인:
                    </strong>{" "}
                    새로운 회원가입 신청이 있을 경우 회원 관리 페이지 상단에
                    신청 개수가 표시됩니다.
                  </li>
                  <li>
                    <strong className="text-pink-700">승인 절차:</strong> '승인
                    대기' 탭에서 신청자 정보를 확인하고 승인 또는 거부할 수
                    있습니다.
                  </li>
                  <li>
                    <strong className="text-pink-700">승인 후 처리:</strong>{" "}
                    신청을 승인하면 해당 회원은 곧바로 로그인하여 콘텐츠에
                    접근할 수 있습니다.
                  </li>
                  <li>
                    <strong className="text-pink-700">거부 처리:</strong> 신청을
                    거부하면 해당 회원은 로그인할 수 없으며, 필요 시 다시
                    신청하도록 안내해야 합니다.
                  </li>
                </ol>
              </div>

              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-pink-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                회원 관리
              </h4>

              <div className="prose prose-sm text-gray-500 mb-6 pl-7">
                <ol className="list-decimal space-y-2">
                  <li>
                    <strong className="text-pink-700">회원 추가:</strong> '회원
                    관리' 페이지에서 이름, 이메일, 비밀번호(6자리 숫자) 및
                    만료일을 입력하여 새 회원을 추가할 수 있습니다.
                  </li>
                  <li>
                    <strong className="text-pink-700">회원 상태 관리:</strong>{" "}
                    회원 목록에서 활성화, 만료, 해지 등의 상태 변경이
                    가능합니다.
                  </li>
                  <li>
                    <strong className="text-pink-700">자동 만료:</strong> 회원
                    추가 시 만료일을 설정하면, 해당 날짜 이후에는 콘텐츠 접근이
                    제한됩니다.
                  </li>
                </ol>
              </div>

              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-pink-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z"
                    clipRule="evenodd"
                  />
                </svg>
                콘텐츠 관리
              </h4>

              <div className="prose prose-sm text-gray-500 mb-6 pl-7">
                <ol className="list-decimal space-y-2">
                  <li>
                    <strong className="text-pink-700">
                      YouTube 콘텐츠 준비:
                    </strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>개인 YouTube 계정에 로그인합니다.</li>
                      <li>
                        영상을 업로드하고 가시성을 '비공개' 또는 '일부 공개'로
                        설정합니다.
                      </li>
                      <li>
                        업로드된 영상의 전체 URL을 복사합니다 (예:
                        https://www.youtube.com/watch?v=ABCDEF123456).
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong className="text-pink-700">콘텐츠 추가:</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>
                        '콘텐츠 관리' 페이지에서 제목, 설명, 복사한 YouTube
                        URL을 입력합니다.
                      </li>
                      <li>
                        '키 생성' 버튼을 클릭하거나 직접 고유한 키를 입력합니다.
                      </li>
                      <li>
                        공개 여부를 설정하고 '콘텐츠 추가' 버튼을 클릭합니다.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong className="text-pink-700">콘텐츠 관리:</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>
                        콘텐츠 목록에서 '보기' 버튼을 클릭하여 실제 재생 화면을
                        확인할 수 있습니다.
                      </li>
                      <li>
                        공개/비공개 상태를 변경하거나 필요 시 콘텐츠를 수정 또는
                        삭제할 수 있습니다.
                      </li>
                    </ul>
                  </li>
                </ol>
              </div>

              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-pink-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                    clipRule="evenodd"
                  />
                </svg>
                쿠폰 관리
              </h4>

              <div className="prose prose-sm text-gray-500 mb-6 pl-7">
                <ol className="list-decimal space-y-2">
                  <li>
                    <strong className="text-pink-700">쿠폰 생성:</strong> '쿠폰
                    관리' 페이지에서 고유한 쿠폰 코드, 적용 기간(개월), 만료일을
                    입력하여 새 쿠폰을 생성할 수 있습니다.
                  </li>
                  <li>
                    <strong className="text-pink-700">쿠폰 상태:</strong> 생성된
                    쿠폰은 '사용가능', '만료됨', '사용됨' 상태로 표시됩니다.
                  </li>
                  <li>
                    <strong className="text-pink-700">회원 적용:</strong>{" "}
                    사용자가 로그인 후 쿠폰을 사용하면 설정된 기간만큼 회원십이
                    자동으로 연장됩니다.
                  </li>
                </ol>
              </div>

              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-pink-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                사용자 접근 방법
              </h4>

              <div className="prose prose-sm text-gray-500 mb-8 pl-7">
                <p>
                  회원들은 다음과 같은 방법으로 콘텐츠에 접근할 수 있습니다:
                </p>
                <ol className="list-decimal space-y-2 mt-2">
                  <li>
                    웹사이트 메인 페이지(
                    <code>https://renaflow.vercel.app</code>)에 접속하여
                    로그인합니다.
                  </li>
                  <li>
                    로그인 후 콘텐츠 목록에서 원하는 영상을 선택하여 시청합니다.
                  </li>
                  <li>
                    직접 URL을 통해 특정 콘텐츠에 접근할 수도 있습니다:
                    <code>https://renaflow.vercel.app/watch/비디오키</code>
                  </li>
                </ol>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="font-medium text-pink-800 mb-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  기술 지원 및 도움말
                </h4>
                <p className="text-sm text-pink-700">
                  관리자 페이지 사용 중 문제가 발생하거나 추가 지원이 필요한
                  경우, 아래 연락처로 문의해주세요:
                </p>
                <p className="text-sm font-medium text-pink-800 mt-2">
                  기술 지원: support@renaflow.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
