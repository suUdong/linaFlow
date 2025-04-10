"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Member } from "@/lib/supabase";
import { checkAdminAccess } from "@/lib/auth";

export default function AdminMembers() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "pending" | "expired" | "cancelled"
  >("all");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editExpiredAt, setEditExpiredAt] = useState<string>("");

  const [newMember, setNewMember] = useState({
    name: "",
    nickname: "",
    birth_date: "",
    email: "",
    password: "",
    expired_at: "",
  });

  useEffect(() => {
    checkAdminStatus();
    fetchMembers();
    fetchPendingCount();
  }, [activeTab]);

  // 만료일이 지난 회원 자동 만료 처리
  useEffect(() => {
    const checkExpiredMembers = async () => {
      try {
        // 현재 날짜
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 만료일이 지났지만 아직 active 상태인 회원 가져오기
        const { data, error } = await supabase
          .from("members")
          .select("id")
          .eq("status", "active")
          .lt("expired_at", today.toISOString());

        if (error) throw error;

        if (data && data.length > 0) {
          // 만료일이 지난 회원을 expired 상태로 변경
          const { error: updateError } = await supabase
            .from("members")
            .update({ status: "expired" })
            .in(
              "id",
              data.map((member) => member.id)
            );

          if (updateError) throw updateError;

          // 목록 다시 로드
          fetchMembers();
        }
      } catch (err) {
        console.error("자동 만료 처리 중 오류 발생:", err);
      }
    };

    // 페이지 로드 시 자동 만료 처리 실행
    checkExpiredMembers();

    // 24시간마다 실행 (실제 운영에서는 서버 측에서 처리하는 것이 더 적합)
    const intervalId = setInterval(checkExpiredMembers, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
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

  const fetchMembers = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });

      // 탭에 따라 쿼리 조건 변경
      if (activeTab === "active") {
        query = query.eq("status", "active");
      } else if (activeTab === "pending") {
        query = query.eq("status", "pending");
      } else if (activeTab === "expired") {
        query = query.eq("status", "expired");
      } else if (activeTab === "cancelled") {
        query = query.eq("status", "cancelled");
      }

      const { data, error } = await query;

      if (error) throw error;

      setMembers(data || []);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMember((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 간단한 유효성 검사
      if (!newMember.name || !newMember.email || !newMember.password) {
        setError("필수 항목을 모두 입력해주세요.");
        return;
      }

      // 비밀번호 검증 (6자리 숫자)
      if (!/^\d{6}$/.test(newMember.password)) {
        setError("비밀번호는 6자리 숫자여야 합니다.");
        return;
      }

      const { error } = await supabase.from("members").insert([
        {
          name: newMember.name,
          nickname: newMember.nickname || newMember.name,
          birth_date: newMember.birth_date,
          email: newMember.email,
          password_hash: newMember.password, // 실제 구현에서는 bcrypt로 해시 필요
          status: "active",
          expired_at: newMember.expired_at || null,
        },
      ]);

      if (error) throw error;

      // 폼 초기화
      setNewMember({
        name: "",
        nickname: "",
        birth_date: "",
        email: "",
        password: "",
        expired_at: "",
      });

      // 목록 다시 로드
      fetchMembers();

      // 승인 대기 숫자 다시 로드 (다른 상태와의 일관성을 위해)
      fetchPendingCount();

      setError("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "회원 추가 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: "active" | "expired" | "cancelled" | "pending"
  ) => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // 목록 다시 로드
      fetchMembers();

      // 승인 대기 숫자 다시 로드
      fetchPendingCount();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "회원 상태 변경 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  const handleUpdateExpiredAt = async (id: string) => {
    if (!editExpiredAt) {
      setError("만료일을 선택해주세요.");
      return;
    }

    try {
      const { error } = await supabase
        .from("members")
        .update({ expired_at: editExpiredAt })
        .eq("id", id);

      if (error) throw error;

      // 편집 모드 종료
      setEditingMemberId(null);
      setEditExpiredAt("");

      // 목록 다시 로드
      fetchMembers();

      // 승인 대기 숫자 다시 로드
      fetchPendingCount();

      setError("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "만료일 변경 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditExpiredAt("");
  };

  const handleStartEditExpiredAt = (member: Member) => {
    setEditingMemberId(member.id);
    // 기존 만료일이 있으면 설정
    if (member.expired_at) {
      // yyyy-MM-dd 형식으로 변환
      const date = new Date(member.expired_at);
      setEditExpiredAt(date.toISOString().split("T")[0]);
    } else {
      setEditExpiredAt("");
    }
  };

  // 만료일이 변경되었는지 확인
  const isExpiredAtChanged = (member: Member) => {
    if (!member.expired_at && !editExpiredAt) return false;
    if (!member.expired_at && editExpiredAt) return true;

    const originalDate = member.expired_at
      ? new Date(member.expired_at).toISOString().split("T")[0]
      : "";
    return originalDate !== editExpiredAt;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "active":
        return "활성";
      case "expired":
        return "만료";
      case "cancelled":
        return "해지";
      case "pending":
        return "승인대기";
      default:
        return status;
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
          <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>

          <div className="flex space-x-4">
            <button
              onClick={() => router.push("/admin/contents")}
              className="text-gray-600 hover:text-gray-900"
            >
              콘텐츠 관리
            </button>
            <button
              onClick={() => router.push("/admin/guide")}
              className="text-gray-600 hover:text-gray-900"
            >
              관리 가이드
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 상태별 탭 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("all")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "all"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "active"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              활성 회원
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pending"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              승인 대기
              {pendingCount > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("expired")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "expired"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              만료 회원
            </button>
            <button
              onClick={() => setActiveTab("cancelled")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "cancelled"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              해지 회원
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">회원 목록</h3>
              </div>
              <div className="overflow-x-auto">
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
                        상태
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        만료일
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
                    {members.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          등록된 회원이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      members.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                                member.status
                              )}`}
                            >
                              {formatStatus(member.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingMemberId === member.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="date"
                                  value={editExpiredAt}
                                  onChange={(e) =>
                                    setEditExpiredAt(e.target.value)
                                  }
                                  className="block w-full text-sm border-gray-300 rounded-md"
                                />
                                <button
                                  onClick={() =>
                                    handleUpdateExpiredAt(member.id)
                                  }
                                  className={`p-1 ${
                                    isExpiredAtChanged(member)
                                      ? "text-green-600 hover:text-green-900"
                                      : "text-gray-300 cursor-not-allowed"
                                  }`}
                                  disabled={!isExpiredAtChanged(member)}
                                >
                                  저장
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1 text-gray-600 hover:text-gray-900"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span>
                                  {member.expired_at
                                    ? new Date(
                                        member.expired_at
                                      ).toLocaleDateString("ko-KR")
                                    : "-"}
                                </span>
                                <button
                                  onClick={() =>
                                    handleStartEditExpiredAt(member)
                                  }
                                  className="p-1 text-indigo-600 hover:text-indigo-900"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              {member.status !== "active" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(member.id, "active")
                                  }
                                  className="text-green-600 hover:text-green-900"
                                >
                                  활성화
                                </button>
                              )}
                              {member.status !== "expired" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(member.id, "expired")
                                  }
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  만료
                                </button>
                              )}
                              {member.status !== "cancelled" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(member.id, "cancelled")
                                  }
                                  className="text-red-600 hover:text-red-900"
                                >
                                  해지
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">회원 추가</h3>
              </div>
              <div className="p-4">
                <form onSubmit={handleAddMember}>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        이름 *
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={newMember.name}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="nickname"
                        className="block text-sm font-medium text-gray-700"
                      >
                        별명
                      </label>
                      <input
                        type="text"
                        name="nickname"
                        id="nickname"
                        value={newMember.nickname}
                        onChange={handleInputChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="birth_date"
                        className="block text-sm font-medium text-gray-700"
                      >
                        생년월일
                      </label>
                      <input
                        type="date"
                        name="birth_date"
                        id="birth_date"
                        value={newMember.birth_date}
                        onChange={handleInputChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                        type="email"
                        name="email"
                        id="email"
                        value={newMember.email}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        비밀번호 (6자리 숫자) *
                      </label>
                      <input
                        type="text"
                        name="password"
                        id="password"
                        value={newMember.password}
                        onChange={handleInputChange}
                        required
                        pattern="\d{6}"
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="expired_at"
                        className="block text-sm font-medium text-gray-700"
                      >
                        만료일
                      </label>
                      <input
                        type="date"
                        name="expired_at"
                        id="expired_at"
                        value={newMember.expired_at}
                        onChange={handleInputChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        회원 추가
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
