"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Member } from "@/lib/supabase";
import { checkAdminAccess } from "@/lib/auth";

export default function AdminPendingMembers() {
  const router = useRouter();
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchPendingMembers();
  }, []);

  const checkAdminStatus = () => {
    // 관리자 권한 체크
    const hasAccess = checkAdminAccess();
    setIsAdmin(hasAccess);

    // 관리자가 아닌 경우 로그인 페이지로 리디렉션
    if (!hasAccess) {
      router.push("/login");
    }
  };

  const fetchPendingMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPendingMembers(data || []);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "회원 정보를 가져오는 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ status: "active" })
        .eq("id", id);

      if (error) throw error;

      // 승인 후 회원 관리 페이지로 이동
      router.push("/admin/members");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "회원 승인 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      // 목록 다시 로드
      fetchPendingMembers();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "회원 거부 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">관리자 권한이 없습니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            회원가입 승인 관리
          </h2>

          <div className="flex space-x-4">
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

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              승인 대기 중인 회원
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              회원가입 신청을 승인하거나 거부할 수 있습니다.
            </p>
          </div>

          <div className="overflow-x-auto">
            {pendingMembers.length === 0 ? (
              <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                승인 대기 중인 회원이 없습니다.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      이름
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      이메일
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      생년월일
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      신청일
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.birth_date
                          ? new Date(member.birth_date).toLocaleDateString(
                              "ko-KR"
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.created_at).toLocaleDateString(
                          "ko-KR"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(member.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(member.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            거부
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="mt-4 text-right">
          <span className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => fetchPendingMembers()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
            >
              새로고침
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
