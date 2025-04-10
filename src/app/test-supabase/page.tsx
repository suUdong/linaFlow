"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  testSupabaseConnection,
  getAllMembers,
  getAllContents,
} from "@/lib/supabase-test";
import { Member, Content } from "@/lib/supabase";

export default function TestSupabase() {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function runTests() {
      try {
        setLoading(true);

        // 연결 테스트
        const connected = await testSupabaseConnection();
        setConnectionStatus(connected);

        if (connected) {
          // 회원 정보 가져오기
          const { data: membersData, error: membersError } =
            await getAllMembers();
          if (membersError) throw membersError;
          setMembers(membersData || []);

          // 콘텐츠 정보 가져오기
          const { data: contentsData, error: contentsError } =
            await getAllContents();
          if (contentsError) throw contentsError;
          setContents(contentsData || []);
        }
      } catch (err) {
        console.error("테스트 중 오류 발생:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    }

    runTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Supabase 연결 테스트 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Supabase 연동 테스트
          </h2>

          <button
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            홈으로 돌아가기
          </button>
        </div>

        {/* 연결 상태 표시 */}
        <div
          className={`p-4 mb-6 rounded-md ${
            connectionStatus === null
              ? "bg-gray-100"
              : connectionStatus
              ? "bg-green-100"
              : "bg-red-100"
          }`}
        >
          <h3 className="text-lg font-medium mb-2">
            연결 상태:{" "}
            {connectionStatus === null
              ? "테스트 중..."
              : connectionStatus
              ? "성공"
              : "실패"}
          </h3>
          {error && <p className="text-red-600">{error}</p>}
        </div>

        {/* 회원 데이터 표시 */}
        {connectionStatus && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">회원 정보</h3>
            </div>
            <div className="overflow-x-auto">
              {members.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  등록된 회원이 없습니다.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이메일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* 콘텐츠 데이터 표시 */}
        {connectionStatus && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">콘텐츠 정보</h3>
            </div>
            <div className="overflow-x-auto">
              {contents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  등록된 콘텐츠가 없습니다.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        비디오 키
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        공개 여부
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contents.map((content) => (
                      <tr key={content.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {content.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {content.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {content.video_key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {content.visible ? "공개" : "비공개"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
