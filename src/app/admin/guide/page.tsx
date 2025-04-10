"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkAdminAccess } from "@/lib/auth";

export default function AdminGuide() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">관리자 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">관리 가이드</h2>

          <div className="flex space-x-4">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-gray-600 hover:text-gray-900"
            >
              대시보드
            </button>
            <button
              onClick={() => router.push("/admin/members")}
              className="text-gray-600 hover:text-gray-900"
            >
              회원 관리
            </button>
            <button
              onClick={() => router.push("/admin/contents")}
              className="text-gray-600 hover:text-gray-900"
            >
              콘텐츠 관리
            </button>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              LinaFlow 사용 가이드
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              효과적인 콘텐츠 및 회원 관리를 위한 안내서입니다.
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              회원가입 신청 관리
            </h4>

            <div className="prose prose-sm text-gray-500 mb-6">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>회원가입 신청 확인:</strong> 새로운 회원가입 신청이
                  있을 경우 회원 관리 페이지 상단에 신청 개수가 표시됩니다.
                </li>
                <li>
                  <strong>승인 절차:</strong> '승인 대기' 페이지에서 신청자
                  정보를 확인하고 승인 또는 거부할 수 있습니다.
                </li>
                <li>
                  <strong>승인 후 처리:</strong> 신청을 승인하면 해당 회원은
                  곧바로 로그인하여 콘텐츠에 접근할 수 있습니다.
                </li>
                <li>
                  <strong>거부 처리:</strong> 신청을 거부하면 해당 회원은
                  로그인할 수 없으며, 필요 시 다시 신청하도록 안내해야 합니다.
                </li>
              </ol>
            </div>

            <h4 className="text-lg font-medium text-gray-900 mb-4">
              회원 관리
            </h4>

            <div className="prose prose-sm text-gray-500 mb-6">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>회원 추가:</strong> '회원 관리' 페이지에서 이름,
                  이메일, 비밀번호(6자리 숫자) 및 만료일을 입력하여 새 회원을
                  추가할 수 있습니다.
                </li>
                <li>
                  <strong>회원 상태 관리:</strong> 회원 목록에서 활성화, 만료,
                  해지 등의 상태 변경이 가능합니다.
                </li>
                <li>
                  <strong>자동 만료:</strong> 회원 추가 시 만료일을 설정하면,
                  해당 날짜 이후에는 콘텐츠 접근이 제한됩니다.
                </li>
              </ol>
            </div>

            <h4 className="text-lg font-medium text-gray-900 mb-4">
              콘텐츠 관리
            </h4>

            <div className="prose prose-sm text-gray-500 mb-6">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>YouTube 콘텐츠 준비:</strong>
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
                  <strong>콘텐츠 추가:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>
                      '콘텐츠 관리' 페이지에서 제목, 설명, 복사한 YouTube URL을
                      입력합니다.
                    </li>
                    <li>
                      '비디오 키 생성' 버튼을 클릭하거나 직접 고유한 키를
                      입력합니다.
                    </li>
                    <li>
                      공개 여부를 설정하고 '콘텐츠 추가' 버튼을 클릭합니다.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>콘텐츠 관리:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>
                      콘텐츠 목록에서 '보기' 버튼을 클릭하여 실제 재생 화면을
                      확인할 수 있습니다.
                    </li>
                    <li>
                      공개/비공개 상태를 변경하거나 필요 시 콘텐츠를 삭제할 수
                      있습니다.
                    </li>
                  </ul>
                </li>
              </ol>
            </div>

            <h4 className="text-lg font-medium text-gray-900 mb-4">
              사용자 접근 방법
            </h4>

            <div className="prose prose-sm text-gray-500 mb-8">
              <p>회원들은 다음과 같은 방법으로 콘텐츠에 접근할 수 있습니다:</p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>브라우저에서 플랫폼 메인 페이지 접속</li>
                <li>제공된 이메일과 6자리 비밀번호로 로그인</li>
                <li>콘텐츠 목록에서 원하는 영상 선택하여 시청</li>
              </ol>
              <p className="mt-4">
                모바일 환경에서도 동일한 방법으로 접근이 가능합니다.
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                주의사항
              </h4>
              <ul className="list-disc pl-5 text-xs text-yellow-700 space-y-1">
                <li>
                  YouTube 계정 관리를 철저히 하여 콘텐츠가 무단으로 공유되지
                  않도록 주의하세요.
                </li>
                <li>
                  회원 비밀번호는 보안을 위해 주기적으로 변경하는 것이 좋습니다.
                </li>
                <li>콘텐츠 업로드 시 저작권에 문제가 없는지 확인하세요.</li>
                <li>
                  승인 대기 중인 회원 신청은 정기적으로 확인하여 빠른 처리를
                  권장합니다.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
